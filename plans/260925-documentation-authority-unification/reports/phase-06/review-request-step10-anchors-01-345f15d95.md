# Bounded re-review: anchors, part 1

Author session: `codex-session:unit-run-1792093168554-f28af963@2026-10-16`
Packaged by: `codex-session:unit-run-1792094246578-b2fbe39b@2026-10-16`
Content pin / SYNC: `345f15d95663260976200be66d1b9a6c648bcd6d`
Comparison base: `4a18f35ff5d6a9b7a07e955bd64418282c6a91b2`
Entries: **39**, maximum120 per request.

[Single request index](review-request-step10-index-345f15d95.md). [A36 exact lists](step10-sync345-A36.json). This is one combined bounded request set for all changes at345f15d95 and the current package. Historical before records are witnesses, not current dispositions. Source authors and current row authors remain exact. No producer seed, draw or verdict is selected.

Every submitted manual claim gets digest recomputation, anchor and shard/pack equality checks and an ordinary verdict with a `deep` or `mechanical` note. All unequal source/target digests, partial carries and historical claims are deep. All explicitly marked re-anchor, link, rationale, L10-22, tool, content and accounting deltas are deep. The independent reviewer seeds at least 69/460 Weak-exact/Judgment rows, records seed/sample IDs, and deep-reads the whole pack if >3% of deep rows need rework. Existing truth samples and checkpoint obligations remain unchanged.

Only decisions/historical entries request claim verdicts. Anchors, rationale proofs, native tuples and other accounting entries request item-specific review; they do not create additional claim approvals. Entries marked `changed-review-application-confirmation` preserve existing committed ordinary approvals and request confirmation of exact application; packaging does not revoke or approve them. New/changed pending rows carry no old approval. The runner's package commit supplies the new predecessor shard and request files; immutable document/helper bytes are pinned above.

## Entry anchors-001

```json
{
  "kind": "content-reanchoring-proof",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-data-dictionary.json",
  "collection": "claims",
  "before": {
    "claimId": "claim_6dfbaa59a2f49bc668d9729fed01878a",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "sourceUnitDigest": "8b3e099723160029",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-14",
    "claimKind": "contract",
    "disposition": "merge",
    "reviewStatus": "pending",
    "rationale": "Four-field envelope description is stated in both sources; candidate carries the work-state block (this one) plus the io-contract block (lines 49-60 of io) under Envelope Shape, nothing dropped. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetUnitDigest": "25e4a007d2fc9a153cb3273376471f15e4bfca5c257f0c8bf06d1dd6af198770",
    "targetAncestry": [
      "CLI I/O Contract",
      "2. Input Direction Verb And Identity",
      "Caller Role"
    ]
  },
  "after": {
    "claimId": "claim_6dfbaa59a2f49bc668d9729fed01878a",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "sourceUnitDigest": "8b3e099723160029",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-15",
    "claimKind": "contract",
    "disposition": "merge",
    "reviewStatus": "pending",
    "rationale": "Four-field envelope description is stated in both sources; candidate carries the work-state block (this one) plus the io-contract block (lines 49-60 of io) under Envelope Shape, nothing dropped. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. L10-21: content-based rebind from reviewed prior target unheaded-block-14 (8b3e099723160029770c62469f14db6ce2e484a6f7b4a1354cb4bf34288af9d4) to unheaded-block-15 (8b3e099723160029770c62469f14db6ce2e484a6f7b4a1354cb4bf34288af9d4); inserted paragraphs shift the anchor, prior target text is unchanged.",
    "targetUnitDigest": "8b3e099723160029770c62469f14db6ce2e484a6f7b4a1354cb4bf34288af9d4",
    "targetAncestry": [
      "CLI I/O Contract",
      "3. Output Direction Unified Envelope",
      "Envelope Shape"
    ]
  },
  "prior": {
    "claimId": "claim_6dfbaa59a2f49bc668d9729fed01878a",
    "authoredBy": "codex-session:1@2026-10-09",
    "sourceUnitDigest": "8b3e099723160029",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-14",
    "claimKind": "contract",
    "disposition": "merge",
    "reviewStatus": "reviewed",
    "rationale": "Four-field envelope description is stated in both sources; candidate carries the work-state block (this one) plus the io-contract block (lines 49-60 of io) under Envelope Shape, nothing dropped.",
    "reviewNote": "Unchanged under A14. merge/contract: work-state.md L624-634 (unheaded-block-63) -> contracts/cli-io-contract.md#unheaded-block-14 L115-125; targetOwner/targetAnchor contracts/cli-io-contract.md#unheaded-block-14. 54c2698ee vs HEAD decision: disposition, targetOwner/Anchor, claimKind, rationale, sourceUnitDigest and targetUnitDigest byte-equal; only authoredBy/reviewStatus/reviewedBy/reviewedAt reset. Source and target unit digests re-extracted at HEAD, d870fe07 and 54c2698ee with the repo extractor and equal the stated full digests.",
    "reviewedBy": "reviewer:claude-session:4df9e88c@2026-10-09",
    "reviewedAt": "2026-10-09",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-2reframe-b-data-dictionary.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "8b3e099723160029770c62469f14db6ce2e484a6f7b4a1354cb4bf34288af9d4",
    "targetAncestry": [
      "CLI I/O Contract",
      "3. Output Direction Unified Envelope",
      "Envelope Shape"
    ],
    "reviewReportCommit": "d23045c2de83e3508fda8fd2580b43ece2e1e046"
  },
  "targetWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-15",
    "githubAnchor": "unheaded-block-15",
    "stableAnchor": "unheaded-block-15",
    "title": "Unheaded block 15",
    "startLine": 133,
    "endLine": 143,
    "textDigest": "8b3e099723160029770c62469f14db6ce2e484a6f7b4a1354cb4bf34288af9d4",
    "sample": "**Mọi verb** đều in kết quả thành công bọc trong một phong bì chuẩn duy nhất\nthay vì in thẳng dữ liệu hay câu chữ cho người. Phong bì có bốn trường:\n`contract` (tên+phiên bản chuẩn",
    "identityFingerprint": "9b12e65fe917f22123f6e96d3bfcf4332c1f8a0d3957624aa853e17ac283ca12",
    "ancestry": [
      "CLI I/O Contract",
      "3. Output Direction Unified Envelope",
      "Envelope Shape"
    ],
    "text": "**Mọi verb** đều in kết quả thành công bọc trong một phong bì chuẩn duy nhất\nthay vì in thẳng dữ liệu hay câu chữ cho người. Phong bì có bốn trường:\n`contract` (tên+phiên bản chuẩn phong bì), `generated_at` (thời điểm in),\n`data_hash` (dấu vân tay của dữ liệu — bên đọc biết dữ liệu đổi chưa mà không\ncần so từng trường), và `data` (dữ liệu thật của verb đó). Dữ liệu trong `data`\nlà **có cấu trúc** (các trường tên rõ nghĩa), không phải câu xác nhận cho người:\nverb đọc (`list`/`ready`/`check`/…) trả thẳng đối tượng kết quả; verb ghi trả\nđúng những trường nó vừa đổi (ví dụ chuyển trạng thái trả `{id, from, to, seq}`)\n— nhờ vậy một surface bất kỳ đọc kết quả bằng MỘT bộ đọc chung, không phải dò\nregex trên chữ. Phong bì được đóng tại **một cửa in duy nhất**, nên không verb\nnào lọt lưới và không có hai cách in khác nhau."
  },
  "relatedClaimId": "claim_6dfbaa59a2f49bc668d9729fed01878a",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_6dfbaa59a2f49bc668d9729fed01878a",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "sourceUnitDigest": "8b3e099723160029",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-15",
    "claimKind": "contract",
    "disposition": "merge",
    "reviewStatus": "pending",
    "rationale": "Four-field envelope description is stated in both sources; candidate carries the work-state block (this one) plus the io-contract block (lines 49-60 of io) under Envelope Shape, nothing dropped. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. L10-21: content-based rebind from reviewed prior target unheaded-block-14 (8b3e099723160029770c62469f14db6ce2e484a6f7b4a1354cb4bf34288af9d4) to unheaded-block-15 (8b3e099723160029770c62469f14db6ce2e484a6f7b4a1354cb4bf34288af9d4); inserted paragraphs shift the anchor, prior target text is unchanged.",
    "targetUnitDigest": "8b3e099723160029770c62469f14db6ce2e484a6f7b4a1354cb4bf34288af9d4",
    "targetAncestry": [
      "CLI I/O Contract",
      "3. Output Direction Unified Envelope",
      "Envelope Shape"
    ]
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-15",
    "githubAnchor": "unheaded-block-15",
    "stableAnchor": "unheaded-block-15",
    "title": "Unheaded block 15",
    "startLine": 133,
    "endLine": 143,
    "textDigest": "8b3e099723160029770c62469f14db6ce2e484a6f7b4a1354cb4bf34288af9d4",
    "sample": "**Mọi verb** đều in kết quả thành công bọc trong một phong bì chuẩn duy nhất\nthay vì in thẳng dữ liệu hay câu chữ cho người. Phong bì có bốn trường:\n`contract` (tên+phiên bản chuẩn",
    "identityFingerprint": "9b12e65fe917f22123f6e96d3bfcf4332c1f8a0d3957624aa853e17ac283ca12",
    "ancestry": [
      "CLI I/O Contract",
      "3. Output Direction Unified Envelope",
      "Envelope Shape"
    ],
    "text": "**Mọi verb** đều in kết quả thành công bọc trong một phong bì chuẩn duy nhất\nthay vì in thẳng dữ liệu hay câu chữ cho người. Phong bì có bốn trường:\n`contract` (tên+phiên bản chuẩn phong bì), `generated_at` (thời điểm in),\n`data_hash` (dấu vân tay của dữ liệu — bên đọc biết dữ liệu đổi chưa mà không\ncần so từng trường), và `data` (dữ liệu thật của verb đó). Dữ liệu trong `data`\nlà **có cấu trúc** (các trường tên rõ nghĩa), không phải câu xác nhận cho người:\nverb đọc (`list`/`ready`/`check`/…) trả thẳng đối tượng kết quả; verb ghi trả\nđúng những trường nó vừa đổi (ví dụ chuyển trạng thái trả `{id, from, to, seq}`)\n— nhờ vậy một surface bất kỳ đọc kết quả bằng MỘT bộ đọc chung, không phải dò\nregex trên chữ. Phong bì được đóng tại **một cửa in duy nhất**, nên không verb\nnào lọt lưới và không có hai cách in khác nhau."
  },
  "oldAnchor": "unheaded-block-14",
  "newAnchor": "unheaded-block-15",
  "oldDigest": "8b3e099723160029770c62469f14db6ce2e484a6f7b4a1354cb4bf34288af9d4",
  "newDigest": "8b3e099723160029770c62469f14db6ce2e484a6f7b4a1354cb4bf34288af9d4",
  "deepRequired": true,
  "helper": "scripts/doc-binding-repair.mjs",
  "contentProof": {
    "priorCommit": "ab4d6274a",
    "priorMatchingUnits": [
      {
        "unitKind": "unheaded-block",
        "anchor": "unheaded-block-14",
        "githubAnchor": "unheaded-block-14",
        "stableAnchor": "unheaded-block-14",
        "title": "Unheaded block 14",
        "startLine": 123,
        "endLine": 133,
        "textDigest": "8b3e099723160029770c62469f14db6ce2e484a6f7b4a1354cb4bf34288af9d4",
        "sample": "**Mọi verb** đều in kết quả thành công bọc trong một phong bì chuẩn duy nhất\nthay vì in thẳng dữ liệu hay câu chữ cho người. Phong bì có bốn trường:\n`contract` (tên+phiên bản chuẩn",
        "identityFingerprint": "9b12e65fe917f22123f6e96d3bfcf4332c1f8a0d3957624aa853e17ac283ca12",
        "ancestry": [
          "CLI I/O Contract",
          "3. Output Direction Unified Envelope",
          "Envelope Shape"
        ],
        "text": "**Mọi verb** đều in kết quả thành công bọc trong một phong bì chuẩn duy nhất\nthay vì in thẳng dữ liệu hay câu chữ cho người. Phong bì có bốn trường:\n`contract` (tên+phiên bản chuẩn phong bì), `generated_at` (thời điểm in),\n`data_hash` (dấu vân tay của dữ liệu — bên đọc biết dữ liệu đổi chưa mà không\ncần so từng trường), và `data` (dữ liệu thật của verb đó). Dữ liệu trong `data`\nlà **có cấu trúc** (các trường tên rõ nghĩa), không phải câu xác nhận cho người:\nverb đọc (`list`/`ready`/`check`/…) trả thẳng đối tượng kết quả; verb ghi trả\nđúng những trường nó vừa đổi (ví dụ chuyển trạng thái trả `{id, from, to, seq}`)\n— nhờ vậy một surface bất kỳ đọc kết quả bằng MỘT bộ đọc chung, không phải dò\nregex trên chữ. Phong bì được đóng tại **một cửa in duy nhất**, nên không verb\nnào lọt lưới và không có hai cách in khác nhau."
      }
    ],
    "currentText": "**Mọi verb** đều in kết quả thành công bọc trong một phong bì chuẩn duy nhất\nthay vì in thẳng dữ liệu hay câu chữ cho người. Phong bì có bốn trường:\n`contract` (tên+phiên bản chuẩn phong bì), `generated_at` (thời điểm in),\n`data_hash` (dấu vân tay của dữ liệu — bên đọc biết dữ liệu đổi chưa mà không\ncần so từng trường), và `data` (dữ liệu thật của verb đó). Dữ liệu trong `data`\nlà **có cấu trúc** (các trường tên rõ nghĩa), không phải câu xác nhận cho người:\nverb đọc (`list`/`ready`/`check`/…) trả thẳng đối tượng kết quả; verb ghi trả\nđúng những trường nó vừa đổi (ví dụ chuyển trạng thái trả `{id, from, to, seq}`)\n— nhờ vậy một surface bất kỳ đọc kết quả bằng MỘT bộ đọc chung, không phải dò\nregex trên chữ. Phong bì được đóng tại **một cửa in duy nhất**, nên không verb\nnào lọt lưới và không có hai cách in khác nhau.",
    "allPriorMatchingTextsEqualCurrent": true,
    "helperReplayed": true
  },
  "reviewScope": "Re-anchor receipt; claim verdict belongs to decisions section.",
  "packagedBy": "codex-session:unit-run-1792094246578-b2fbe39b@2026-10-16",
  "currentContentCommit": "345f15d95663260976200be66d1b9a6c648bcd6d",
  "entryId": "anchors-001"
}
```

## Entry anchors-002

```json
{
  "kind": "content-reanchoring-proof",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-data-dictionary.json",
  "collection": "claims",
  "before": {
    "claimId": "claim_140216d27eb5609e8b5d51f718ecf493",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "sourceUnitDigest": "5d70ebc5bbf14b46",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-18",
    "claimKind": "contract",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "Error path not enveloped (stderr, exit code) is carried verbatim as its own block under Error Path Is Not Enveloped; io-contract states the same claim inside its envelope unit, so it also exists elsewhere in that heading, but this block was not merged. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetUnitDigest": "84367855d92bb2e3914cb9bc385c2dce9b5625c8acaf9e577c9c791e40d07e71",
    "targetAncestry": [
      "CLI I/O Contract",
      "3. Output Direction Unified Envelope",
      "Envelope Shape"
    ]
  },
  "after": {
    "claimId": "claim_140216d27eb5609e8b5d51f718ecf493",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "sourceUnitDigest": "5d70ebc5bbf14b46",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-19",
    "claimKind": "contract",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "Error path not enveloped (stderr, exit code) is carried verbatim as its own block under Error Path Is Not Enveloped; io-contract states the same claim inside its envelope unit, so it also exists elsewhere in that heading, but this block was not merged. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. L10-21: content-based rebind from reviewed prior target unheaded-block-18 (5d70ebc5bbf14b4604424fe9dc4e05c75110a85c0c24b6b1cb6e7a998bfaddc4) to unheaded-block-19 (5d70ebc5bbf14b4604424fe9dc4e05c75110a85c0c24b6b1cb6e7a998bfaddc4); inserted paragraphs shift the anchor, prior target text is unchanged.",
    "targetUnitDigest": "5d70ebc5bbf14b4604424fe9dc4e05c75110a85c0c24b6b1cb6e7a998bfaddc4",
    "targetAncestry": [
      "CLI I/O Contract",
      "3. Output Direction Unified Envelope",
      "Error Path Is Not Enveloped"
    ]
  },
  "prior": {
    "claimId": "claim_140216d27eb5609e8b5d51f718ecf493",
    "authoredBy": "codex-session:1@2026-10-09",
    "sourceUnitDigest": "5d70ebc5bbf14b46",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-18",
    "claimKind": "contract",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Error path not enveloped (stderr, exit code) is carried verbatim as its own block under Error Path Is Not Enveloped; io-contract states the same claim inside its envelope unit, so it also exists elsewhere in that heading, but this block was not merged.",
    "reviewNote": "Unchanged under A14. promote/contract: work-state.md L636-639 (unheaded-block-64) -> contracts/cli-io-contract.md#unheaded-block-18 L142-145; targetOwner/targetAnchor contracts/cli-io-contract.md#unheaded-block-18. 54c2698ee vs HEAD decision: disposition, targetOwner/Anchor, claimKind, rationale, sourceUnitDigest and targetUnitDigest byte-equal; only authoredBy/reviewStatus/reviewedBy/reviewedAt reset. Source and target unit digests re-extracted at HEAD, d870fe07 and 54c2698ee with the repo extractor and equal the stated full digests.",
    "reviewedBy": "reviewer:claude-session:4df9e88c@2026-10-09",
    "reviewedAt": "2026-10-09",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-2reframe-b-data-dictionary.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "5d70ebc5bbf14b4604424fe9dc4e05c75110a85c0c24b6b1cb6e7a998bfaddc4",
    "targetAncestry": [
      "CLI I/O Contract",
      "3. Output Direction Unified Envelope",
      "Error Path Is Not Enveloped"
    ],
    "reviewReportCommit": "d23045c2de83e3508fda8fd2580b43ece2e1e046"
  },
  "targetWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-19",
    "githubAnchor": "unheaded-block-19",
    "stableAnchor": "unheaded-block-19",
    "title": "Unheaded block 19",
    "startLine": 160,
    "endLine": 163,
    "textDigest": "5d70ebc5bbf14b4604424fe9dc4e05c75110a85c0c24b6b1cb6e7a998bfaddc4",
    "sample": "**Đường lỗi không bọc phong bì.** Chỉ đường thành công in phong bì ra `stdout`;\nkhi verb ném lỗi, chẩn đoán đi ra `stderr` kèm mã thoát theo bảng phân loại lỗi\n(stdout=dữ liệu, std",
    "identityFingerprint": "0f7d6b622276bd60f3607f619d603ba58a4496a16c988a2a4f2f3610470eb526",
    "ancestry": [
      "CLI I/O Contract",
      "3. Output Direction Unified Envelope",
      "Error Path Is Not Enveloped"
    ],
    "text": "**Đường lỗi không bọc phong bì.** Chỉ đường thành công in phong bì ra `stdout`;\nkhi verb ném lỗi, chẩn đoán đi ra `stderr` kèm mã thoát theo bảng phân loại lỗi\n(stdout=dữ liệu, stderr=chẩn đoán) — bên gọi phân biệt thành/bại bằng mã thoát,\nkhông phải bằng việc dò nội dung phong bì."
  },
  "relatedClaimId": "claim_140216d27eb5609e8b5d51f718ecf493",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_140216d27eb5609e8b5d51f718ecf493",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "sourceUnitDigest": "5d70ebc5bbf14b46",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-19",
    "claimKind": "contract",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "Error path not enveloped (stderr, exit code) is carried verbatim as its own block under Error Path Is Not Enveloped; io-contract states the same claim inside its envelope unit, so it also exists elsewhere in that heading, but this block was not merged. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. L10-21: content-based rebind from reviewed prior target unheaded-block-18 (5d70ebc5bbf14b4604424fe9dc4e05c75110a85c0c24b6b1cb6e7a998bfaddc4) to unheaded-block-19 (5d70ebc5bbf14b4604424fe9dc4e05c75110a85c0c24b6b1cb6e7a998bfaddc4); inserted paragraphs shift the anchor, prior target text is unchanged.",
    "targetUnitDigest": "5d70ebc5bbf14b4604424fe9dc4e05c75110a85c0c24b6b1cb6e7a998bfaddc4",
    "targetAncestry": [
      "CLI I/O Contract",
      "3. Output Direction Unified Envelope",
      "Error Path Is Not Enveloped"
    ]
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-19",
    "githubAnchor": "unheaded-block-19",
    "stableAnchor": "unheaded-block-19",
    "title": "Unheaded block 19",
    "startLine": 160,
    "endLine": 163,
    "textDigest": "5d70ebc5bbf14b4604424fe9dc4e05c75110a85c0c24b6b1cb6e7a998bfaddc4",
    "sample": "**Đường lỗi không bọc phong bì.** Chỉ đường thành công in phong bì ra `stdout`;\nkhi verb ném lỗi, chẩn đoán đi ra `stderr` kèm mã thoát theo bảng phân loại lỗi\n(stdout=dữ liệu, std",
    "identityFingerprint": "0f7d6b622276bd60f3607f619d603ba58a4496a16c988a2a4f2f3610470eb526",
    "ancestry": [
      "CLI I/O Contract",
      "3. Output Direction Unified Envelope",
      "Error Path Is Not Enveloped"
    ],
    "text": "**Đường lỗi không bọc phong bì.** Chỉ đường thành công in phong bì ra `stdout`;\nkhi verb ném lỗi, chẩn đoán đi ra `stderr` kèm mã thoát theo bảng phân loại lỗi\n(stdout=dữ liệu, stderr=chẩn đoán) — bên gọi phân biệt thành/bại bằng mã thoát,\nkhông phải bằng việc dò nội dung phong bì."
  },
  "oldAnchor": "unheaded-block-18",
  "newAnchor": "unheaded-block-19",
  "oldDigest": "5d70ebc5bbf14b4604424fe9dc4e05c75110a85c0c24b6b1cb6e7a998bfaddc4",
  "newDigest": "5d70ebc5bbf14b4604424fe9dc4e05c75110a85c0c24b6b1cb6e7a998bfaddc4",
  "deepRequired": true,
  "helper": "scripts/doc-binding-repair.mjs",
  "contentProof": {
    "priorCommit": "ab4d6274a",
    "priorMatchingUnits": [
      {
        "unitKind": "unheaded-block",
        "anchor": "unheaded-block-18",
        "githubAnchor": "unheaded-block-18",
        "stableAnchor": "unheaded-block-18",
        "title": "Unheaded block 18",
        "startLine": 150,
        "endLine": 153,
        "textDigest": "5d70ebc5bbf14b4604424fe9dc4e05c75110a85c0c24b6b1cb6e7a998bfaddc4",
        "sample": "**Đường lỗi không bọc phong bì.** Chỉ đường thành công in phong bì ra `stdout`;\nkhi verb ném lỗi, chẩn đoán đi ra `stderr` kèm mã thoát theo bảng phân loại lỗi\n(stdout=dữ liệu, std",
        "identityFingerprint": "0f7d6b622276bd60f3607f619d603ba58a4496a16c988a2a4f2f3610470eb526",
        "ancestry": [
          "CLI I/O Contract",
          "3. Output Direction Unified Envelope",
          "Error Path Is Not Enveloped"
        ],
        "text": "**Đường lỗi không bọc phong bì.** Chỉ đường thành công in phong bì ra `stdout`;\nkhi verb ném lỗi, chẩn đoán đi ra `stderr` kèm mã thoát theo bảng phân loại lỗi\n(stdout=dữ liệu, stderr=chẩn đoán) — bên gọi phân biệt thành/bại bằng mã thoát,\nkhông phải bằng việc dò nội dung phong bì."
      }
    ],
    "currentText": "**Đường lỗi không bọc phong bì.** Chỉ đường thành công in phong bì ra `stdout`;\nkhi verb ném lỗi, chẩn đoán đi ra `stderr` kèm mã thoát theo bảng phân loại lỗi\n(stdout=dữ liệu, stderr=chẩn đoán) — bên gọi phân biệt thành/bại bằng mã thoát,\nkhông phải bằng việc dò nội dung phong bì.",
    "allPriorMatchingTextsEqualCurrent": true,
    "helperReplayed": true
  },
  "reviewScope": "Re-anchor receipt; claim verdict belongs to decisions section.",
  "packagedBy": "codex-session:unit-run-1792094246578-b2fbe39b@2026-10-16",
  "currentContentCommit": "345f15d95663260976200be66d1b9a6c648bcd6d",
  "entryId": "anchors-002"
}
```

## Entry anchors-003

```json
{
  "kind": "content-reanchoring-proof",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-data-dictionary.json",
  "collection": "claims",
  "before": {
    "claimId": "claim_52b54d49826d7ff8fd38f29925505f2a",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "sourceUnitDigest": "75bf5b6af00287e0",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-19",
    "claimKind": "contract",
    "disposition": "merge",
    "reviewStatus": "pending",
    "rationale": "Runner single-line envelope rule is stated in both sources; candidate carries both texts under Runner Stdout Envelope. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetUnitDigest": "5d70ebc5bbf14b4604424fe9dc4e05c75110a85c0c24b6b1cb6e7a998bfaddc4",
    "targetAncestry": [
      "CLI I/O Contract",
      "3. Output Direction Unified Envelope",
      "Error Path Is Not Enveloped"
    ]
  },
  "after": {
    "claimId": "claim_52b54d49826d7ff8fd38f29925505f2a",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "sourceUnitDigest": "75bf5b6af00287e0",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-20",
    "claimKind": "contract",
    "disposition": "merge",
    "reviewStatus": "pending",
    "rationale": "Runner single-line envelope rule is stated in both sources; candidate carries both texts under Runner Stdout Envelope. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. L10-21: content-based rebind from reviewed prior target unheaded-block-19 (75bf5b6af00287e081d243556f44f8e1c495da7238737ccd1b15d2a8191f196b) to unheaded-block-20 (75bf5b6af00287e081d243556f44f8e1c495da7238737ccd1b15d2a8191f196b); inserted paragraphs shift the anchor, prior target text is unchanged.",
    "targetUnitDigest": "75bf5b6af00287e081d243556f44f8e1c495da7238737ccd1b15d2a8191f196b",
    "targetAncestry": [
      "CLI I/O Contract",
      "3. Output Direction Unified Envelope",
      "Runner Stdout Envelope"
    ]
  },
  "prior": {
    "claimId": "claim_52b54d49826d7ff8fd38f29925505f2a",
    "authoredBy": "codex-session:1@2026-10-09",
    "sourceUnitDigest": "75bf5b6af00287e0",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-19",
    "claimKind": "contract",
    "disposition": "merge",
    "reviewStatus": "reviewed",
    "rationale": "Runner single-line envelope rule is stated in both sources; candidate carries both texts under Runner Stdout Envelope.",
    "reviewNote": "Unchanged under A14. merge/contract: work-state.md L641-645 (unheaded-block-65) -> contracts/cli-io-contract.md#unheaded-block-19 L149-153; targetOwner/targetAnchor contracts/cli-io-contract.md#unheaded-block-19. 54c2698ee vs HEAD decision: disposition, targetOwner/Anchor, claimKind, rationale, sourceUnitDigest and targetUnitDigest byte-equal; only authoredBy/reviewStatus/reviewedBy/reviewedAt reset. Source and target unit digests re-extracted at HEAD, d870fe07 and 54c2698ee with the repo extractor and equal the stated full digests.",
    "reviewedBy": "reviewer:claude-session:4df9e88c@2026-10-09",
    "reviewedAt": "2026-10-09",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-2reframe-b-data-dictionary.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "75bf5b6af00287e081d243556f44f8e1c495da7238737ccd1b15d2a8191f196b",
    "targetAncestry": [
      "CLI I/O Contract",
      "3. Output Direction Unified Envelope",
      "Runner Stdout Envelope"
    ],
    "reviewReportCommit": "d23045c2de83e3508fda8fd2580b43ece2e1e046"
  },
  "targetWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-20",
    "githubAnchor": "unheaded-block-20",
    "stableAnchor": "unheaded-block-20",
    "title": "Unheaded block 20",
    "startLine": 167,
    "endLine": 171,
    "textDigest": "75bf5b6af00287e081d243556f44f8e1c495da7238737ccd1b15d2a8191f196b",
    "sample": "**Vòng tự hành (`fgos-runner`) cũng dùng CÙNG phong bì này cho kết cục cuối của\nmỗi lượt/chu kỳ** (per str46-io-contract) — in liền một dòng thay vì nhiều\ndòng như trên, vì một tiế",
    "identityFingerprint": "33f37f423dd766e23819dd4bcb17a93bd66b8500200798a60fab598d29885c62",
    "ancestry": [
      "CLI I/O Contract",
      "3. Output Direction Unified Envelope",
      "Runner Stdout Envelope"
    ],
    "text": "**Vòng tự hành (`fgos-runner`) cũng dùng CÙNG phong bì này cho kết cục cuối của\nmỗi lượt/chu kỳ** (per str46-io-contract) — in liền một dòng thay vì nhiều\ndòng như trên, vì một tiến trình `--watch` phát nhiều phong bì nối tiếp theo\nthời gian; chi tiết đầy đủ + các luồng output khác nằm ngoài phong bì: xem spec\nRunner RUL61 (writer — danh tính người ghi, tách bạch khỏi vai, không bao giờ chặn verb)."
  },
  "relatedClaimId": "claim_52b54d49826d7ff8fd38f29925505f2a",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_52b54d49826d7ff8fd38f29925505f2a",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "sourceUnitDigest": "75bf5b6af00287e0",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-20",
    "claimKind": "contract",
    "disposition": "merge",
    "reviewStatus": "pending",
    "rationale": "Runner single-line envelope rule is stated in both sources; candidate carries both texts under Runner Stdout Envelope. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. L10-21: content-based rebind from reviewed prior target unheaded-block-19 (75bf5b6af00287e081d243556f44f8e1c495da7238737ccd1b15d2a8191f196b) to unheaded-block-20 (75bf5b6af00287e081d243556f44f8e1c495da7238737ccd1b15d2a8191f196b); inserted paragraphs shift the anchor, prior target text is unchanged.",
    "targetUnitDigest": "75bf5b6af00287e081d243556f44f8e1c495da7238737ccd1b15d2a8191f196b",
    "targetAncestry": [
      "CLI I/O Contract",
      "3. Output Direction Unified Envelope",
      "Runner Stdout Envelope"
    ]
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-20",
    "githubAnchor": "unheaded-block-20",
    "stableAnchor": "unheaded-block-20",
    "title": "Unheaded block 20",
    "startLine": 167,
    "endLine": 171,
    "textDigest": "75bf5b6af00287e081d243556f44f8e1c495da7238737ccd1b15d2a8191f196b",
    "sample": "**Vòng tự hành (`fgos-runner`) cũng dùng CÙNG phong bì này cho kết cục cuối của\nmỗi lượt/chu kỳ** (per str46-io-contract) — in liền một dòng thay vì nhiều\ndòng như trên, vì một tiế",
    "identityFingerprint": "33f37f423dd766e23819dd4bcb17a93bd66b8500200798a60fab598d29885c62",
    "ancestry": [
      "CLI I/O Contract",
      "3. Output Direction Unified Envelope",
      "Runner Stdout Envelope"
    ],
    "text": "**Vòng tự hành (`fgos-runner`) cũng dùng CÙNG phong bì này cho kết cục cuối của\nmỗi lượt/chu kỳ** (per str46-io-contract) — in liền một dòng thay vì nhiều\ndòng như trên, vì một tiến trình `--watch` phát nhiều phong bì nối tiếp theo\nthời gian; chi tiết đầy đủ + các luồng output khác nằm ngoài phong bì: xem spec\nRunner RUL61 (writer — danh tính người ghi, tách bạch khỏi vai, không bao giờ chặn verb)."
  },
  "oldAnchor": "unheaded-block-19",
  "newAnchor": "unheaded-block-20",
  "oldDigest": "75bf5b6af00287e081d243556f44f8e1c495da7238737ccd1b15d2a8191f196b",
  "newDigest": "75bf5b6af00287e081d243556f44f8e1c495da7238737ccd1b15d2a8191f196b",
  "deepRequired": true,
  "helper": "scripts/doc-binding-repair.mjs",
  "contentProof": {
    "priorCommit": "ab4d6274a",
    "priorMatchingUnits": [
      {
        "unitKind": "unheaded-block",
        "anchor": "unheaded-block-19",
        "githubAnchor": "unheaded-block-19",
        "stableAnchor": "unheaded-block-19",
        "title": "Unheaded block 19",
        "startLine": 157,
        "endLine": 161,
        "textDigest": "75bf5b6af00287e081d243556f44f8e1c495da7238737ccd1b15d2a8191f196b",
        "sample": "**Vòng tự hành (`fgos-runner`) cũng dùng CÙNG phong bì này cho kết cục cuối của\nmỗi lượt/chu kỳ** (per str46-io-contract) — in liền một dòng thay vì nhiều\ndòng như trên, vì một tiế",
        "identityFingerprint": "33f37f423dd766e23819dd4bcb17a93bd66b8500200798a60fab598d29885c62",
        "ancestry": [
          "CLI I/O Contract",
          "3. Output Direction Unified Envelope",
          "Runner Stdout Envelope"
        ],
        "text": "**Vòng tự hành (`fgos-runner`) cũng dùng CÙNG phong bì này cho kết cục cuối của\nmỗi lượt/chu kỳ** (per str46-io-contract) — in liền một dòng thay vì nhiều\ndòng như trên, vì một tiến trình `--watch` phát nhiều phong bì nối tiếp theo\nthời gian; chi tiết đầy đủ + các luồng output khác nằm ngoài phong bì: xem spec\nRunner RUL61 (writer — danh tính người ghi, tách bạch khỏi vai, không bao giờ chặn verb)."
      }
    ],
    "currentText": "**Vòng tự hành (`fgos-runner`) cũng dùng CÙNG phong bì này cho kết cục cuối của\nmỗi lượt/chu kỳ** (per str46-io-contract) — in liền một dòng thay vì nhiều\ndòng như trên, vì một tiến trình `--watch` phát nhiều phong bì nối tiếp theo\nthời gian; chi tiết đầy đủ + các luồng output khác nằm ngoài phong bì: xem spec\nRunner RUL61 (writer — danh tính người ghi, tách bạch khỏi vai, không bao giờ chặn verb).",
    "allPriorMatchingTextsEqualCurrent": true,
    "helperReplayed": true
  },
  "reviewScope": "Re-anchor receipt; claim verdict belongs to decisions section.",
  "packagedBy": "codex-session:unit-run-1792094246578-b2fbe39b@2026-10-16",
  "currentContentCommit": "345f15d95663260976200be66d1b9a6c648bcd6d",
  "entryId": "anchors-003"
}
```

## Entry anchors-004

```json
{
  "kind": "content-reanchoring-proof",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-data-dictionary.json",
  "collection": "claims",
  "before": {
    "claimId": "claim_ce947d10ed900598bde4df5b552e0265",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "sourceUnitDigest": "c219ee825c3475e61bb642fd89e50efedc586df24b0252a6d99e58df63f419d8",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-33",
    "claimKind": "contract",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "rationale": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetUnitDigest": "51dd3c8aa026a8f5a15e4c12c522b3bf2ad7c29238c49bf9ba51324806e10e23",
    "targetAncestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Manifest Shape"
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
    "reviewStatus": "pending",
    "rationale": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. L10-21: content-based rebind from reviewed prior target unheaded-block-33 (0b3d8cfa5bd06f2dc735968a1297d8567d8f78a6257cf8aed0b0611067e870a2) to unheaded-block-34 (0b3d8cfa5bd06f2dc735968a1297d8567d8f78a6257cf8aed0b0611067e870a2); inserted paragraphs shift the anchor, prior target text is unchanged.",
    "targetUnitDigest": "0b3d8cfa5bd06f2dc735968a1297d8567d8f78a6257cf8aed0b0611067e870a2",
    "targetAncestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Entry Fields And Effect Axes"
    ]
  },
  "prior": {
    "claimId": "claim_ce947d10ed900598bde4df5b552e0265",
    "authoredBy": "codex-session:unit-run-1792052396770-6f1c5957@2026-10-15",
    "sourceUnitDigest": "c219ee825c3475e61bb642fd89e50efedc586df24b0252a6d99e58df63f419d8",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-33",
    "claimKind": "contract",
    "disposition": "supersede",
    "reviewStatus": "reviewed",
    "rationale": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover.",
    "reviewNote": "deep: unequal digests c219ee82 vs 0b3d8cfa; diff read: legacy work-state block 68 keeps the older externalEffect sentence while the carrier has the COMMAND_REGISTRY corrected sentence; unchanged by this merge (target digest equal before and after, shift 32 to 33); supersede unchanged and covers the correction",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-15",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-261015-1526-specs-ui-reworks-main-recarry.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "0b3d8cfa5bd06f2dc735968a1297d8567d8f78a6257cf8aed0b0611067e870a2",
    "targetAncestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Entry Fields And Effect Axes"
    ],
    "reviewReportCommit": "0e8ce7710ac67ad038927b242b2461876bf8c90d"
  },
  "targetWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-34",
    "githubAnchor": "unheaded-block-34",
    "stableAnchor": "unheaded-block-34",
    "title": "Unheaded block 34",
    "startLine": 310,
    "endLine": 320,
    "textDigest": "0b3d8cfa5bd06f2dc735968a1297d8567d8f78a6257cf8aed0b0611067e870a2",
    "sample": "**Hai trục thay cho `access` (per str46-io-contract).** Cờ `access`\nđơn (`read` hay `mutation`) từng gộp hai câu hỏi khác nhau vào một giá trị —\nlộ rõ khi `review` khai `mutation` ",
    "identityFingerprint": "abdaf7574d8107b6e5d325a95cb8c7327dac1248939788580176154fa990dace",
    "ancestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Entry Fields And Effect Axes"
    ],
    "text": "**Hai trục thay cho `access` (per str46-io-contract).** Cờ `access`\nđơn (`read` hay `mutation`) từng gộp hai câu hỏi khác nhau vào một giá trị —\nlộ rõ khi `review` khai `mutation` chỉ vì chế độ `--github` của nó tạo một\nPR thật, dù bản thân `review` (không `--github`) không hề đổi trạng thái\nfgOS. Sổ verb nay tách thành **hai trường độc lập**: `touchesState`\n(verb có bao giờ ghi trạng thái fgOS hay không) và `externalEffect` (verb\ncó bao giờ gọi một dịch vụ ngoài fgOS hay không — danh sách hiện hành mang `externalEffect: true` lấy từ manifest `COMMAND_REGISTRY` qua `fgos --help --json`: 15 verb, không có `coordination` (ví dụ `review`, `approve`, `run` — dispatch executor thật tính là effect ngoài `.fgos/`);\n`review` mang `touchesState: false` vì nó không bao giờ ghi trạng thái, kể\ncả qua `--github`). Cả hai cờ vẫn thuần **khai báo** — chưa nối vào điều\nphối hay xác danh; cổng \"ai được nói verb nào\" vẫn là việc riêng sau này\n(backlog STR38)."
  },
  "relatedClaimId": "claim_ce947d10ed900598bde4df5b552e0265",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
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
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-34",
    "githubAnchor": "unheaded-block-34",
    "stableAnchor": "unheaded-block-34",
    "title": "Unheaded block 34",
    "startLine": 310,
    "endLine": 320,
    "textDigest": "0b3d8cfa5bd06f2dc735968a1297d8567d8f78a6257cf8aed0b0611067e870a2",
    "sample": "**Hai trục thay cho `access` (per str46-io-contract).** Cờ `access`\nđơn (`read` hay `mutation`) từng gộp hai câu hỏi khác nhau vào một giá trị —\nlộ rõ khi `review` khai `mutation` ",
    "identityFingerprint": "abdaf7574d8107b6e5d325a95cb8c7327dac1248939788580176154fa990dace",
    "ancestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Entry Fields And Effect Axes"
    ],
    "text": "**Hai trục thay cho `access` (per str46-io-contract).** Cờ `access`\nđơn (`read` hay `mutation`) từng gộp hai câu hỏi khác nhau vào một giá trị —\nlộ rõ khi `review` khai `mutation` chỉ vì chế độ `--github` của nó tạo một\nPR thật, dù bản thân `review` (không `--github`) không hề đổi trạng thái\nfgOS. Sổ verb nay tách thành **hai trường độc lập**: `touchesState`\n(verb có bao giờ ghi trạng thái fgOS hay không) và `externalEffect` (verb\ncó bao giờ gọi một dịch vụ ngoài fgOS hay không — danh sách hiện hành mang `externalEffect: true` lấy từ manifest `COMMAND_REGISTRY` qua `fgos --help --json`: 15 verb, không có `coordination` (ví dụ `review`, `approve`, `run` — dispatch executor thật tính là effect ngoài `.fgos/`);\n`review` mang `touchesState: false` vì nó không bao giờ ghi trạng thái, kể\ncả qua `--github`). Cả hai cờ vẫn thuần **khai báo** — chưa nối vào điều\nphối hay xác danh; cổng \"ai được nói verb nào\" vẫn là việc riêng sau này\n(backlog STR38)."
  },
  "oldAnchor": "unheaded-block-33",
  "newAnchor": "unheaded-block-34",
  "oldDigest": "0b3d8cfa5bd06f2dc735968a1297d8567d8f78a6257cf8aed0b0611067e870a2",
  "newDigest": "0b3d8cfa5bd06f2dc735968a1297d8567d8f78a6257cf8aed0b0611067e870a2",
  "deepRequired": true,
  "helper": "scripts/doc-binding-repair.mjs",
  "contentProof": {
    "priorCommit": "ab4d6274a",
    "priorMatchingUnits": [
      {
        "unitKind": "unheaded-block",
        "anchor": "unheaded-block-33",
        "githubAnchor": "unheaded-block-33",
        "stableAnchor": "unheaded-block-33",
        "title": "Unheaded block 33",
        "startLine": 300,
        "endLine": 310,
        "textDigest": "0b3d8cfa5bd06f2dc735968a1297d8567d8f78a6257cf8aed0b0611067e870a2",
        "sample": "**Hai trục thay cho `access` (per str46-io-contract).** Cờ `access`\nđơn (`read` hay `mutation`) từng gộp hai câu hỏi khác nhau vào một giá trị —\nlộ rõ khi `review` khai `mutation` ",
        "identityFingerprint": "abdaf7574d8107b6e5d325a95cb8c7327dac1248939788580176154fa990dace",
        "ancestry": [
          "CLI I/O Contract",
          "7. Machine-Readable Verb Registry",
          "Entry Fields And Effect Axes"
        ],
        "text": "**Hai trục thay cho `access` (per str46-io-contract).** Cờ `access`\nđơn (`read` hay `mutation`) từng gộp hai câu hỏi khác nhau vào một giá trị —\nlộ rõ khi `review` khai `mutation` chỉ vì chế độ `--github` của nó tạo một\nPR thật, dù bản thân `review` (không `--github`) không hề đổi trạng thái\nfgOS. Sổ verb nay tách thành **hai trường độc lập**: `touchesState`\n(verb có bao giờ ghi trạng thái fgOS hay không) và `externalEffect` (verb\ncó bao giờ gọi một dịch vụ ngoài fgOS hay không — danh sách hiện hành mang `externalEffect: true` lấy từ manifest `COMMAND_REGISTRY` qua `fgos --help --json`: 15 verb, không có `coordination` (ví dụ `review`, `approve`, `run` — dispatch executor thật tính là effect ngoài `.fgos/`);\n`review` mang `touchesState: false` vì nó không bao giờ ghi trạng thái, kể\ncả qua `--github`). Cả hai cờ vẫn thuần **khai báo** — chưa nối vào điều\nphối hay xác danh; cổng \"ai được nói verb nào\" vẫn là việc riêng sau này\n(backlog STR38)."
      }
    ],
    "currentText": "**Hai trục thay cho `access` (per str46-io-contract).** Cờ `access`\nđơn (`read` hay `mutation`) từng gộp hai câu hỏi khác nhau vào một giá trị —\nlộ rõ khi `review` khai `mutation` chỉ vì chế độ `--github` của nó tạo một\nPR thật, dù bản thân `review` (không `--github`) không hề đổi trạng thái\nfgOS. Sổ verb nay tách thành **hai trường độc lập**: `touchesState`\n(verb có bao giờ ghi trạng thái fgOS hay không) và `externalEffect` (verb\ncó bao giờ gọi một dịch vụ ngoài fgOS hay không — danh sách hiện hành mang `externalEffect: true` lấy từ manifest `COMMAND_REGISTRY` qua `fgos --help --json`: 15 verb, không có `coordination` (ví dụ `review`, `approve`, `run` — dispatch executor thật tính là effect ngoài `.fgos/`);\n`review` mang `touchesState: false` vì nó không bao giờ ghi trạng thái, kể\ncả qua `--github`). Cả hai cờ vẫn thuần **khai báo** — chưa nối vào điều\nphối hay xác danh; cổng \"ai được nói verb nào\" vẫn là việc riêng sau này\n(backlog STR38).",
    "allPriorMatchingTextsEqualCurrent": true,
    "helperReplayed": true
  },
  "reviewScope": "Re-anchor receipt; claim verdict belongs to decisions section.",
  "packagedBy": "codex-session:unit-run-1792094246578-b2fbe39b@2026-10-16",
  "currentContentCommit": "345f15d95663260976200be66d1b9a6c648bcd6d",
  "entryId": "anchors-004"
}
```

## Entry anchors-005

```json
{
  "kind": "content-reanchoring-proof",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-data-dictionary.json",
  "collection": "claims",
  "before": {
    "claimId": "claim_15a24dbb1f2d0470f04cdf8900da67a0",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "sourceUnitDigest": "2140755c1b59f62f147ba030e77aa0c28f631f3c4e23fb1618ba7ab6eaaa70f9",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-27",
    "claimKind": "contract",
    "disposition": "merge",
    "reviewStatus": "pending",
    "rationale": "Cursor pagination superset (adds permanent list --all --json exception and side-log narrowing) is carried verbatim; the io-contract short text follows it in the same section, so both sources are present. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetUnitDigest": "549dded9fe85b1cfd57f1ec7079141e4feb9e6468a31e93485ab91a2305e79fe",
    "targetAncestry": [
      "CLI I/O Contract",
      "5. Reasoned Envelope Exceptions"
    ]
  },
  "after": {
    "claimId": "claim_15a24dbb1f2d0470f04cdf8900da67a0",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "sourceUnitDigest": "2140755c1b59f62f147ba030e77aa0c28f631f3c4e23fb1618ba7ab6eaaa70f9",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-28",
    "claimKind": "contract",
    "disposition": "merge",
    "reviewStatus": "pending",
    "rationale": "Cursor pagination superset (adds permanent list --all --json exception and side-log narrowing) is carried verbatim; the io-contract short text follows it in the same section, so both sources are present. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. L10-21: content-based rebind from reviewed prior target unheaded-block-27 (2140755c1b59f62f147ba030e77aa0c28f631f3c4e23fb1618ba7ab6eaaa70f9) to unheaded-block-28 (2140755c1b59f62f147ba030e77aa0c28f631f3c4e23fb1618ba7ab6eaaa70f9); inserted paragraphs shift the anchor, prior target text is unchanged.",
    "targetUnitDigest": "2140755c1b59f62f147ba030e77aa0c28f631f3c4e23fb1618ba7ab6eaaa70f9",
    "targetAncestry": [
      "CLI I/O Contract",
      "6. Cursor Pagination"
    ]
  },
  "prior": {
    "claimId": "claim_15a24dbb1f2d0470f04cdf8900da67a0",
    "authoredBy": "codex-session:unit-run-1792056203419-9b5bd055@2026-10-15",
    "sourceUnitDigest": "2140755c1b59f62f147ba030e77aa0c28f631f3c4e23fb1618ba7ab6eaaa70f9",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-27",
    "claimKind": "contract",
    "disposition": "merge",
    "reviewStatus": "reviewed",
    "rationale": "Cursor pagination superset (adds permanent list --all --json exception and side-log narrowing) is carried verbatim; the io-contract short text follows it in the same section, so both sources are present.",
    "reviewNote": "deep: disposition restored to merge with the previously reviewed rationale word for word; only anchor (26 to 27) and digests differ from the reviewed form; source block 69 byte-equal to target block 27 (2140755c)",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-15",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-261015-1625-specs-ui-nine-decision-reworks.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "2140755c1b59f62f147ba030e77aa0c28f631f3c4e23fb1618ba7ab6eaaa70f9",
    "targetAncestry": [
      "CLI I/O Contract",
      "6. Cursor Pagination"
    ],
    "reviewReportCommit": "63fa6f15266f45c881f610235e0be8d61ff07120"
  },
  "targetWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-28",
    "githubAnchor": "unheaded-block-28",
    "stableAnchor": "unheaded-block-28",
    "title": "Unheaded block 28",
    "startLine": 225,
    "endLine": 249,
    "textDigest": "2140755c1b59f62f147ba030e77aa0c28f631f3c4e23fb1618ba7ab6eaaa70f9",
    "sample": "**Phân trang cho verb trả tập lớn (per str46-io-contract, được tsk-483 mở lại — xem `docs/history/tsk-483-list-side-log-pagination-\nscoping/CONTEXT.md`).** Sổ verb khai thêm cờ `pa",
    "identityFingerprint": "0c4d416214101537d7ba4005ceea36a6978aa90efb8dc69e750359b5ccb0647d",
    "ancestry": [
      "CLI I/O Contract",
      "6. Cursor Pagination"
    ],
    "text": "**Phân trang cho verb trả tập lớn (per str46-io-contract, được tsk-483 mở lại — xem `docs/history/tsk-483-list-side-log-pagination-\nscoping/CONTEXT.md`).** Sổ verb khai thêm cờ `paginated` (đúng/sai) cho\nMỌI verb — chỉ bốn verb mang `paginated: true`: `ready`, `triage`,\n`evolve` (lượt liệt-kê không cờ của nó), và khoá `work` của `list`. Bốn\nverb này nhận thêm hai tham số tuỳ chọn `--cursor`/`--limit`: không\ntruyền cờ nào → kết quả y hệt hôm nay (mảng/map đầy đủ, không đổi hình\ndạng) — NGOẠI LỆ DUY NHẤT: `list --all --json` không kèm `--cursor`/\n`--limit` giữ nguyên hình dạng thô này VĨNH VIỄN, vì `packages/herdr-fgos-common/rust/src/\nfgos.rs` (crate Rust ngoài repo Node này) đọc đúng lời gọi đó làm hợp\nđồng công khai. Mọi tổ hợp KHÁC của `list` (mặc định trần không cờ nào,\n`--id`, hoặc bất kỳ tổ hợp nào có `--cursor`/`--limit` — kể cả kèm\n`--all`) đều thu hẹp `decisions`/`discovery`/`gates`/`settlements`/\n`outcomes`/`frictions`/`learnings`/`decisionsById` xuống đúng tập id đang\nthật sự được trả trong `work` — `tools` (khoá theo TÊN công cụ, không\ntheo id việc) không bao giờ bị đụng tới. Với ba verb còn lại (`ready`/\n`triage`/`evolve`), truyền một trong hai `--cursor`/`--limit` → kết quả\nđổi hình dạng thành `{items, nextCursor}`. Con trỏ (`cursor`) là **đục\nhoàn toàn** —\nngười gọi chỉ nhận lại nguyên văn từ `nextCursor` của lượt trước rồi truyền\ntiếp, không bao giờ tự phân tích hay tự chế. `nextCursor` là `null` khi đã\ntới cuối tập. Một con trỏ trỏ tới một mục đã rời tập (vd việc đã `done` từ\nlượt trước) là lỗi phạm trù `validation` — thông điệp lỗi tự nêu cách sửa\n(bắt đầu lại không kèm `--cursor`). `conflicts` CỐ Ý không phân trang\n(`paginated: false`, lý do ghi ngay trong mô tả verb) — mỗi dòng của nó là\nmột cặp `(a,b)`, không có khoá riêng cho một dòng để làm mốc con trỏ."
  },
  "relatedClaimId": "claim_15a24dbb1f2d0470f04cdf8900da67a0",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_15a24dbb1f2d0470f04cdf8900da67a0",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "sourceUnitDigest": "2140755c1b59f62f147ba030e77aa0c28f631f3c4e23fb1618ba7ab6eaaa70f9",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-28",
    "claimKind": "contract",
    "disposition": "merge",
    "reviewStatus": "pending",
    "rationale": "Cursor pagination superset (adds permanent list --all --json exception and side-log narrowing) is carried verbatim; the io-contract short text follows it in the same section, so both sources are present. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. L10-21: content-based rebind from reviewed prior target unheaded-block-27 (2140755c1b59f62f147ba030e77aa0c28f631f3c4e23fb1618ba7ab6eaaa70f9) to unheaded-block-28 (2140755c1b59f62f147ba030e77aa0c28f631f3c4e23fb1618ba7ab6eaaa70f9); inserted paragraphs shift the anchor, prior target text is unchanged.",
    "targetUnitDigest": "2140755c1b59f62f147ba030e77aa0c28f631f3c4e23fb1618ba7ab6eaaa70f9",
    "targetAncestry": [
      "CLI I/O Contract",
      "6. Cursor Pagination"
    ]
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-28",
    "githubAnchor": "unheaded-block-28",
    "stableAnchor": "unheaded-block-28",
    "title": "Unheaded block 28",
    "startLine": 225,
    "endLine": 249,
    "textDigest": "2140755c1b59f62f147ba030e77aa0c28f631f3c4e23fb1618ba7ab6eaaa70f9",
    "sample": "**Phân trang cho verb trả tập lớn (per str46-io-contract, được tsk-483 mở lại — xem `docs/history/tsk-483-list-side-log-pagination-\nscoping/CONTEXT.md`).** Sổ verb khai thêm cờ `pa",
    "identityFingerprint": "0c4d416214101537d7ba4005ceea36a6978aa90efb8dc69e750359b5ccb0647d",
    "ancestry": [
      "CLI I/O Contract",
      "6. Cursor Pagination"
    ],
    "text": "**Phân trang cho verb trả tập lớn (per str46-io-contract, được tsk-483 mở lại — xem `docs/history/tsk-483-list-side-log-pagination-\nscoping/CONTEXT.md`).** Sổ verb khai thêm cờ `paginated` (đúng/sai) cho\nMỌI verb — chỉ bốn verb mang `paginated: true`: `ready`, `triage`,\n`evolve` (lượt liệt-kê không cờ của nó), và khoá `work` của `list`. Bốn\nverb này nhận thêm hai tham số tuỳ chọn `--cursor`/`--limit`: không\ntruyền cờ nào → kết quả y hệt hôm nay (mảng/map đầy đủ, không đổi hình\ndạng) — NGOẠI LỆ DUY NHẤT: `list --all --json` không kèm `--cursor`/\n`--limit` giữ nguyên hình dạng thô này VĨNH VIỄN, vì `packages/herdr-fgos-common/rust/src/\nfgos.rs` (crate Rust ngoài repo Node này) đọc đúng lời gọi đó làm hợp\nđồng công khai. Mọi tổ hợp KHÁC của `list` (mặc định trần không cờ nào,\n`--id`, hoặc bất kỳ tổ hợp nào có `--cursor`/`--limit` — kể cả kèm\n`--all`) đều thu hẹp `decisions`/`discovery`/`gates`/`settlements`/\n`outcomes`/`frictions`/`learnings`/`decisionsById` xuống đúng tập id đang\nthật sự được trả trong `work` — `tools` (khoá theo TÊN công cụ, không\ntheo id việc) không bao giờ bị đụng tới. Với ba verb còn lại (`ready`/\n`triage`/`evolve`), truyền một trong hai `--cursor`/`--limit` → kết quả\nđổi hình dạng thành `{items, nextCursor}`. Con trỏ (`cursor`) là **đục\nhoàn toàn** —\nngười gọi chỉ nhận lại nguyên văn từ `nextCursor` của lượt trước rồi truyền\ntiếp, không bao giờ tự phân tích hay tự chế. `nextCursor` là `null` khi đã\ntới cuối tập. Một con trỏ trỏ tới một mục đã rời tập (vd việc đã `done` từ\nlượt trước) là lỗi phạm trù `validation` — thông điệp lỗi tự nêu cách sửa\n(bắt đầu lại không kèm `--cursor`). `conflicts` CỐ Ý không phân trang\n(`paginated: false`, lý do ghi ngay trong mô tả verb) — mỗi dòng của nó là\nmột cặp `(a,b)`, không có khoá riêng cho một dòng để làm mốc con trỏ."
  },
  "oldAnchor": "unheaded-block-27",
  "newAnchor": "unheaded-block-28",
  "oldDigest": "2140755c1b59f62f147ba030e77aa0c28f631f3c4e23fb1618ba7ab6eaaa70f9",
  "newDigest": "2140755c1b59f62f147ba030e77aa0c28f631f3c4e23fb1618ba7ab6eaaa70f9",
  "deepRequired": true,
  "helper": "scripts/doc-binding-repair.mjs",
  "contentProof": {
    "priorCommit": "ab4d6274a",
    "priorMatchingUnits": [
      {
        "unitKind": "unheaded-block",
        "anchor": "unheaded-block-27",
        "githubAnchor": "unheaded-block-27",
        "stableAnchor": "unheaded-block-27",
        "title": "Unheaded block 27",
        "startLine": 215,
        "endLine": 239,
        "textDigest": "2140755c1b59f62f147ba030e77aa0c28f631f3c4e23fb1618ba7ab6eaaa70f9",
        "sample": "**Phân trang cho verb trả tập lớn (per str46-io-contract, được tsk-483 mở lại — xem `docs/history/tsk-483-list-side-log-pagination-\nscoping/CONTEXT.md`).** Sổ verb khai thêm cờ `pa",
        "identityFingerprint": "0c4d416214101537d7ba4005ceea36a6978aa90efb8dc69e750359b5ccb0647d",
        "ancestry": [
          "CLI I/O Contract",
          "6. Cursor Pagination"
        ],
        "text": "**Phân trang cho verb trả tập lớn (per str46-io-contract, được tsk-483 mở lại — xem `docs/history/tsk-483-list-side-log-pagination-\nscoping/CONTEXT.md`).** Sổ verb khai thêm cờ `paginated` (đúng/sai) cho\nMỌI verb — chỉ bốn verb mang `paginated: true`: `ready`, `triage`,\n`evolve` (lượt liệt-kê không cờ của nó), và khoá `work` của `list`. Bốn\nverb này nhận thêm hai tham số tuỳ chọn `--cursor`/`--limit`: không\ntruyền cờ nào → kết quả y hệt hôm nay (mảng/map đầy đủ, không đổi hình\ndạng) — NGOẠI LỆ DUY NHẤT: `list --all --json` không kèm `--cursor`/\n`--limit` giữ nguyên hình dạng thô này VĨNH VIỄN, vì `packages/herdr-fgos-common/rust/src/\nfgos.rs` (crate Rust ngoài repo Node này) đọc đúng lời gọi đó làm hợp\nđồng công khai. Mọi tổ hợp KHÁC của `list` (mặc định trần không cờ nào,\n`--id`, hoặc bất kỳ tổ hợp nào có `--cursor`/`--limit` — kể cả kèm\n`--all`) đều thu hẹp `decisions`/`discovery`/`gates`/`settlements`/\n`outcomes`/`frictions`/`learnings`/`decisionsById` xuống đúng tập id đang\nthật sự được trả trong `work` — `tools` (khoá theo TÊN công cụ, không\ntheo id việc) không bao giờ bị đụng tới. Với ba verb còn lại (`ready`/\n`triage`/`evolve`), truyền một trong hai `--cursor`/`--limit` → kết quả\nđổi hình dạng thành `{items, nextCursor}`. Con trỏ (`cursor`) là **đục\nhoàn toàn** —\nngười gọi chỉ nhận lại nguyên văn từ `nextCursor` của lượt trước rồi truyền\ntiếp, không bao giờ tự phân tích hay tự chế. `nextCursor` là `null` khi đã\ntới cuối tập. Một con trỏ trỏ tới một mục đã rời tập (vd việc đã `done` từ\nlượt trước) là lỗi phạm trù `validation` — thông điệp lỗi tự nêu cách sửa\n(bắt đầu lại không kèm `--cursor`). `conflicts` CỐ Ý không phân trang\n(`paginated: false`, lý do ghi ngay trong mô tả verb) — mỗi dòng của nó là\nmột cặp `(a,b)`, không có khoá riêng cho một dòng để làm mốc con trỏ."
      }
    ],
    "currentText": "**Phân trang cho verb trả tập lớn (per str46-io-contract, được tsk-483 mở lại — xem `docs/history/tsk-483-list-side-log-pagination-\nscoping/CONTEXT.md`).** Sổ verb khai thêm cờ `paginated` (đúng/sai) cho\nMỌI verb — chỉ bốn verb mang `paginated: true`: `ready`, `triage`,\n`evolve` (lượt liệt-kê không cờ của nó), và khoá `work` của `list`. Bốn\nverb này nhận thêm hai tham số tuỳ chọn `--cursor`/`--limit`: không\ntruyền cờ nào → kết quả y hệt hôm nay (mảng/map đầy đủ, không đổi hình\ndạng) — NGOẠI LỆ DUY NHẤT: `list --all --json` không kèm `--cursor`/\n`--limit` giữ nguyên hình dạng thô này VĨNH VIỄN, vì `packages/herdr-fgos-common/rust/src/\nfgos.rs` (crate Rust ngoài repo Node này) đọc đúng lời gọi đó làm hợp\nđồng công khai. Mọi tổ hợp KHÁC của `list` (mặc định trần không cờ nào,\n`--id`, hoặc bất kỳ tổ hợp nào có `--cursor`/`--limit` — kể cả kèm\n`--all`) đều thu hẹp `decisions`/`discovery`/`gates`/`settlements`/\n`outcomes`/`frictions`/`learnings`/`decisionsById` xuống đúng tập id đang\nthật sự được trả trong `work` — `tools` (khoá theo TÊN công cụ, không\ntheo id việc) không bao giờ bị đụng tới. Với ba verb còn lại (`ready`/\n`triage`/`evolve`), truyền một trong hai `--cursor`/`--limit` → kết quả\nđổi hình dạng thành `{items, nextCursor}`. Con trỏ (`cursor`) là **đục\nhoàn toàn** —\nngười gọi chỉ nhận lại nguyên văn từ `nextCursor` của lượt trước rồi truyền\ntiếp, không bao giờ tự phân tích hay tự chế. `nextCursor` là `null` khi đã\ntới cuối tập. Một con trỏ trỏ tới một mục đã rời tập (vd việc đã `done` từ\nlượt trước) là lỗi phạm trù `validation` — thông điệp lỗi tự nêu cách sửa\n(bắt đầu lại không kèm `--cursor`). `conflicts` CỐ Ý không phân trang\n(`paginated: false`, lý do ghi ngay trong mô tả verb) — mỗi dòng của nó là\nmột cặp `(a,b)`, không có khoá riêng cho một dòng để làm mốc con trỏ.",
    "allPriorMatchingTextsEqualCurrent": true,
    "helperReplayed": true
  },
  "reviewScope": "Re-anchor receipt; claim verdict belongs to decisions section.",
  "packagedBy": "codex-session:unit-run-1792094246578-b2fbe39b@2026-10-16",
  "currentContentCommit": "345f15d95663260976200be66d1b9a6c648bcd6d",
  "entryId": "anchors-005"
}
```

## Entry anchors-006

```json
{
  "kind": "content-reanchoring-proof",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-data-dictionary.json",
  "collection": "claims",
  "before": {
    "claimId": "claim_5dcb56608e17caeb53c197186ae33827",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "sourceUnitDigest": "3964ac136b9bb85d72cec95fd1ff5748fd87fbbf1b1487c1cfbef35a34b20d62",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-36",
    "claimKind": "contract",
    "disposition": "merge",
    "reviewStatus": "pending",
    "rationale": "csv versus json-array multiValueFormat rule is stated in both sources; candidate carries both texts under the H2 8. A31 upstream merge conservation: the exact current source and candidate successor are shown. This is a pending re-carry/rebinding, with no prior approval carry and no code-truth certification. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetUnitDigest": "78393c0183b6bda3ff166520f4601ab2793cbdf85e2669949001a73b9102f293",
    "targetAncestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Entry Fields And Effect Axes"
    ]
  },
  "after": {
    "claimId": "claim_5dcb56608e17caeb53c197186ae33827",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "sourceUnitDigest": "3964ac136b9bb85d72cec95fd1ff5748fd87fbbf1b1487c1cfbef35a34b20d62",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-37",
    "claimKind": "contract",
    "disposition": "merge",
    "reviewStatus": "pending",
    "rationale": "csv versus json-array multiValueFormat rule is stated in both sources; candidate carries both texts under the H2 8. A31 upstream merge conservation: the exact current source and candidate successor are shown. This is a pending re-carry/rebinding, with no prior approval carry and no code-truth certification. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. L10-21: content-based rebind from reviewed prior target unheaded-block-36 (3964ac136b9bb85d72cec95fd1ff5748fd87fbbf1b1487c1cfbef35a34b20d62) to unheaded-block-37 (3964ac136b9bb85d72cec95fd1ff5748fd87fbbf1b1487c1cfbef35a34b20d62); inserted paragraphs shift the anchor, prior target text is unchanged.",
    "targetUnitDigest": "3964ac136b9bb85d72cec95fd1ff5748fd87fbbf1b1487c1cfbef35a34b20d62",
    "targetAncestry": [
      "CLI I/O Contract",
      "8. Multi-Value Flag Convention"
    ]
  },
  "prior": {
    "claimId": "claim_5dcb56608e17caeb53c197186ae33827",
    "authoredBy": "codex-session:unit-run-1792056203419-9b5bd055@2026-10-15",
    "sourceUnitDigest": "3964ac136b9bb85d72cec95fd1ff5748fd87fbbf1b1487c1cfbef35a34b20d62",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-36",
    "claimKind": "contract",
    "disposition": "merge",
    "reviewStatus": "reviewed",
    "rationale": "csv versus json-array multiValueFormat rule is stated in both sources; candidate carries both texts under the H2 8. A31 upstream merge conservation: the exact current source and candidate successor are shown. This is a pending re-carry/rebinding, with no prior approval carry and no code-truth certification.",
    "reviewNote": "deep: disposition restored to merge with the reviewed rationale unchanged (the reviewed text still ends with a stale pending re-carry boilerplate sentence, harmless); source block 70 byte-equal to target block 36 (3964ac13), anchor ok",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-15",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-261015-1625-specs-ui-nine-decision-reworks.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "3964ac136b9bb85d72cec95fd1ff5748fd87fbbf1b1487c1cfbef35a34b20d62",
    "targetAncestry": [
      "CLI I/O Contract",
      "8. Multi-Value Flag Convention"
    ],
    "reviewReportCommit": "63fa6f15266f45c881f610235e0be8d61ff07120"
  },
  "targetWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-37",
    "githubAnchor": "unheaded-block-37",
    "stableAnchor": "unheaded-block-37",
    "title": "Unheaded block 37",
    "startLine": 343,
    "endLine": 350,
    "textDigest": "3964ac136b9bb85d72cec95fd1ff5748fd87fbbf1b1487c1cfbef35a34b20d62",
    "sample": "**Quy ước cờ nhiều-giá-trị (per str46-io-contract).** Sổ verb khai thêm\ntrường `multiValueFormat` (`'csv'` hay `'json-array'`) trên đúng những tham\nsố nào mang nhiều giá trị — trướ",
    "identityFingerprint": "3106ff6efc6244bea6ee9a9696727e25ff45124b65419573616164315cfb46dd",
    "ancestry": [
      "CLI I/O Contract",
      "8. Multi-Value Flag Convention"
    ],
    "text": "**Quy ước cờ nhiều-giá-trị (per str46-io-contract).** Sổ verb khai thêm\ntrường `multiValueFormat` (`'csv'` hay `'json-array'`) trên đúng những tham\nsố nào mang nhiều giá trị — trước đây khác biệt này chỉ nằm trong văn xuôi\nmô tả, không đọc được bằng máy. `deps`, `refs`, `footprint`, `targets` mang\n`multiValueFormat: 'csv'` (phân tách bằng dấu phẩy). `acceptance` mang\n`multiValueFormat: 'json-array'` (chuỗi JSON-hoá, CỐ Ý không phẩy vì văn\nbản một clause có thể tự chứa dấu phẩy). Tham số không mang nhiều giá trị\nkhông có trường này."
  },
  "relatedClaimId": "claim_5dcb56608e17caeb53c197186ae33827",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_5dcb56608e17caeb53c197186ae33827",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "sourceUnitDigest": "3964ac136b9bb85d72cec95fd1ff5748fd87fbbf1b1487c1cfbef35a34b20d62",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-37",
    "claimKind": "contract",
    "disposition": "merge",
    "reviewStatus": "pending",
    "rationale": "csv versus json-array multiValueFormat rule is stated in both sources; candidate carries both texts under the H2 8. A31 upstream merge conservation: the exact current source and candidate successor are shown. This is a pending re-carry/rebinding, with no prior approval carry and no code-truth certification. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. L10-21: content-based rebind from reviewed prior target unheaded-block-36 (3964ac136b9bb85d72cec95fd1ff5748fd87fbbf1b1487c1cfbef35a34b20d62) to unheaded-block-37 (3964ac136b9bb85d72cec95fd1ff5748fd87fbbf1b1487c1cfbef35a34b20d62); inserted paragraphs shift the anchor, prior target text is unchanged.",
    "targetUnitDigest": "3964ac136b9bb85d72cec95fd1ff5748fd87fbbf1b1487c1cfbef35a34b20d62",
    "targetAncestry": [
      "CLI I/O Contract",
      "8. Multi-Value Flag Convention"
    ]
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-37",
    "githubAnchor": "unheaded-block-37",
    "stableAnchor": "unheaded-block-37",
    "title": "Unheaded block 37",
    "startLine": 343,
    "endLine": 350,
    "textDigest": "3964ac136b9bb85d72cec95fd1ff5748fd87fbbf1b1487c1cfbef35a34b20d62",
    "sample": "**Quy ước cờ nhiều-giá-trị (per str46-io-contract).** Sổ verb khai thêm\ntrường `multiValueFormat` (`'csv'` hay `'json-array'`) trên đúng những tham\nsố nào mang nhiều giá trị — trướ",
    "identityFingerprint": "3106ff6efc6244bea6ee9a9696727e25ff45124b65419573616164315cfb46dd",
    "ancestry": [
      "CLI I/O Contract",
      "8. Multi-Value Flag Convention"
    ],
    "text": "**Quy ước cờ nhiều-giá-trị (per str46-io-contract).** Sổ verb khai thêm\ntrường `multiValueFormat` (`'csv'` hay `'json-array'`) trên đúng những tham\nsố nào mang nhiều giá trị — trước đây khác biệt này chỉ nằm trong văn xuôi\nmô tả, không đọc được bằng máy. `deps`, `refs`, `footprint`, `targets` mang\n`multiValueFormat: 'csv'` (phân tách bằng dấu phẩy). `acceptance` mang\n`multiValueFormat: 'json-array'` (chuỗi JSON-hoá, CỐ Ý không phẩy vì văn\nbản một clause có thể tự chứa dấu phẩy). Tham số không mang nhiều giá trị\nkhông có trường này."
  },
  "oldAnchor": "unheaded-block-36",
  "newAnchor": "unheaded-block-37",
  "oldDigest": "3964ac136b9bb85d72cec95fd1ff5748fd87fbbf1b1487c1cfbef35a34b20d62",
  "newDigest": "3964ac136b9bb85d72cec95fd1ff5748fd87fbbf1b1487c1cfbef35a34b20d62",
  "deepRequired": true,
  "helper": "scripts/doc-binding-repair.mjs",
  "contentProof": {
    "priorCommit": "ab4d6274a",
    "priorMatchingUnits": [
      {
        "unitKind": "unheaded-block",
        "anchor": "unheaded-block-36",
        "githubAnchor": "unheaded-block-36",
        "stableAnchor": "unheaded-block-36",
        "title": "Unheaded block 36",
        "startLine": 333,
        "endLine": 340,
        "textDigest": "3964ac136b9bb85d72cec95fd1ff5748fd87fbbf1b1487c1cfbef35a34b20d62",
        "sample": "**Quy ước cờ nhiều-giá-trị (per str46-io-contract).** Sổ verb khai thêm\ntrường `multiValueFormat` (`'csv'` hay `'json-array'`) trên đúng những tham\nsố nào mang nhiều giá trị — trướ",
        "identityFingerprint": "3106ff6efc6244bea6ee9a9696727e25ff45124b65419573616164315cfb46dd",
        "ancestry": [
          "CLI I/O Contract",
          "8. Multi-Value Flag Convention"
        ],
        "text": "**Quy ước cờ nhiều-giá-trị (per str46-io-contract).** Sổ verb khai thêm\ntrường `multiValueFormat` (`'csv'` hay `'json-array'`) trên đúng những tham\nsố nào mang nhiều giá trị — trước đây khác biệt này chỉ nằm trong văn xuôi\nmô tả, không đọc được bằng máy. `deps`, `refs`, `footprint`, `targets` mang\n`multiValueFormat: 'csv'` (phân tách bằng dấu phẩy). `acceptance` mang\n`multiValueFormat: 'json-array'` (chuỗi JSON-hoá, CỐ Ý không phẩy vì văn\nbản một clause có thể tự chứa dấu phẩy). Tham số không mang nhiều giá trị\nkhông có trường này."
      }
    ],
    "currentText": "**Quy ước cờ nhiều-giá-trị (per str46-io-contract).** Sổ verb khai thêm\ntrường `multiValueFormat` (`'csv'` hay `'json-array'`) trên đúng những tham\nsố nào mang nhiều giá trị — trước đây khác biệt này chỉ nằm trong văn xuôi\nmô tả, không đọc được bằng máy. `deps`, `refs`, `footprint`, `targets` mang\n`multiValueFormat: 'csv'` (phân tách bằng dấu phẩy). `acceptance` mang\n`multiValueFormat: 'json-array'` (chuỗi JSON-hoá, CỐ Ý không phẩy vì văn\nbản một clause có thể tự chứa dấu phẩy). Tham số không mang nhiều giá trị\nkhông có trường này.",
    "allPriorMatchingTextsEqualCurrent": true,
    "helperReplayed": true
  },
  "reviewScope": "Re-anchor receipt; claim verdict belongs to decisions section.",
  "packagedBy": "codex-session:unit-run-1792094246578-b2fbe39b@2026-10-16",
  "currentContentCommit": "345f15d95663260976200be66d1b9a6c648bcd6d",
  "entryId": "anchors-006"
}
```

## Entry anchors-007

```json
{
  "kind": "content-reanchoring-proof",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-data-dictionary.json",
  "collection": "claims",
  "before": {
    "claimId": "claim_6fe86521fead9cec7253443e3275a3cf",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "sourceUnitDigest": "a1c9e2ebc2ba7e6a03ed7483b533c63fac017dc0a1f4bb9c9eb0c8f772851798",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-40",
    "claimKind": "contract",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "Runs-when / Blocked-when bullets of per-verb help are carried verbatim; kept as contract since it is a CLI surface guarantee. A31 upstream merge conservation: the exact current source and candidate successor are shown. This is a pending re-carry/rebinding, with no prior approval carry and no code-truth certification. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetUnitDigest": "9b711cb5a088ede56ad00207289f1fed2ccc05887597169bbc41eb2e55429db3",
    "targetAncestry": [
      "CLI I/O Contract",
      "9. Per-Verb Help"
    ]
  },
  "after": {
    "claimId": "claim_6fe86521fead9cec7253443e3275a3cf",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "sourceUnitDigest": "a1c9e2ebc2ba7e6a03ed7483b533c63fac017dc0a1f4bb9c9eb0c8f772851798",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-41",
    "claimKind": "contract",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "Runs-when / Blocked-when bullets of per-verb help are carried verbatim; kept as contract since it is a CLI surface guarantee. A31 upstream merge conservation: the exact current source and candidate successor are shown. This is a pending re-carry/rebinding, with no prior approval carry and no code-truth certification. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. L10-21: content-based rebind from reviewed prior target unheaded-block-40 (a1c9e2ebc2ba7e6a03ed7483b533c63fac017dc0a1f4bb9c9eb0c8f772851798) to unheaded-block-41 (a1c9e2ebc2ba7e6a03ed7483b533c63fac017dc0a1f4bb9c9eb0c8f772851798); inserted paragraphs shift the anchor, prior target text is unchanged.",
    "targetUnitDigest": "a1c9e2ebc2ba7e6a03ed7483b533c63fac017dc0a1f4bb9c9eb0c8f772851798",
    "targetAncestry": [
      "CLI I/O Contract",
      "9. Per-Verb Help"
    ]
  },
  "prior": {
    "claimId": "claim_6fe86521fead9cec7253443e3275a3cf",
    "authoredBy": "codex-session:unit-run-1792056203419-9b5bd055@2026-10-15",
    "sourceUnitDigest": "a1c9e2ebc2ba7e6a03ed7483b533c63fac017dc0a1f4bb9c9eb0c8f772851798",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-40",
    "claimKind": "contract",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Runs-when / Blocked-when bullets of per-verb help are carried verbatim; kept as contract since it is a CLI surface guarantee. A31 upstream merge conservation: the exact current source and candidate successor are shown. This is a pending re-carry/rebinding, with no prior approval carry and no code-truth certification.",
    "reviewNote": "deep: disposition restored to promote with the reviewed rationale unchanged; source block 73 byte-equal to target block 40 (a1c9e2eb), anchor ok; promote legal since the unit stays a contract in the platform tree",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-15",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-261015-1625-specs-ui-nine-decision-reworks.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "a1c9e2ebc2ba7e6a03ed7483b533c63fac017dc0a1f4bb9c9eb0c8f772851798",
    "targetAncestry": [
      "CLI I/O Contract",
      "9. Per-Verb Help"
    ],
    "reviewReportCommit": "63fa6f15266f45c881f610235e0be8d61ff07120"
  },
  "targetWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-41",
    "githubAnchor": "unheaded-block-41",
    "stableAnchor": "unheaded-block-41",
    "title": "Unheaded block 41",
    "startLine": 382,
    "endLine": 393,
    "textDigest": "a1c9e2ebc2ba7e6a03ed7483b533c63fac017dc0a1f4bb9c9eb0c8f772851798",
    "sample": "- **Runs when:** người/agent gọi `fgos <verb> --help` cho bất kỳ verb nào\n  trong sổ verb.\n- **Blocked when:** không có điều kiện chặn — mọi verb đều có mục trợ giúp\n  riêng.\n- **W",
    "identityFingerprint": "a4b8f46267345e4fc04574b601726648feb938131fcf8d1d3ead6872ed968d73",
    "ancestry": [
      "CLI I/O Contract",
      "9. Per-Verb Help"
    ],
    "text": "- **Runs when:** người/agent gọi `fgos <verb> --help` cho bất kỳ verb nào\n  trong sổ verb.\n- **Blocked when:** không có điều kiện chặn — mọi verb đều có mục trợ giúp\n  riêng.\n- **What changes:** không gì — đây là thao tác chỉ-đọc, không ghi sự kiện,\n  không đổi bản chiếu, không có tác dụng phụ nào (kể cả với `init` — gọi `fgos\n  init --help` KHÔNG chạy `init` thật, không tạo `.fgos/`).\n- **Side effects:** không có, cho MỌI verb kể cả những verb thường có tác\n  dụng phụ khi gọi thật (vd `init`).\n- **Afterwards:** người gọi thấy đúng mục trợ giúp của verb đã nêu tên, thoát\n  mã 0 — không bao giờ thoát ở phạm trù lỗi (mã 4) vì thiếu tham số bắt buộc,\n  dù tham số đó có mặt hay không (per str77-79-doc-gap-fixes / ea8b9a8d — RUL55 (trợ giúp theo từng verb luôn có thật, không tác dụng phụ))."
  },
  "relatedClaimId": "claim_6fe86521fead9cec7253443e3275a3cf",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_6fe86521fead9cec7253443e3275a3cf",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "sourceUnitDigest": "a1c9e2ebc2ba7e6a03ed7483b533c63fac017dc0a1f4bb9c9eb0c8f772851798",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-41",
    "claimKind": "contract",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "Runs-when / Blocked-when bullets of per-verb help are carried verbatim; kept as contract since it is a CLI surface guarantee. A31 upstream merge conservation: the exact current source and candidate successor are shown. This is a pending re-carry/rebinding, with no prior approval carry and no code-truth certification. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. L10-21: content-based rebind from reviewed prior target unheaded-block-40 (a1c9e2ebc2ba7e6a03ed7483b533c63fac017dc0a1f4bb9c9eb0c8f772851798) to unheaded-block-41 (a1c9e2ebc2ba7e6a03ed7483b533c63fac017dc0a1f4bb9c9eb0c8f772851798); inserted paragraphs shift the anchor, prior target text is unchanged.",
    "targetUnitDigest": "a1c9e2ebc2ba7e6a03ed7483b533c63fac017dc0a1f4bb9c9eb0c8f772851798",
    "targetAncestry": [
      "CLI I/O Contract",
      "9. Per-Verb Help"
    ]
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-41",
    "githubAnchor": "unheaded-block-41",
    "stableAnchor": "unheaded-block-41",
    "title": "Unheaded block 41",
    "startLine": 382,
    "endLine": 393,
    "textDigest": "a1c9e2ebc2ba7e6a03ed7483b533c63fac017dc0a1f4bb9c9eb0c8f772851798",
    "sample": "- **Runs when:** người/agent gọi `fgos <verb> --help` cho bất kỳ verb nào\n  trong sổ verb.\n- **Blocked when:** không có điều kiện chặn — mọi verb đều có mục trợ giúp\n  riêng.\n- **W",
    "identityFingerprint": "a4b8f46267345e4fc04574b601726648feb938131fcf8d1d3ead6872ed968d73",
    "ancestry": [
      "CLI I/O Contract",
      "9. Per-Verb Help"
    ],
    "text": "- **Runs when:** người/agent gọi `fgos <verb> --help` cho bất kỳ verb nào\n  trong sổ verb.\n- **Blocked when:** không có điều kiện chặn — mọi verb đều có mục trợ giúp\n  riêng.\n- **What changes:** không gì — đây là thao tác chỉ-đọc, không ghi sự kiện,\n  không đổi bản chiếu, không có tác dụng phụ nào (kể cả với `init` — gọi `fgos\n  init --help` KHÔNG chạy `init` thật, không tạo `.fgos/`).\n- **Side effects:** không có, cho MỌI verb kể cả những verb thường có tác\n  dụng phụ khi gọi thật (vd `init`).\n- **Afterwards:** người gọi thấy đúng mục trợ giúp của verb đã nêu tên, thoát\n  mã 0 — không bao giờ thoát ở phạm trù lỗi (mã 4) vì thiếu tham số bắt buộc,\n  dù tham số đó có mặt hay không (per str77-79-doc-gap-fixes / ea8b9a8d — RUL55 (trợ giúp theo từng verb luôn có thật, không tác dụng phụ))."
  },
  "oldAnchor": "unheaded-block-40",
  "newAnchor": "unheaded-block-41",
  "oldDigest": "a1c9e2ebc2ba7e6a03ed7483b533c63fac017dc0a1f4bb9c9eb0c8f772851798",
  "newDigest": "a1c9e2ebc2ba7e6a03ed7483b533c63fac017dc0a1f4bb9c9eb0c8f772851798",
  "deepRequired": true,
  "helper": "scripts/doc-binding-repair.mjs",
  "contentProof": {
    "priorCommit": "ab4d6274a",
    "priorMatchingUnits": [
      {
        "unitKind": "unheaded-block",
        "anchor": "unheaded-block-40",
        "githubAnchor": "unheaded-block-40",
        "stableAnchor": "unheaded-block-40",
        "title": "Unheaded block 40",
        "startLine": 372,
        "endLine": 383,
        "textDigest": "a1c9e2ebc2ba7e6a03ed7483b533c63fac017dc0a1f4bb9c9eb0c8f772851798",
        "sample": "- **Runs when:** người/agent gọi `fgos <verb> --help` cho bất kỳ verb nào\n  trong sổ verb.\n- **Blocked when:** không có điều kiện chặn — mọi verb đều có mục trợ giúp\n  riêng.\n- **W",
        "identityFingerprint": "a4b8f46267345e4fc04574b601726648feb938131fcf8d1d3ead6872ed968d73",
        "ancestry": [
          "CLI I/O Contract",
          "9. Per-Verb Help"
        ],
        "text": "- **Runs when:** người/agent gọi `fgos <verb> --help` cho bất kỳ verb nào\n  trong sổ verb.\n- **Blocked when:** không có điều kiện chặn — mọi verb đều có mục trợ giúp\n  riêng.\n- **What changes:** không gì — đây là thao tác chỉ-đọc, không ghi sự kiện,\n  không đổi bản chiếu, không có tác dụng phụ nào (kể cả với `init` — gọi `fgos\n  init --help` KHÔNG chạy `init` thật, không tạo `.fgos/`).\n- **Side effects:** không có, cho MỌI verb kể cả những verb thường có tác\n  dụng phụ khi gọi thật (vd `init`).\n- **Afterwards:** người gọi thấy đúng mục trợ giúp của verb đã nêu tên, thoát\n  mã 0 — không bao giờ thoát ở phạm trù lỗi (mã 4) vì thiếu tham số bắt buộc,\n  dù tham số đó có mặt hay không (per str77-79-doc-gap-fixes / ea8b9a8d — RUL55 (trợ giúp theo từng verb luôn có thật, không tác dụng phụ))."
      }
    ],
    "currentText": "- **Runs when:** người/agent gọi `fgos <verb> --help` cho bất kỳ verb nào\n  trong sổ verb.\n- **Blocked when:** không có điều kiện chặn — mọi verb đều có mục trợ giúp\n  riêng.\n- **What changes:** không gì — đây là thao tác chỉ-đọc, không ghi sự kiện,\n  không đổi bản chiếu, không có tác dụng phụ nào (kể cả với `init` — gọi `fgos\n  init --help` KHÔNG chạy `init` thật, không tạo `.fgos/`).\n- **Side effects:** không có, cho MỌI verb kể cả những verb thường có tác\n  dụng phụ khi gọi thật (vd `init`).\n- **Afterwards:** người gọi thấy đúng mục trợ giúp của verb đã nêu tên, thoát\n  mã 0 — không bao giờ thoát ở phạm trù lỗi (mã 4) vì thiếu tham số bắt buộc,\n  dù tham số đó có mặt hay không (per str77-79-doc-gap-fixes / ea8b9a8d — RUL55 (trợ giúp theo từng verb luôn có thật, không tác dụng phụ)).",
    "allPriorMatchingTextsEqualCurrent": true,
    "helperReplayed": true
  },
  "reviewScope": "Re-anchor receipt; claim verdict belongs to decisions section.",
  "packagedBy": "codex-session:unit-run-1792094246578-b2fbe39b@2026-10-16",
  "currentContentCommit": "345f15d95663260976200be66d1b9a6c648bcd6d",
  "entryId": "anchors-007"
}
```

## Entry anchors-008

```json
{
  "kind": "content-reanchoring-proof",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-data-dictionary.json",
  "collection": "registryGaps",
  "before": {
    "claimId": "claim_9959e82e2874baeb627a8441faa07e9a",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "sourceUnitDigest": "a2e6a5ffa58ec1f13d1321cf4b14d70b2a261fba6ce0f15c0bda50975cf8de04",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-30",
    "claimKind": "contract",
    "disposition": "merge",
    "reviewStatus": "pending",
    "rationale": "Manifest fields are combined from work-state and io-contract in the single Manifest Shape section; the work-state contribution includes the positional-parameter rule. The source schema_version 2.0 sentence is represented by the corrected schema_version 3.0 successor, with the complete fields carried. The reviewed merge disposition is restored: vocabulary merge combines multiple sources and does not require byte equality. The anchor shift changes no target text in this turn. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
    "sourcePath": "docs/specs/work-state.md",
    "sourceAnchor": "unheaded-block-66",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetUnitDigest": "b82a558166f118f339210d9a475214042a603bd09f64a3a2a8795d96fbdf57ce",
    "targetAncestry": [
      "CLI I/O Contract",
      "6. Cursor Pagination"
    ]
  },
  "after": {
    "claimId": "claim_9959e82e2874baeb627a8441faa07e9a",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "sourceUnitDigest": "a2e6a5ffa58ec1f13d1321cf4b14d70b2a261fba6ce0f15c0bda50975cf8de04",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-31",
    "claimKind": "contract",
    "disposition": "merge",
    "reviewStatus": "pending",
    "rationale": "Manifest fields are combined from work-state and io-contract in the single Manifest Shape section; the work-state contribution includes the positional-parameter rule. The source schema_version 2.0 sentence is represented by the corrected schema_version 3.0 successor, with the complete fields carried. The reviewed merge disposition is restored: vocabulary merge combines multiple sources and does not require byte equality. The anchor shift changes no target text in this turn. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. L10-21: content-based rebind from reviewed prior target unheaded-block-30 (878d708db7a0afb3e23a0829f98be122c83ac562946b51ab1989e73e5e4a8bfe) to unheaded-block-31 (878d708db7a0afb3e23a0829f98be122c83ac562946b51ab1989e73e5e4a8bfe); inserted paragraphs shift the anchor, prior target text is unchanged.",
    "sourcePath": "docs/specs/work-state.md",
    "sourceAnchor": "unheaded-block-66",
    "targetUnitDigest": "878d708db7a0afb3e23a0829f98be122c83ac562946b51ab1989e73e5e4a8bfe",
    "targetAncestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Manifest Shape"
    ]
  },
  "prior": {
    "claimId": "claim_9959e82e2874baeb627a8441faa07e9a",
    "authoredBy": "codex-session:unit-run-1792056203419-9b5bd055@2026-10-15",
    "sourceUnitDigest": "a2e6a5ffa58ec1f13d1321cf4b14d70b2a261fba6ce0f15c0bda50975cf8de04",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-30",
    "claimKind": "contract",
    "disposition": "merge",
    "reviewStatus": "reviewed",
    "rationale": "Manifest fields are combined from work-state and io-contract in the single Manifest Shape section; the work-state contribution includes the positional-parameter rule. The source schema_version 2.0 sentence is represented by the corrected schema_version 3.0 successor, with the complete fields carried. The reviewed merge disposition is restored: vocabulary merge combines multiple sources and does not require byte equality. The anchor shift changes no target text in this turn.",
    "sourcePath": "docs/specs/work-state.md",
    "sourceAnchor": "unheaded-block-66",
    "reviewNote": "deep: merge restored; rationale rewritten truthfully (not the earlier 2.0 verbatim claim): diff of 977509d5f block 66 against target block 30 is only the schema_version 2.0 to 3.0 history sentence, and the positional-parameter rule is in the target; 2.0 to 3.0 stated as correction, vocabulary merge needs no byte equality; target 878d708d and anchor ok",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-15",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-261015-1625-specs-ui-nine-decision-reworks.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "878d708db7a0afb3e23a0829f98be122c83ac562946b51ab1989e73e5e4a8bfe",
    "targetAncestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Manifest Shape"
    ],
    "reviewReportCommit": "63fa6f15266f45c881f610235e0be8d61ff07120"
  },
  "targetWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-31",
    "githubAnchor": "unheaded-block-31",
    "stableAnchor": "unheaded-block-31",
    "title": "Unheaded block 31",
    "startLine": 269,
    "endLine": 284,
    "textDigest": "878d708db7a0afb3e23a0829f98be122c83ac562946b51ab1989e73e5e4a8bfe",
    "sample": "CLI công bố **toàn bộ mặt verb** dưới dạng một sổ máy-đọc: gọi trợ giúp ở dạng\nmáy-đọc trả `{schema_version, commands: […]}` (`schema_version` hiện hành\n`'3.0'` — tăng từ `'2.0'` k",
    "identityFingerprint": "32c6dad9c72451cefbaa2daad7d5abc2f6a32ee533e487fb41a7ca37f6994400",
    "ancestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Manifest Shape"
    ],
    "text": "CLI công bố **toàn bộ mặt verb** dưới dạng một sổ máy-đọc: gọi trợ giúp ở dạng\nmáy-đọc trả `{schema_version, commands: […]}` (`schema_version` hiện hành\n`'3.0'` — tăng từ `'2.0'` khi cờ của verb có sub-verb dời vào\n`subcommands`, xem ngay dưới; `'2.0'` từng tăng từ `'1.0'` vì một trường bị\nxoá, per str46-io-contract), mỗi mục mô tả một verb — `name`, cách gọi, mô tả một dòng,\nlược đồ tham số (cờ/positional), ví dụ, và ô `deprecated`. Sổ này để một\nlistener/giao diện **sinh** khung lệnh và khung form từ manifest thay vì\nhard-code từng verb. Bản thân sổ verb là **siêu dữ liệu về CLI**, KHÔNG bọc\ntrong phong bì `data` (nó mô tả CLI, không phải kết quả một verb). Dạng trợ\ngiúp thường (không máy-đọc) in cùng thông tin ở dạng chữ cho người đọc. Với\nmột tham số CHỈ nhận qua vị trí trên dòng lệnh (positional — vd `text` của\n`submit`, đọc từ đối số đầu, không bao giờ qua một cờ `--text`), sổ verb\nđánh dấu riêng tham số đó là positional; dạng trợ giúp chữ cho người đọc in\ndòng \"positional: `<tên>`\" cho tham số này, KHÔNG BAO GIỜ in nhầm thành\n\"required: `--<tên>`\" như một cờ thật — một tham số vừa nhận positional vừa\nnhận qua cờ (vd `id` của `discover`/`take`) in cả hai dạng phân biệt (per str77-79-doc-gap-fixes / ea8b9a8d — RUL54 (sổ verb máy-đọc không in nhầm tham số positional thành cờ bắt buộc))."
  },
  "relatedClaimId": "claim_9959e82e2874baeb627a8441faa07e9a",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_9959e82e2874baeb627a8441faa07e9a",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "sourceUnitDigest": "a2e6a5ffa58ec1f13d1321cf4b14d70b2a261fba6ce0f15c0bda50975cf8de04",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-31",
    "claimKind": "contract",
    "disposition": "merge",
    "reviewStatus": "pending",
    "rationale": "Manifest fields are combined from work-state and io-contract in the single Manifest Shape section; the work-state contribution includes the positional-parameter rule. The source schema_version 2.0 sentence is represented by the corrected schema_version 3.0 successor, with the complete fields carried. The reviewed merge disposition is restored: vocabulary merge combines multiple sources and does not require byte equality. The anchor shift changes no target text in this turn. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. L10-21: content-based rebind from reviewed prior target unheaded-block-30 (878d708db7a0afb3e23a0829f98be122c83ac562946b51ab1989e73e5e4a8bfe) to unheaded-block-31 (878d708db7a0afb3e23a0829f98be122c83ac562946b51ab1989e73e5e4a8bfe); inserted paragraphs shift the anchor, prior target text is unchanged.",
    "sourcePath": "docs/specs/work-state.md",
    "sourceAnchor": "unheaded-block-66",
    "targetUnitDigest": "878d708db7a0afb3e23a0829f98be122c83ac562946b51ab1989e73e5e4a8bfe",
    "targetAncestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Manifest Shape"
    ]
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-31",
    "githubAnchor": "unheaded-block-31",
    "stableAnchor": "unheaded-block-31",
    "title": "Unheaded block 31",
    "startLine": 269,
    "endLine": 284,
    "textDigest": "878d708db7a0afb3e23a0829f98be122c83ac562946b51ab1989e73e5e4a8bfe",
    "sample": "CLI công bố **toàn bộ mặt verb** dưới dạng một sổ máy-đọc: gọi trợ giúp ở dạng\nmáy-đọc trả `{schema_version, commands: […]}` (`schema_version` hiện hành\n`'3.0'` — tăng từ `'2.0'` k",
    "identityFingerprint": "32c6dad9c72451cefbaa2daad7d5abc2f6a32ee533e487fb41a7ca37f6994400",
    "ancestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Manifest Shape"
    ],
    "text": "CLI công bố **toàn bộ mặt verb** dưới dạng một sổ máy-đọc: gọi trợ giúp ở dạng\nmáy-đọc trả `{schema_version, commands: […]}` (`schema_version` hiện hành\n`'3.0'` — tăng từ `'2.0'` khi cờ của verb có sub-verb dời vào\n`subcommands`, xem ngay dưới; `'2.0'` từng tăng từ `'1.0'` vì một trường bị\nxoá, per str46-io-contract), mỗi mục mô tả một verb — `name`, cách gọi, mô tả một dòng,\nlược đồ tham số (cờ/positional), ví dụ, và ô `deprecated`. Sổ này để một\nlistener/giao diện **sinh** khung lệnh và khung form từ manifest thay vì\nhard-code từng verb. Bản thân sổ verb là **siêu dữ liệu về CLI**, KHÔNG bọc\ntrong phong bì `data` (nó mô tả CLI, không phải kết quả một verb). Dạng trợ\ngiúp thường (không máy-đọc) in cùng thông tin ở dạng chữ cho người đọc. Với\nmột tham số CHỈ nhận qua vị trí trên dòng lệnh (positional — vd `text` của\n`submit`, đọc từ đối số đầu, không bao giờ qua một cờ `--text`), sổ verb\nđánh dấu riêng tham số đó là positional; dạng trợ giúp chữ cho người đọc in\ndòng \"positional: `<tên>`\" cho tham số này, KHÔNG BAO GIỜ in nhầm thành\n\"required: `--<tên>`\" như một cờ thật — một tham số vừa nhận positional vừa\nnhận qua cờ (vd `id` của `discover`/`take`) in cả hai dạng phân biệt (per str77-79-doc-gap-fixes / ea8b9a8d — RUL54 (sổ verb máy-đọc không in nhầm tham số positional thành cờ bắt buộc))."
  },
  "oldAnchor": "unheaded-block-30",
  "newAnchor": "unheaded-block-31",
  "oldDigest": "878d708db7a0afb3e23a0829f98be122c83ac562946b51ab1989e73e5e4a8bfe",
  "newDigest": "878d708db7a0afb3e23a0829f98be122c83ac562946b51ab1989e73e5e4a8bfe",
  "deepRequired": true,
  "helper": "scripts/doc-binding-repair.mjs",
  "contentProof": {
    "priorCommit": "ab4d6274a",
    "priorMatchingUnits": [
      {
        "unitKind": "unheaded-block",
        "anchor": "unheaded-block-30",
        "githubAnchor": "unheaded-block-30",
        "stableAnchor": "unheaded-block-30",
        "title": "Unheaded block 30",
        "startLine": 259,
        "endLine": 274,
        "textDigest": "878d708db7a0afb3e23a0829f98be122c83ac562946b51ab1989e73e5e4a8bfe",
        "sample": "CLI công bố **toàn bộ mặt verb** dưới dạng một sổ máy-đọc: gọi trợ giúp ở dạng\nmáy-đọc trả `{schema_version, commands: […]}` (`schema_version` hiện hành\n`'3.0'` — tăng từ `'2.0'` k",
        "identityFingerprint": "32c6dad9c72451cefbaa2daad7d5abc2f6a32ee533e487fb41a7ca37f6994400",
        "ancestry": [
          "CLI I/O Contract",
          "7. Machine-Readable Verb Registry",
          "Manifest Shape"
        ],
        "text": "CLI công bố **toàn bộ mặt verb** dưới dạng một sổ máy-đọc: gọi trợ giúp ở dạng\nmáy-đọc trả `{schema_version, commands: […]}` (`schema_version` hiện hành\n`'3.0'` — tăng từ `'2.0'` khi cờ của verb có sub-verb dời vào\n`subcommands`, xem ngay dưới; `'2.0'` từng tăng từ `'1.0'` vì một trường bị\nxoá, per str46-io-contract), mỗi mục mô tả một verb — `name`, cách gọi, mô tả một dòng,\nlược đồ tham số (cờ/positional), ví dụ, và ô `deprecated`. Sổ này để một\nlistener/giao diện **sinh** khung lệnh và khung form từ manifest thay vì\nhard-code từng verb. Bản thân sổ verb là **siêu dữ liệu về CLI**, KHÔNG bọc\ntrong phong bì `data` (nó mô tả CLI, không phải kết quả một verb). Dạng trợ\ngiúp thường (không máy-đọc) in cùng thông tin ở dạng chữ cho người đọc. Với\nmột tham số CHỈ nhận qua vị trí trên dòng lệnh (positional — vd `text` của\n`submit`, đọc từ đối số đầu, không bao giờ qua một cờ `--text`), sổ verb\nđánh dấu riêng tham số đó là positional; dạng trợ giúp chữ cho người đọc in\ndòng \"positional: `<tên>`\" cho tham số này, KHÔNG BAO GIỜ in nhầm thành\n\"required: `--<tên>`\" như một cờ thật — một tham số vừa nhận positional vừa\nnhận qua cờ (vd `id` của `discover`/`take`) in cả hai dạng phân biệt (per str77-79-doc-gap-fixes / ea8b9a8d — RUL54 (sổ verb máy-đọc không in nhầm tham số positional thành cờ bắt buộc))."
      }
    ],
    "currentText": "CLI công bố **toàn bộ mặt verb** dưới dạng một sổ máy-đọc: gọi trợ giúp ở dạng\nmáy-đọc trả `{schema_version, commands: […]}` (`schema_version` hiện hành\n`'3.0'` — tăng từ `'2.0'` khi cờ của verb có sub-verb dời vào\n`subcommands`, xem ngay dưới; `'2.0'` từng tăng từ `'1.0'` vì một trường bị\nxoá, per str46-io-contract), mỗi mục mô tả một verb — `name`, cách gọi, mô tả một dòng,\nlược đồ tham số (cờ/positional), ví dụ, và ô `deprecated`. Sổ này để một\nlistener/giao diện **sinh** khung lệnh và khung form từ manifest thay vì\nhard-code từng verb. Bản thân sổ verb là **siêu dữ liệu về CLI**, KHÔNG bọc\ntrong phong bì `data` (nó mô tả CLI, không phải kết quả một verb). Dạng trợ\ngiúp thường (không máy-đọc) in cùng thông tin ở dạng chữ cho người đọc. Với\nmột tham số CHỈ nhận qua vị trí trên dòng lệnh (positional — vd `text` của\n`submit`, đọc từ đối số đầu, không bao giờ qua một cờ `--text`), sổ verb\nđánh dấu riêng tham số đó là positional; dạng trợ giúp chữ cho người đọc in\ndòng \"positional: `<tên>`\" cho tham số này, KHÔNG BAO GIỜ in nhầm thành\n\"required: `--<tên>`\" như một cờ thật — một tham số vừa nhận positional vừa\nnhận qua cờ (vd `id` của `discover`/`take`) in cả hai dạng phân biệt (per str77-79-doc-gap-fixes / ea8b9a8d — RUL54 (sổ verb máy-đọc không in nhầm tham số positional thành cờ bắt buộc)).",
    "allPriorMatchingTextsEqualCurrent": true,
    "helperReplayed": true
  },
  "reviewScope": "Re-anchor receipt; claim verdict belongs to decisions section.",
  "packagedBy": "codex-session:unit-run-1792094246578-b2fbe39b@2026-10-16",
  "currentContentCommit": "345f15d95663260976200be66d1b9a6c648bcd6d",
  "entryId": "anchors-008"
}
```

## Entry anchors-009

```json
{
  "kind": "content-reanchoring-proof",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-io-contract.json",
  "collection": "registryGaps",
  "before": {
    "claimId": "claim_19495d2772ced1aa1af4b20d4640fa3a",
    "sourceUnitDigest": "83773dda67db8d5f71205bb8c7106186023672125b08cbe4f33b09b0578163ca",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-32",
    "claimKind": "contract",
    "disposition": "merge",
    "reviewStatus": "pending",
    "rationale": "The fgos --help --json manifest contract is combined with the work-state manifest contribution under Manifest Shape. Its schema_version 2.0 source wording is represented by the corrected schema_version 3.0 successor, including commands and per-verb entries; work-state adds the positional-parameter rule. The reviewed merge disposition is restored: vocabulary merge combines multiple sources and does not require byte equality. The anchor shift changes no target text in this turn. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "sourcePath": "docs/io-contract.md",
    "sourceAnchor": "unheaded-block-18",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetUnitDigest": "a5128895b71f07c2e1baa3ecb90cd302f016fdb4191518ef02835a768c8dc156",
    "targetAncestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Manifest Shape"
    ]
  },
  "after": {
    "claimId": "claim_19495d2772ced1aa1af4b20d4640fa3a",
    "sourceUnitDigest": "83773dda67db8d5f71205bb8c7106186023672125b08cbe4f33b09b0578163ca",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-33",
    "claimKind": "contract",
    "disposition": "merge",
    "reviewStatus": "pending",
    "rationale": "The fgos --help --json manifest contract is combined with the work-state manifest contribution under Manifest Shape. Its schema_version 2.0 source wording is represented by the corrected schema_version 3.0 successor, including commands and per-verb entries; work-state adds the positional-parameter rule. The reviewed merge disposition is restored: vocabulary merge combines multiple sources and does not require byte equality. The anchor shift changes no target text in this turn. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. L10-21: content-based rebind from reviewed prior target unheaded-block-32 (51dd3c8aa026a8f5a15e4c12c522b3bf2ad7c29238c49bf9ba51324806e10e23) to unheaded-block-33 (51dd3c8aa026a8f5a15e4c12c522b3bf2ad7c29238c49bf9ba51324806e10e23); inserted paragraphs shift the anchor, prior target text is unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "sourcePath": "docs/io-contract.md",
    "sourceAnchor": "unheaded-block-18",
    "targetUnitDigest": "51dd3c8aa026a8f5a15e4c12c522b3bf2ad7c29238c49bf9ba51324806e10e23",
    "targetAncestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Manifest Shape"
    ]
  },
  "prior": {
    "claimId": "claim_19495d2772ced1aa1af4b20d4640fa3a",
    "sourceUnitDigest": "83773dda67db8d5f71205bb8c7106186023672125b08cbe4f33b09b0578163ca",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-32",
    "claimKind": "contract",
    "disposition": "merge",
    "reviewStatus": "reviewed",
    "rationale": "The fgos --help --json manifest contract is combined with the work-state manifest contribution under Manifest Shape. Its schema_version 2.0 source wording is represented by the corrected schema_version 3.0 successor, including commands and per-verb entries; work-state adds the positional-parameter rule. The reviewed merge disposition is restored: vocabulary merge combines multiple sources and does not require byte equality. The anchor shift changes no target text in this turn.",
    "authoredBy": "codex-session:unit-run-1792056203419-9b5bd055@2026-10-15",
    "sourcePath": "docs/io-contract.md",
    "sourceAnchor": "unheaded-block-18",
    "reviewNote": "deep: merge restored with a truthful rationale; diff of 977509d5f io-contract block 18 against target block 32 is the 3.0 version sentence plus the added per-verb help --json and Rust host sentences, both covered by commands and per-verb entries wording; target 51dd3c8a and anchor ok",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-15",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-261015-1625-specs-ui-nine-decision-reworks.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "51dd3c8aa026a8f5a15e4c12c522b3bf2ad7c29238c49bf9ba51324806e10e23",
    "targetAncestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Manifest Shape"
    ],
    "reviewReportCommit": "63fa6f15266f45c881f610235e0be8d61ff07120"
  },
  "targetWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-33",
    "githubAnchor": "unheaded-block-33",
    "stableAnchor": "unheaded-block-33",
    "title": "Unheaded block 33",
    "startLine": 299,
    "endLine": 306,
    "textDigest": "51dd3c8aa026a8f5a15e4c12c522b3bf2ad7c29238c49bf9ba51324806e10e23",
    "sample": "`fgos --help --json` trả `{schema_version, commands: […]}` — CLI công bố\ntoàn bộ mặt verb để một listener/giao diện **sinh** khung lệnh từ manifest\nthay vì hard-code từng verb. `sc",
    "identityFingerprint": "49d3e9858947d27fe5eed264949a7b4b22caed396f6bebb112a9eae50fa460fd",
    "ancestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Manifest Shape"
    ],
    "text": "`fgos --help --json` trả `{schema_version, commands: […]}` — CLI công bố\ntoàn bộ mặt verb để một listener/giao diện **sinh** khung lệnh từ manifest\nthay vì hard-code từng verb. `schema_version` hiện `'3.0'` (tăng từ `'2.0'`\nkhi cờ của verb có sub-verb dời vào `subcommands`; `'2.0'` từng tăng từ\n`'1.0'` vì trường `access` bị xoá). `fgos <verb> [<sub>] --help --json` trả\nriêng mục của một verb (thu hẹp về một sub-verb khi có), cùng hình dạng một\nphần tử `commands[]`. Cả hai chạy được qua Rust host ở mọi project và không\nbao giờ chạy verb. Mỗi mục verb mang:"
  },
  "relatedClaimId": "claim_19495d2772ced1aa1af4b20d4640fa3a",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_19495d2772ced1aa1af4b20d4640fa3a",
    "sourceUnitDigest": "83773dda67db8d5f71205bb8c7106186023672125b08cbe4f33b09b0578163ca",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-33",
    "claimKind": "contract",
    "disposition": "merge",
    "reviewStatus": "pending",
    "rationale": "The fgos --help --json manifest contract is combined with the work-state manifest contribution under Manifest Shape. Its schema_version 2.0 source wording is represented by the corrected schema_version 3.0 successor, including commands and per-verb entries; work-state adds the positional-parameter rule. The reviewed merge disposition is restored: vocabulary merge combines multiple sources and does not require byte equality. The anchor shift changes no target text in this turn. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. L10-21: content-based rebind from reviewed prior target unheaded-block-32 (51dd3c8aa026a8f5a15e4c12c522b3bf2ad7c29238c49bf9ba51324806e10e23) to unheaded-block-33 (51dd3c8aa026a8f5a15e4c12c522b3bf2ad7c29238c49bf9ba51324806e10e23); inserted paragraphs shift the anchor, prior target text is unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "sourcePath": "docs/io-contract.md",
    "sourceAnchor": "unheaded-block-18",
    "targetUnitDigest": "51dd3c8aa026a8f5a15e4c12c522b3bf2ad7c29238c49bf9ba51324806e10e23",
    "targetAncestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Manifest Shape"
    ]
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-33",
    "githubAnchor": "unheaded-block-33",
    "stableAnchor": "unheaded-block-33",
    "title": "Unheaded block 33",
    "startLine": 299,
    "endLine": 306,
    "textDigest": "51dd3c8aa026a8f5a15e4c12c522b3bf2ad7c29238c49bf9ba51324806e10e23",
    "sample": "`fgos --help --json` trả `{schema_version, commands: […]}` — CLI công bố\ntoàn bộ mặt verb để một listener/giao diện **sinh** khung lệnh từ manifest\nthay vì hard-code từng verb. `sc",
    "identityFingerprint": "49d3e9858947d27fe5eed264949a7b4b22caed396f6bebb112a9eae50fa460fd",
    "ancestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Manifest Shape"
    ],
    "text": "`fgos --help --json` trả `{schema_version, commands: […]}` — CLI công bố\ntoàn bộ mặt verb để một listener/giao diện **sinh** khung lệnh từ manifest\nthay vì hard-code từng verb. `schema_version` hiện `'3.0'` (tăng từ `'2.0'`\nkhi cờ của verb có sub-verb dời vào `subcommands`; `'2.0'` từng tăng từ\n`'1.0'` vì trường `access` bị xoá). `fgos <verb> [<sub>] --help --json` trả\nriêng mục của một verb (thu hẹp về một sub-verb khi có), cùng hình dạng một\nphần tử `commands[]`. Cả hai chạy được qua Rust host ở mọi project và không\nbao giờ chạy verb. Mỗi mục verb mang:"
  },
  "oldAnchor": "unheaded-block-32",
  "newAnchor": "unheaded-block-33",
  "oldDigest": "51dd3c8aa026a8f5a15e4c12c522b3bf2ad7c29238c49bf9ba51324806e10e23",
  "newDigest": "51dd3c8aa026a8f5a15e4c12c522b3bf2ad7c29238c49bf9ba51324806e10e23",
  "deepRequired": true,
  "helper": "scripts/doc-binding-repair.mjs",
  "contentProof": {
    "priorCommit": "ab4d6274a",
    "priorMatchingUnits": [
      {
        "unitKind": "unheaded-block",
        "anchor": "unheaded-block-32",
        "githubAnchor": "unheaded-block-32",
        "stableAnchor": "unheaded-block-32",
        "title": "Unheaded block 32",
        "startLine": 289,
        "endLine": 296,
        "textDigest": "51dd3c8aa026a8f5a15e4c12c522b3bf2ad7c29238c49bf9ba51324806e10e23",
        "sample": "`fgos --help --json` trả `{schema_version, commands: […]}` — CLI công bố\ntoàn bộ mặt verb để một listener/giao diện **sinh** khung lệnh từ manifest\nthay vì hard-code từng verb. `sc",
        "identityFingerprint": "49d3e9858947d27fe5eed264949a7b4b22caed396f6bebb112a9eae50fa460fd",
        "ancestry": [
          "CLI I/O Contract",
          "7. Machine-Readable Verb Registry",
          "Manifest Shape"
        ],
        "text": "`fgos --help --json` trả `{schema_version, commands: […]}` — CLI công bố\ntoàn bộ mặt verb để một listener/giao diện **sinh** khung lệnh từ manifest\nthay vì hard-code từng verb. `schema_version` hiện `'3.0'` (tăng từ `'2.0'`\nkhi cờ của verb có sub-verb dời vào `subcommands`; `'2.0'` từng tăng từ\n`'1.0'` vì trường `access` bị xoá). `fgos <verb> [<sub>] --help --json` trả\nriêng mục của một verb (thu hẹp về một sub-verb khi có), cùng hình dạng một\nphần tử `commands[]`. Cả hai chạy được qua Rust host ở mọi project và không\nbao giờ chạy verb. Mỗi mục verb mang:"
      }
    ],
    "currentText": "`fgos --help --json` trả `{schema_version, commands: […]}` — CLI công bố\ntoàn bộ mặt verb để một listener/giao diện **sinh** khung lệnh từ manifest\nthay vì hard-code từng verb. `schema_version` hiện `'3.0'` (tăng từ `'2.0'`\nkhi cờ của verb có sub-verb dời vào `subcommands`; `'2.0'` từng tăng từ\n`'1.0'` vì trường `access` bị xoá). `fgos <verb> [<sub>] --help --json` trả\nriêng mục của một verb (thu hẹp về một sub-verb khi có), cùng hình dạng một\nphần tử `commands[]`. Cả hai chạy được qua Rust host ở mọi project và không\nbao giờ chạy verb. Mỗi mục verb mang:",
    "allPriorMatchingTextsEqualCurrent": true,
    "helperReplayed": true
  },
  "reviewScope": "Re-anchor receipt; claim verdict belongs to decisions section.",
  "packagedBy": "codex-session:unit-run-1792094246578-b2fbe39b@2026-10-16",
  "currentContentCommit": "345f15d95663260976200be66d1b9a6c648bcd6d",
  "entryId": "anchors-009"
}
```

## Entry anchors-010

```json
{
  "kind": "content-reanchoring-proof",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-io-contract.json",
  "collection": "registryGaps",
  "before": {
    "claimId": "claim_e2377849e4ba8e3d3beaf70880e4ed23",
    "sourceUnitDigest": "39e4ab1f30a6acc99de534a9fd16bd348b9ef8c1827664c0a7a50487f0587c0c",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-34",
    "claimKind": "contract",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "rationale": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "sourcePath": "docs/io-contract.md",
    "sourceAnchor": "unheaded-block-19",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetUnitDigest": "0b3d8cfa5bd06f2dc735968a1297d8567d8f78a6257cf8aed0b0611067e870a2",
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
    "reviewStatus": "pending",
    "rationale": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. L10-21: content-based rebind from reviewed prior target unheaded-block-34 (e013c5b05d6ff58782aa8231ab4a55967bd5ef853dac4015aec8f16f5fcf9c68) to unheaded-block-35 (e013c5b05d6ff58782aa8231ab4a55967bd5ef853dac4015aec8f16f5fcf9c68); inserted paragraphs shift the anchor, prior target text is unchanged.",
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
  "prior": {
    "claimId": "claim_e2377849e4ba8e3d3beaf70880e4ed23",
    "sourceUnitDigest": "39e4ab1f30a6acc99de534a9fd16bd348b9ef8c1827664c0a7a50487f0587c0c",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-34",
    "claimKind": "contract",
    "disposition": "supersede",
    "reviewStatus": "reviewed",
    "rationale": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover.",
    "authoredBy": "codex-session:unit-run-1792052396770-6f1c5957@2026-10-15",
    "sourcePath": "docs/io-contract.md",
    "sourceAnchor": "unheaded-block-19",
    "reviewNote": "deep: gap row; old bullet-list digest 39e4ab1f found at 3ea75475d block 19; successor carrier bullets block 34 e013c5b0 unchanged, shift 33 to 34; word diff read: externalEffect sentence and the subcommands bullet; supersede unchanged (this is the unit rows 6 and 7 should also point to)",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-15",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-261015-1526-specs-ui-reworks-main-recarry.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "e013c5b05d6ff58782aa8231ab4a55967bd5ef853dac4015aec8f16f5fcf9c68",
    "targetAncestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Entry Fields And Effect Axes"
    ],
    "reviewReportCommit": "0e8ce7710ac67ad038927b242b2461876bf8c90d"
  },
  "targetWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-35",
    "githubAnchor": "unheaded-block-35",
    "stableAnchor": "unheaded-block-35",
    "title": "Unheaded block 35",
    "startLine": 322,
    "endLine": 336,
    "textDigest": "e013c5b05d6ff58782aa8231ab4a55967bd5ef853dac4015aec8f16f5fcf9c68",
    "sample": "- `name`, cách gọi, mô tả một dòng, lược đồ tham số, ví dụ, `deprecated`\n  (null hoặc chuỗi hướng dẫn deprecation; CLI renderer cũng chấp nhận metadata\n  cấu trúc để không rò `unde",
    "identityFingerprint": "a2e363fadb4249200e60df2aadad52b9400844e58930f9461c17ddb0feb33e8d",
    "ancestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Entry Fields And Effect Axes"
    ],
    "text": "- `name`, cách gọi, mô tả một dòng, lược đồ tham số, ví dụ, `deprecated`\n  (null hoặc chuỗi hướng dẫn deprecation; CLI renderer cũng chấp nhận metadata\n  cấu trúc để không rò `undefined`/`[object Object]` nếu schema tương lai mở rộng).\n- **`touchesState`** (verb có bao giờ ghi trạng thái fgOS) và\n  **`externalEffect`** (verb có bao giờ gọi dịch vụ ngoài fgOS) — hai trục\n  độc lập thay cho `access` cũ (từng gộp hai câu hỏi vào một giá trị,\n  sai cho `review`: nó khai `mutation` chỉ vì `--github` tạo PR thật, dù\n  bản thân `review` không hề ghi trạng thái). Danh sách hiện hành mang `externalEffect: true` lấy từ manifest\n  `COMMAND_REGISTRY` qua `fgos --help --json`: 15 verb, không có\n  `coordination` (ví dụ `review`, `approve`, `run` — dispatch executor thật\n  tính là effect ngoài `.fgos/`).\n- `paginated` (xem trên) và `multiValueFormat` (dưới) khi áp dụng.\n- `subcommands` cho verb có sub-verb ở vị trí đầu: `{<sub>: {description,\n  parameters, examples}}`, mỗi sub-verb chỉ mang cờ nó thật sự đọc;\n  `parameters` cấp verb khi đó chỉ còn `sub`."
  },
  "relatedClaimId": "claim_e2377849e4ba8e3d3beaf70880e4ed23",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
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
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-35",
    "githubAnchor": "unheaded-block-35",
    "stableAnchor": "unheaded-block-35",
    "title": "Unheaded block 35",
    "startLine": 322,
    "endLine": 336,
    "textDigest": "e013c5b05d6ff58782aa8231ab4a55967bd5ef853dac4015aec8f16f5fcf9c68",
    "sample": "- `name`, cách gọi, mô tả một dòng, lược đồ tham số, ví dụ, `deprecated`\n  (null hoặc chuỗi hướng dẫn deprecation; CLI renderer cũng chấp nhận metadata\n  cấu trúc để không rò `unde",
    "identityFingerprint": "a2e363fadb4249200e60df2aadad52b9400844e58930f9461c17ddb0feb33e8d",
    "ancestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Entry Fields And Effect Axes"
    ],
    "text": "- `name`, cách gọi, mô tả một dòng, lược đồ tham số, ví dụ, `deprecated`\n  (null hoặc chuỗi hướng dẫn deprecation; CLI renderer cũng chấp nhận metadata\n  cấu trúc để không rò `undefined`/`[object Object]` nếu schema tương lai mở rộng).\n- **`touchesState`** (verb có bao giờ ghi trạng thái fgOS) và\n  **`externalEffect`** (verb có bao giờ gọi dịch vụ ngoài fgOS) — hai trục\n  độc lập thay cho `access` cũ (từng gộp hai câu hỏi vào một giá trị,\n  sai cho `review`: nó khai `mutation` chỉ vì `--github` tạo PR thật, dù\n  bản thân `review` không hề ghi trạng thái). Danh sách hiện hành mang `externalEffect: true` lấy từ manifest\n  `COMMAND_REGISTRY` qua `fgos --help --json`: 15 verb, không có\n  `coordination` (ví dụ `review`, `approve`, `run` — dispatch executor thật\n  tính là effect ngoài `.fgos/`).\n- `paginated` (xem trên) và `multiValueFormat` (dưới) khi áp dụng.\n- `subcommands` cho verb có sub-verb ở vị trí đầu: `{<sub>: {description,\n  parameters, examples}}`, mỗi sub-verb chỉ mang cờ nó thật sự đọc;\n  `parameters` cấp verb khi đó chỉ còn `sub`."
  },
  "oldAnchor": "unheaded-block-34",
  "newAnchor": "unheaded-block-35",
  "oldDigest": "e013c5b05d6ff58782aa8231ab4a55967bd5ef853dac4015aec8f16f5fcf9c68",
  "newDigest": "e013c5b05d6ff58782aa8231ab4a55967bd5ef853dac4015aec8f16f5fcf9c68",
  "deepRequired": true,
  "helper": "scripts/doc-binding-repair.mjs",
  "contentProof": {
    "priorCommit": "ab4d6274a",
    "priorMatchingUnits": [
      {
        "unitKind": "unheaded-block",
        "anchor": "unheaded-block-34",
        "githubAnchor": "unheaded-block-34",
        "stableAnchor": "unheaded-block-34",
        "title": "Unheaded block 34",
        "startLine": 312,
        "endLine": 326,
        "textDigest": "e013c5b05d6ff58782aa8231ab4a55967bd5ef853dac4015aec8f16f5fcf9c68",
        "sample": "- `name`, cách gọi, mô tả một dòng, lược đồ tham số, ví dụ, `deprecated`\n  (null hoặc chuỗi hướng dẫn deprecation; CLI renderer cũng chấp nhận metadata\n  cấu trúc để không rò `unde",
        "identityFingerprint": "a2e363fadb4249200e60df2aadad52b9400844e58930f9461c17ddb0feb33e8d",
        "ancestry": [
          "CLI I/O Contract",
          "7. Machine-Readable Verb Registry",
          "Entry Fields And Effect Axes"
        ],
        "text": "- `name`, cách gọi, mô tả một dòng, lược đồ tham số, ví dụ, `deprecated`\n  (null hoặc chuỗi hướng dẫn deprecation; CLI renderer cũng chấp nhận metadata\n  cấu trúc để không rò `undefined`/`[object Object]` nếu schema tương lai mở rộng).\n- **`touchesState`** (verb có bao giờ ghi trạng thái fgOS) và\n  **`externalEffect`** (verb có bao giờ gọi dịch vụ ngoài fgOS) — hai trục\n  độc lập thay cho `access` cũ (từng gộp hai câu hỏi vào một giá trị,\n  sai cho `review`: nó khai `mutation` chỉ vì `--github` tạo PR thật, dù\n  bản thân `review` không hề ghi trạng thái). Danh sách hiện hành mang `externalEffect: true` lấy từ manifest\n  `COMMAND_REGISTRY` qua `fgos --help --json`: 15 verb, không có\n  `coordination` (ví dụ `review`, `approve`, `run` — dispatch executor thật\n  tính là effect ngoài `.fgos/`).\n- `paginated` (xem trên) và `multiValueFormat` (dưới) khi áp dụng.\n- `subcommands` cho verb có sub-verb ở vị trí đầu: `{<sub>: {description,\n  parameters, examples}}`, mỗi sub-verb chỉ mang cờ nó thật sự đọc;\n  `parameters` cấp verb khi đó chỉ còn `sub`."
      }
    ],
    "currentText": "- `name`, cách gọi, mô tả một dòng, lược đồ tham số, ví dụ, `deprecated`\n  (null hoặc chuỗi hướng dẫn deprecation; CLI renderer cũng chấp nhận metadata\n  cấu trúc để không rò `undefined`/`[object Object]` nếu schema tương lai mở rộng).\n- **`touchesState`** (verb có bao giờ ghi trạng thái fgOS) và\n  **`externalEffect`** (verb có bao giờ gọi dịch vụ ngoài fgOS) — hai trục\n  độc lập thay cho `access` cũ (từng gộp hai câu hỏi vào một giá trị,\n  sai cho `review`: nó khai `mutation` chỉ vì `--github` tạo PR thật, dù\n  bản thân `review` không hề ghi trạng thái). Danh sách hiện hành mang `externalEffect: true` lấy từ manifest\n  `COMMAND_REGISTRY` qua `fgos --help --json`: 15 verb, không có\n  `coordination` (ví dụ `review`, `approve`, `run` — dispatch executor thật\n  tính là effect ngoài `.fgos/`).\n- `paginated` (xem trên) và `multiValueFormat` (dưới) khi áp dụng.\n- `subcommands` cho verb có sub-verb ở vị trí đầu: `{<sub>: {description,\n  parameters, examples}}`, mỗi sub-verb chỉ mang cờ nó thật sự đọc;\n  `parameters` cấp verb khi đó chỉ còn `sub`.",
    "allPriorMatchingTextsEqualCurrent": true,
    "helperReplayed": true
  },
  "reviewScope": "Re-anchor receipt; claim verdict belongs to decisions section.",
  "packagedBy": "codex-session:unit-run-1792094246578-b2fbe39b@2026-10-16",
  "currentContentCommit": "345f15d95663260976200be66d1b9a6c648bcd6d",
  "entryId": "anchors-010"
}
```

## Entry anchors-011

```json
{
  "kind": "content-reanchoring-proof",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-io-contract.json",
  "collection": "registryGaps",
  "before": {
    "claimId": "claim_2fa062c56cf4226e8519e768a5b5cab4",
    "sourceUnitDigest": "3727b3fa0ee79f8b0b38d0e9fc868e336e85f10e12f7dbd47a34d140f3681127",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-22",
    "claimKind": "contract",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "rationale": "A31 native source predecessor became identity gap; retain native ID, supersede accounting to current carrier. A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "sourcePath": "docs/io-contract.md",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetUnitDigest": "bdeca0144b587f826ce46ea61d3be2e882ad021614d1e5f7c14cf2982573f056",
    "targetAncestry": [
      "CLI I/O Contract",
      "3. Output Direction Unified Envelope",
      "Recognizing A Real Envelope"
    ]
  },
  "after": {
    "claimId": "claim_2fa062c56cf4226e8519e768a5b5cab4",
    "sourceUnitDigest": "3727b3fa0ee79f8b0b38d0e9fc868e336e85f10e12f7dbd47a34d140f3681127",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-23",
    "claimKind": "contract",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "rationale": "A31 native source predecessor became identity gap; retain native ID, supersede accounting to current carrier. A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. L10-21: content-based rebind from reviewed prior target unheaded-block-22 (d1af2d5a982f5d139fda776a23b4ad0b3776cc40c1fc0177636c44bdc91b968d) to unheaded-block-23 (d1af2d5a982f5d139fda776a23b4ad0b3776cc40c1fc0177636c44bdc91b968d); inserted paragraphs shift the anchor, prior target text is unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "sourcePath": "docs/io-contract.md",
    "targetUnitDigest": "d1af2d5a982f5d139fda776a23b4ad0b3776cc40c1fc0177636c44bdc91b968d",
    "targetAncestry": [
      "CLI I/O Contract",
      "4. Exit Codes"
    ]
  },
  "prior": {
    "claimId": "claim_2fa062c56cf4226e8519e768a5b5cab4",
    "sourceUnitDigest": "3727b3fa0ee79f8b0b38d0e9fc868e336e85f10e12f7dbd47a34d140f3681127",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-22",
    "claimKind": "contract",
    "disposition": "supersede",
    "reviewStatus": "reviewed",
    "rationale": "A31 native source predecessor became identity gap; retain native ID, supersede accounting to current carrier. A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover.",
    "authoredBy": "codex-session:unit-run-1792052396770-6f1c5957@2026-10-15",
    "sourcePath": "docs/io-contract.md",
    "reviewNote": "deep: gap row; old digest 3727b3fa equals the pre-merge legacy block 13 (parent 1); successor block 22 d1af2d5a is byte-equal to the new legacy block 13 (adds 4 not-found, OUTCOME_EXIT_CODES, 0 = ok / pass); promote to supersede is explained by the identity-gap rationale; sourcePath added; pending",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-15",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-261015-1526-specs-ui-reworks-main-recarry.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "d1af2d5a982f5d139fda776a23b4ad0b3776cc40c1fc0177636c44bdc91b968d",
    "targetAncestry": [
      "CLI I/O Contract",
      "4. Exit Codes"
    ],
    "reviewReportCommit": "0e8ce7710ac67ad038927b242b2461876bf8c90d"
  },
  "targetWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-23",
    "githubAnchor": "unheaded-block-23",
    "stableAnchor": "unheaded-block-23",
    "title": "Unheaded block 23",
    "startLine": 188,
    "endLine": 193,
    "textDigest": "d1af2d5a982f5d139fda776a23b4ad0b3776cc40c1fc0177636c44bdc91b968d",
    "sample": "`src/state/store.mjs`'s `EXIT_CODES` (2 precondition [bao gồm not-found / run-not-found / missing-run] · 3 conflict ·\n4 validation · 5 corrupt-log · 7 lock-timeout · 8 session-fail",
    "identityFingerprint": "78a5ddb4f5e294cd0185681fedb1e548cace7fbb42d520feec13ae171ceafb00",
    "ancestry": [
      "CLI I/O Contract",
      "4. Exit Codes"
    ],
    "text": "`src/state/store.mjs`'s `EXIT_CODES` (2 precondition [bao gồm not-found / run-not-found / missing-run] · 3 conflict ·\n4 validation · 5 corrupt-log · 7 lock-timeout · 8 session-fail · 9 merge-fail · 4 not-found) cộng\n`OUTCOME_EXIT_CODES` (4 policy-refusal · 10 provider-limit · 11 execution-failure · 12 partial-writes ·\n13 blocked · 14 findings) cộng `src/runner/loop.mjs`'s `EXIT_BUSY` (6, riêng của\nrunner) là bảng DUY NHẤT. 0 = ok / pass, 1 = bất ngờ (mọi thứ chưa phân loại).\nConsumer rẽ nhánh theo mã thoát phạm trù, không bao giờ theo thông điệp."
  },
  "relatedClaimId": "claim_2fa062c56cf4226e8519e768a5b5cab4",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
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
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-23",
    "githubAnchor": "unheaded-block-23",
    "stableAnchor": "unheaded-block-23",
    "title": "Unheaded block 23",
    "startLine": 188,
    "endLine": 193,
    "textDigest": "d1af2d5a982f5d139fda776a23b4ad0b3776cc40c1fc0177636c44bdc91b968d",
    "sample": "`src/state/store.mjs`'s `EXIT_CODES` (2 precondition [bao gồm not-found / run-not-found / missing-run] · 3 conflict ·\n4 validation · 5 corrupt-log · 7 lock-timeout · 8 session-fail",
    "identityFingerprint": "78a5ddb4f5e294cd0185681fedb1e548cace7fbb42d520feec13ae171ceafb00",
    "ancestry": [
      "CLI I/O Contract",
      "4. Exit Codes"
    ],
    "text": "`src/state/store.mjs`'s `EXIT_CODES` (2 precondition [bao gồm not-found / run-not-found / missing-run] · 3 conflict ·\n4 validation · 5 corrupt-log · 7 lock-timeout · 8 session-fail · 9 merge-fail · 4 not-found) cộng\n`OUTCOME_EXIT_CODES` (4 policy-refusal · 10 provider-limit · 11 execution-failure · 12 partial-writes ·\n13 blocked · 14 findings) cộng `src/runner/loop.mjs`'s `EXIT_BUSY` (6, riêng của\nrunner) là bảng DUY NHẤT. 0 = ok / pass, 1 = bất ngờ (mọi thứ chưa phân loại).\nConsumer rẽ nhánh theo mã thoát phạm trù, không bao giờ theo thông điệp."
  },
  "oldAnchor": "unheaded-block-22",
  "newAnchor": "unheaded-block-23",
  "oldDigest": "d1af2d5a982f5d139fda776a23b4ad0b3776cc40c1fc0177636c44bdc91b968d",
  "newDigest": "d1af2d5a982f5d139fda776a23b4ad0b3776cc40c1fc0177636c44bdc91b968d",
  "deepRequired": true,
  "helper": "scripts/doc-binding-repair.mjs",
  "contentProof": {
    "priorCommit": "ab4d6274a",
    "priorMatchingUnits": [
      {
        "unitKind": "unheaded-block",
        "anchor": "unheaded-block-22",
        "githubAnchor": "unheaded-block-22",
        "stableAnchor": "unheaded-block-22",
        "title": "Unheaded block 22",
        "startLine": 178,
        "endLine": 183,
        "textDigest": "d1af2d5a982f5d139fda776a23b4ad0b3776cc40c1fc0177636c44bdc91b968d",
        "sample": "`src/state/store.mjs`'s `EXIT_CODES` (2 precondition [bao gồm not-found / run-not-found / missing-run] · 3 conflict ·\n4 validation · 5 corrupt-log · 7 lock-timeout · 8 session-fail",
        "identityFingerprint": "78a5ddb4f5e294cd0185681fedb1e548cace7fbb42d520feec13ae171ceafb00",
        "ancestry": [
          "CLI I/O Contract",
          "4. Exit Codes"
        ],
        "text": "`src/state/store.mjs`'s `EXIT_CODES` (2 precondition [bao gồm not-found / run-not-found / missing-run] · 3 conflict ·\n4 validation · 5 corrupt-log · 7 lock-timeout · 8 session-fail · 9 merge-fail · 4 not-found) cộng\n`OUTCOME_EXIT_CODES` (4 policy-refusal · 10 provider-limit · 11 execution-failure · 12 partial-writes ·\n13 blocked · 14 findings) cộng `src/runner/loop.mjs`'s `EXIT_BUSY` (6, riêng của\nrunner) là bảng DUY NHẤT. 0 = ok / pass, 1 = bất ngờ (mọi thứ chưa phân loại).\nConsumer rẽ nhánh theo mã thoát phạm trù, không bao giờ theo thông điệp."
      }
    ],
    "currentText": "`src/state/store.mjs`'s `EXIT_CODES` (2 precondition [bao gồm not-found / run-not-found / missing-run] · 3 conflict ·\n4 validation · 5 corrupt-log · 7 lock-timeout · 8 session-fail · 9 merge-fail · 4 not-found) cộng\n`OUTCOME_EXIT_CODES` (4 policy-refusal · 10 provider-limit · 11 execution-failure · 12 partial-writes ·\n13 blocked · 14 findings) cộng `src/runner/loop.mjs`'s `EXIT_BUSY` (6, riêng của\nrunner) là bảng DUY NHẤT. 0 = ok / pass, 1 = bất ngờ (mọi thứ chưa phân loại).\nConsumer rẽ nhánh theo mã thoát phạm trù, không bao giờ theo thông điệp.",
    "allPriorMatchingTextsEqualCurrent": true,
    "helperReplayed": true
  },
  "reviewScope": "Re-anchor receipt; claim verdict belongs to decisions section.",
  "packagedBy": "codex-session:unit-run-1792094246578-b2fbe39b@2026-10-16",
  "currentContentCommit": "345f15d95663260976200be66d1b9a6c648bcd6d",
  "entryId": "anchors-011"
}
```

## Entry anchors-012

```json
{
  "kind": "content-reanchoring-proof",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-boundary-gaps.json",
  "collection": "registryGaps",
  "before": {
    "claimId": "claim_15308eb4847ddd38be79bd87bd69a0b6",
    "sourcePath": "docs/specs/confinement-authority.md",
    "sourceUnitDigest": "a58b4be15c55c3d02464399b2586a140a5570426f09c064077121b88783931f6",
    "disposition": "supersede",
    "targetOwner": "docs/specs/confinement-authority.md",
    "targetAnchor": "unheaded-block-140",
    "targetUnitDigest": "09081a2c1a3eb4536192eed72162efca188fdf9b084170519b57415f216c32c3",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewStatus": "pending",
    "rationale": "A31 main-only source change: this native old identity gap has the shown same-file successor from the upstream diff. This is conservation accounting, not a plan move or truth approval. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)",
      "13.1 Pane herdr bị confine cho agent không phải claude: công thức, lịch sử, vì sao từng bị quên"
    ],
    "reviewNote": "Independent review pending at corrected current binding; no approval carried."
  },
  "after": {
    "claimId": "claim_15308eb4847ddd38be79bd87bd69a0b6",
    "sourcePath": "docs/specs/confinement-authority.md",
    "sourceUnitDigest": "a58b4be15c55c3d02464399b2586a140a5570426f09c064077121b88783931f6",
    "disposition": "supersede",
    "targetOwner": "docs/specs/confinement-authority.md",
    "targetAnchor": "unheaded-block-141",
    "targetUnitDigest": "0291bfb160d8cd95cf9b5d305ba952d9f824993e04ebbfdde79b629f8b1a92dc",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewStatus": "pending",
    "rationale": "A31 main-only source change: this native old identity gap has the shown same-file successor from the upstream diff. This is conservation accounting, not a plan move or truth approval. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. L10-21: content-based rebind from reviewed prior target unheaded-block-140 (0291bfb160d8cd95cf9b5d305ba952d9f824993e04ebbfdde79b629f8b1a92dc) to unheaded-block-141 (0291bfb160d8cd95cf9b5d305ba952d9f824993e04ebbfdde79b629f8b1a92dc); inserted paragraphs shift the anchor, prior target text is unchanged.",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)",
      "13.1 Pane herdr bị confine cho agent không phải claude: công thức, lịch sử, vì sao từng bị quên"
    ]
  },
  "prior": {
    "claimId": "claim_15308eb4847ddd38be79bd87bd69a0b6",
    "sourcePath": "docs/specs/confinement-authority.md",
    "sourceUnitDigest": "a58b4be15c55c3d02464399b2586a140a5570426f09c064077121b88783931f6",
    "disposition": "supersede",
    "targetOwner": "docs/specs/confinement-authority.md",
    "targetAnchor": "unheaded-block-140",
    "targetUnitDigest": "0291bfb160d8cd95cf9b5d305ba952d9f824993e04ebbfdde79b629f8b1a92dc",
    "authoredBy": "codex-session:5@2026-10-13",
    "reviewStatus": "reviewed",
    "rationale": "A31 main-only source change: this native old identity gap has the shown same-file successor from the upstream diff. This is conservation accounting, not a plan move or truth approval.",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)",
      "13.1 Pane herdr bị confine cho agent không phải claude: công thức, lịch sử, vì sao từng bị quên"
    ],
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-13",
    "reviewedAt": "2026-10-13",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-3-boundary-gaps.md",
    "reviewReportCommit": "168a27c6c704854b4777792e6632302f1616c65a",
    "reviewMode": "ordinary",
    "reviewNote": "ok. confinement-authority block (lines 1357-1359): item 2 gets an inserted sentence on per-CLI credentialSources (RUL80); item 3 replaces 'thật;' with a longer clause about the leased account's own store (RUL78). Only a closing fragment of the old item 3 is rewritten, and its content is preserved in the longer clause; three-way equals HEAD."
  },
  "targetWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-141",
    "githubAnchor": "unheaded-block-141",
    "stableAnchor": "unheaded-block-141",
    "title": "Unheaded block 141",
    "startLine": 1359,
    "endLine": 1361,
    "textDigest": "0291bfb160d8cd95cf9b5d305ba952d9f824993e04ebbfdde79b629f8b1a92dc",
    "sample": "1. `resourceBindings: [{ resource: 'private-home', target: { kind: 'env', name: <CODEX_HOME | HOME | PI_CODING_AGENT_DIR> } }]` trên invocation (cùng dạng `codex-cli-bwrap`).\n2. Lo",
    "identityFingerprint": "51e99bed879457f9235eb52b9428a7aab1c3f092b615b88a81f7b5c1476486ed",
    "ancestry": [
      "Spec: Agent Confinement Authority",
      "13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)",
      "13.1 Pane herdr bị confine cho agent không phải claude: công thức, lịch sử, vì sao từng bị quên"
    ],
    "text": "1. `resourceBindings: [{ resource: 'private-home', target: { kind: 'env', name: <CODEX_HOME | HOME | PI_CODING_AGENT_DIR> } }]` trên invocation (cùng dạng `codex-cli-bwrap`).\n2. Login của account đến từ inventory toàn máy `runner.providers.<provider>.accounts.<id>.credentialSource` trong `~/.fgos/config.json` (RUL65b của `docs/specs/runner.md`): kind `codex-home` (`auth.json`) hoặc `home-files` (danh sách file tường minh, copy owner-only, fail closed) — driver `drivers/bwrap.mjs` copy vào private home trước khi spawn. Account có thể khai `credentialSources` (một store cho mỗi CLI, key là tên lệnh); request của Authority (`buildConfinementRequest`) chọn store của CLI mà invocation chạy, và CLI không có store thì bị từ chối trước khi worker chạy (runner.md RUL80 (account trước, CLI sau: một login store cho mỗi CLI)). Không mount thư mục account thật, không bypass flag thay sandbox.\n3. Trust của workspace ghi vào store trong private home (`herdr-round.mjs` `trustStorePaths`), dẫn xuất từ store account thật — store của chính account được lease (credential source mà Authority chuyển cho adapter qua `trustAccountSource`), không phải account mà env tĩnh của invocation chỉ tới (runner.md RUL78 (a confined pane reads its folder trust from the leased account's own store)); với codex, trust từng hook của `<cwd>/.codex/hooks.json` (`[hooks.state.\"<đường dẫn tuyệt đối>:<event>:<nhóm>:<handler>\"] trusted_hash`, băm theo luật của codex, ghim bằng test) được gieo cùng lúc, chỉ vào config của private home (không bao giờ vào config thật của account; private home bị xoá sau dispatch nên không có bước gỡ) và chỉ khi gốc repo đã được người dùng tin; với claude, các MCP server do `<cwd>/.mcp.json` khai báo được duyệt riêng cho tiến trình worker bằng `--settings` (`enabledMcpjsonServers`, thêm vào args khi chuẩn bị worker invocation; không ghi file dùng chung), cũng chỉ khi gốc repo đã được tin; `fgos doctor` check `confined-pane-accounts` báo pane nào sẽ khởi động chưa đăng nhập."
  },
  "relatedClaimId": "claim_15308eb4847ddd38be79bd87bd69a0b6",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_15308eb4847ddd38be79bd87bd69a0b6",
    "sourcePath": "docs/specs/confinement-authority.md",
    "sourceUnitDigest": "a58b4be15c55c3d02464399b2586a140a5570426f09c064077121b88783931f6",
    "disposition": "supersede",
    "targetOwner": "docs/specs/confinement-authority.md",
    "targetAnchor": "unheaded-block-141",
    "targetUnitDigest": "0291bfb160d8cd95cf9b5d305ba952d9f824993e04ebbfdde79b629f8b1a92dc",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewStatus": "pending",
    "rationale": "A31 main-only source change: this native old identity gap has the shown same-file successor from the upstream diff. This is conservation accounting, not a plan move or truth approval. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. L10-21: content-based rebind from reviewed prior target unheaded-block-140 (0291bfb160d8cd95cf9b5d305ba952d9f824993e04ebbfdde79b629f8b1a92dc) to unheaded-block-141 (0291bfb160d8cd95cf9b5d305ba952d9f824993e04ebbfdde79b629f8b1a92dc); inserted paragraphs shift the anchor, prior target text is unchanged.",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)",
      "13.1 Pane herdr bị confine cho agent không phải claude: công thức, lịch sử, vì sao từng bị quên"
    ]
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-141",
    "githubAnchor": "unheaded-block-141",
    "stableAnchor": "unheaded-block-141",
    "title": "Unheaded block 141",
    "startLine": 1359,
    "endLine": 1361,
    "textDigest": "0291bfb160d8cd95cf9b5d305ba952d9f824993e04ebbfdde79b629f8b1a92dc",
    "sample": "1. `resourceBindings: [{ resource: 'private-home', target: { kind: 'env', name: <CODEX_HOME | HOME | PI_CODING_AGENT_DIR> } }]` trên invocation (cùng dạng `codex-cli-bwrap`).\n2. Lo",
    "identityFingerprint": "51e99bed879457f9235eb52b9428a7aab1c3f092b615b88a81f7b5c1476486ed",
    "ancestry": [
      "Spec: Agent Confinement Authority",
      "13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)",
      "13.1 Pane herdr bị confine cho agent không phải claude: công thức, lịch sử, vì sao từng bị quên"
    ],
    "text": "1. `resourceBindings: [{ resource: 'private-home', target: { kind: 'env', name: <CODEX_HOME | HOME | PI_CODING_AGENT_DIR> } }]` trên invocation (cùng dạng `codex-cli-bwrap`).\n2. Login của account đến từ inventory toàn máy `runner.providers.<provider>.accounts.<id>.credentialSource` trong `~/.fgos/config.json` (RUL65b của `docs/specs/runner.md`): kind `codex-home` (`auth.json`) hoặc `home-files` (danh sách file tường minh, copy owner-only, fail closed) — driver `drivers/bwrap.mjs` copy vào private home trước khi spawn. Account có thể khai `credentialSources` (một store cho mỗi CLI, key là tên lệnh); request của Authority (`buildConfinementRequest`) chọn store của CLI mà invocation chạy, và CLI không có store thì bị từ chối trước khi worker chạy (runner.md RUL80 (account trước, CLI sau: một login store cho mỗi CLI)). Không mount thư mục account thật, không bypass flag thay sandbox.\n3. Trust của workspace ghi vào store trong private home (`herdr-round.mjs` `trustStorePaths`), dẫn xuất từ store account thật — store của chính account được lease (credential source mà Authority chuyển cho adapter qua `trustAccountSource`), không phải account mà env tĩnh của invocation chỉ tới (runner.md RUL78 (a confined pane reads its folder trust from the leased account's own store)); với codex, trust từng hook của `<cwd>/.codex/hooks.json` (`[hooks.state.\"<đường dẫn tuyệt đối>:<event>:<nhóm>:<handler>\"] trusted_hash`, băm theo luật của codex, ghim bằng test) được gieo cùng lúc, chỉ vào config của private home (không bao giờ vào config thật của account; private home bị xoá sau dispatch nên không có bước gỡ) và chỉ khi gốc repo đã được người dùng tin; với claude, các MCP server do `<cwd>/.mcp.json` khai báo được duyệt riêng cho tiến trình worker bằng `--settings` (`enabledMcpjsonServers`, thêm vào args khi chuẩn bị worker invocation; không ghi file dùng chung), cũng chỉ khi gốc repo đã được tin; `fgos doctor` check `confined-pane-accounts` báo pane nào sẽ khởi động chưa đăng nhập."
  },
  "oldAnchor": "unheaded-block-140",
  "newAnchor": "unheaded-block-141",
  "oldDigest": "0291bfb160d8cd95cf9b5d305ba952d9f824993e04ebbfdde79b629f8b1a92dc",
  "newDigest": "0291bfb160d8cd95cf9b5d305ba952d9f824993e04ebbfdde79b629f8b1a92dc",
  "deepRequired": true,
  "helper": "scripts/doc-binding-repair.mjs",
  "contentProof": {
    "priorCommit": "ab4d6274a",
    "priorMatchingUnits": [
      {
        "unitKind": "unheaded-block",
        "anchor": "unheaded-block-141",
        "githubAnchor": "unheaded-block-141",
        "stableAnchor": "unheaded-block-141",
        "title": "Unheaded block 141",
        "startLine": 1359,
        "endLine": 1361,
        "textDigest": "0291bfb160d8cd95cf9b5d305ba952d9f824993e04ebbfdde79b629f8b1a92dc",
        "sample": "1. `resourceBindings: [{ resource: 'private-home', target: { kind: 'env', name: <CODEX_HOME | HOME | PI_CODING_AGENT_DIR> } }]` trên invocation (cùng dạng `codex-cli-bwrap`).\n2. Lo",
        "identityFingerprint": "51e99bed879457f9235eb52b9428a7aab1c3f092b615b88a81f7b5c1476486ed",
        "ancestry": [
          "Spec: Agent Confinement Authority",
          "13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)",
          "13.1 Pane herdr bị confine cho agent không phải claude: công thức, lịch sử, vì sao từng bị quên"
        ],
        "text": "1. `resourceBindings: [{ resource: 'private-home', target: { kind: 'env', name: <CODEX_HOME | HOME | PI_CODING_AGENT_DIR> } }]` trên invocation (cùng dạng `codex-cli-bwrap`).\n2. Login của account đến từ inventory toàn máy `runner.providers.<provider>.accounts.<id>.credentialSource` trong `~/.fgos/config.json` (RUL65b của `docs/specs/runner.md`): kind `codex-home` (`auth.json`) hoặc `home-files` (danh sách file tường minh, copy owner-only, fail closed) — driver `drivers/bwrap.mjs` copy vào private home trước khi spawn. Account có thể khai `credentialSources` (một store cho mỗi CLI, key là tên lệnh); request của Authority (`buildConfinementRequest`) chọn store của CLI mà invocation chạy, và CLI không có store thì bị từ chối trước khi worker chạy (runner.md RUL80 (account trước, CLI sau: một login store cho mỗi CLI)). Không mount thư mục account thật, không bypass flag thay sandbox.\n3. Trust của workspace ghi vào store trong private home (`herdr-round.mjs` `trustStorePaths`), dẫn xuất từ store account thật — store của chính account được lease (credential source mà Authority chuyển cho adapter qua `trustAccountSource`), không phải account mà env tĩnh của invocation chỉ tới (runner.md RUL78 (a confined pane reads its folder trust from the leased account's own store)); với codex, trust từng hook của `<cwd>/.codex/hooks.json` (`[hooks.state.\"<đường dẫn tuyệt đối>:<event>:<nhóm>:<handler>\"] trusted_hash`, băm theo luật của codex, ghim bằng test) được gieo cùng lúc, chỉ vào config của private home (không bao giờ vào config thật của account; private home bị xoá sau dispatch nên không có bước gỡ) và chỉ khi gốc repo đã được người dùng tin; với claude, các MCP server do `<cwd>/.mcp.json` khai báo được duyệt riêng cho tiến trình worker bằng `--settings` (`enabledMcpjsonServers`, thêm vào args khi chuẩn bị worker invocation; không ghi file dùng chung), cũng chỉ khi gốc repo đã được tin; `fgos doctor` check `confined-pane-accounts` báo pane nào sẽ khởi động chưa đăng nhập."
      }
    ],
    "currentText": "1. `resourceBindings: [{ resource: 'private-home', target: { kind: 'env', name: <CODEX_HOME | HOME | PI_CODING_AGENT_DIR> } }]` trên invocation (cùng dạng `codex-cli-bwrap`).\n2. Login của account đến từ inventory toàn máy `runner.providers.<provider>.accounts.<id>.credentialSource` trong `~/.fgos/config.json` (RUL65b của `docs/specs/runner.md`): kind `codex-home` (`auth.json`) hoặc `home-files` (danh sách file tường minh, copy owner-only, fail closed) — driver `drivers/bwrap.mjs` copy vào private home trước khi spawn. Account có thể khai `credentialSources` (một store cho mỗi CLI, key là tên lệnh); request của Authority (`buildConfinementRequest`) chọn store của CLI mà invocation chạy, và CLI không có store thì bị từ chối trước khi worker chạy (runner.md RUL80 (account trước, CLI sau: một login store cho mỗi CLI)). Không mount thư mục account thật, không bypass flag thay sandbox.\n3. Trust của workspace ghi vào store trong private home (`herdr-round.mjs` `trustStorePaths`), dẫn xuất từ store account thật — store của chính account được lease (credential source mà Authority chuyển cho adapter qua `trustAccountSource`), không phải account mà env tĩnh của invocation chỉ tới (runner.md RUL78 (a confined pane reads its folder trust from the leased account's own store)); với codex, trust từng hook của `<cwd>/.codex/hooks.json` (`[hooks.state.\"<đường dẫn tuyệt đối>:<event>:<nhóm>:<handler>\"] trusted_hash`, băm theo luật của codex, ghim bằng test) được gieo cùng lúc, chỉ vào config của private home (không bao giờ vào config thật của account; private home bị xoá sau dispatch nên không có bước gỡ) và chỉ khi gốc repo đã được người dùng tin; với claude, các MCP server do `<cwd>/.mcp.json` khai báo được duyệt riêng cho tiến trình worker bằng `--settings` (`enabledMcpjsonServers`, thêm vào args khi chuẩn bị worker invocation; không ghi file dùng chung), cũng chỉ khi gốc repo đã được tin; `fgos doctor` check `confined-pane-accounts` báo pane nào sẽ khởi động chưa đăng nhập.",
    "allPriorMatchingTextsEqualCurrent": true,
    "helperReplayed": true
  },
  "reviewScope": "Re-anchor receipt; claim verdict belongs to decisions section.",
  "packagedBy": "codex-session:unit-run-1792094246578-b2fbe39b@2026-10-16",
  "currentContentCommit": "345f15d95663260976200be66d1b9a6c648bcd6d",
  "entryId": "anchors-012"
}
```

## Entry anchors-013

```json
{
  "kind": "content-reanchoring-proof",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-boundary-gaps.json",
  "collection": "registryGaps",
  "before": {
    "claimId": "claim_97479b13a60800e856813bfd4f0cbb78",
    "sourcePath": "docs/specs/runner.md",
    "sourceUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "disposition": "supersede",
    "targetOwner": "docs/specs/runner.md",
    "targetAnchor": "unheaded-block-148",
    "targetUnitDigest": "9ab04443daf84a8574e1b4c6ae3c99098cbac4eb4a3e49af85c145cba700b73d",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewStatus": "pending",
    "rationale": "A31 main-only source change: this native old identity gap has the shown same-file successor from the upstream diff. This is conservation accounting, not a plan move or truth approval. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
    "targetAncestry": [
      "Spec: Runner (vòng tự hành)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0005 — Runner & cô lập worker",
      "Quyết định"
    ],
    "reviewNote": "Independent review pending at corrected current binding; no approval carried."
  },
  "after": {
    "claimId": "claim_97479b13a60800e856813bfd4f0cbb78",
    "sourcePath": "docs/specs/runner.md",
    "sourceUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "disposition": "supersede",
    "targetOwner": "docs/specs/runner.md",
    "targetAnchor": "unheaded-block-150",
    "targetUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewStatus": "pending",
    "rationale": "A31 main-only source change: this native old identity gap has the shown same-file successor from the upstream diff. This is conservation accounting, not a plan move or truth approval. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. L10-21: content-based rebind from reviewed prior target unheaded-block-148 (95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104) to unheaded-block-150 (95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104); inserted paragraphs shift the anchor, prior target text is unchanged.",
    "targetAncestry": [
      "Spec: Runner (vòng tự hành)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0005 — Runner & cô lập worker",
      "Hệ quả"
    ]
  },
  "prior": {
    "claimId": "claim_97479b13a60800e856813bfd4f0cbb78",
    "sourcePath": "docs/specs/runner.md",
    "sourceUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "disposition": "supersede",
    "targetOwner": "docs/specs/runner.md",
    "targetAnchor": "unheaded-block-148",
    "targetUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "authoredBy": "codex-session:5@2026-10-13",
    "reviewStatus": "reviewed",
    "rationale": "A31 main-only source change: this native old identity gap has the shown same-file successor from the upstream diff. This is conservation accounting, not a plan move or truth approval.",
    "targetAncestry": [
      "Spec: Runner (vòng tự hành)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0005 — Runner & cô lập worker",
      "Hệ quả"
    ],
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-13",
    "reviewedAt": "2026-10-13",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-3-boundary-gaps.md",
    "reviewReportCommit": "168a27c6c704854b4777792e6632302f1616c65a",
    "reviewMode": "ordinary",
    "reviewNote": "ok. Boilerplate line 'Đổi quyết định này = supersede...' is textually identical (digest 95a357e2...). Anchor 144 to 148 follows a uniform +17 line shift from main; occurrence 1 of 19 maps to occurrence 1 of 19 in the same order (1608 to 1625). Repeated-digest identity, no text change."
  },
  "targetWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-150",
    "githubAnchor": "unheaded-block-150",
    "stableAnchor": "unheaded-block-150",
    "title": "Unheaded block 150",
    "startLine": 1665,
    "endLine": 1665,
    "textDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "sample": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.",
    "identityFingerprint": "296f985e5b54ee8a748bb127a90d0627b6a791eefd97e4cde988251e983780d6",
    "ancestry": [
      "Spec: Runner (vòng tự hành)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0005 — Runner & cô lập worker",
      "Hệ quả"
    ],
    "text": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ."
  },
  "relatedClaimId": "claim_97479b13a60800e856813bfd4f0cbb78",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_97479b13a60800e856813bfd4f0cbb78",
    "sourcePath": "docs/specs/runner.md",
    "sourceUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "disposition": "supersede",
    "targetOwner": "docs/specs/runner.md",
    "targetAnchor": "unheaded-block-150",
    "targetUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewStatus": "pending",
    "rationale": "A31 main-only source change: this native old identity gap has the shown same-file successor from the upstream diff. This is conservation accounting, not a plan move or truth approval. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. L10-21: content-based rebind from reviewed prior target unheaded-block-148 (95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104) to unheaded-block-150 (95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104); inserted paragraphs shift the anchor, prior target text is unchanged.",
    "targetAncestry": [
      "Spec: Runner (vòng tự hành)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0005 — Runner & cô lập worker",
      "Hệ quả"
    ]
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-150",
    "githubAnchor": "unheaded-block-150",
    "stableAnchor": "unheaded-block-150",
    "title": "Unheaded block 150",
    "startLine": 1665,
    "endLine": 1665,
    "textDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "sample": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.",
    "identityFingerprint": "296f985e5b54ee8a748bb127a90d0627b6a791eefd97e4cde988251e983780d6",
    "ancestry": [
      "Spec: Runner (vòng tự hành)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0005 — Runner & cô lập worker",
      "Hệ quả"
    ],
    "text": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ."
  },
  "oldAnchor": "unheaded-block-148",
  "newAnchor": "unheaded-block-150",
  "oldDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
  "newDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
  "deepRequired": true,
  "helper": "scripts/doc-binding-repair.mjs",
  "contentProof": {
    "priorCommit": "ab4d6274a",
    "priorMatchingUnits": [
      {
        "unitKind": "unheaded-block",
        "anchor": "unheaded-block-150",
        "githubAnchor": "unheaded-block-150",
        "stableAnchor": "unheaded-block-150",
        "title": "Unheaded block 150",
        "startLine": 1665,
        "endLine": 1665,
        "textDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
        "sample": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.",
        "identityFingerprint": "296f985e5b54ee8a748bb127a90d0627b6a791eefd97e4cde988251e983780d6",
        "ancestry": [
          "Spec: Runner (vòng tự hành)",
          "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
          "0005 — Runner & cô lập worker",
          "Hệ quả"
        ],
        "text": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ."
      },
      {
        "unitKind": "unheaded-block",
        "anchor": "unheaded-block-155",
        "githubAnchor": "unheaded-block-155",
        "stableAnchor": "unheaded-block-155",
        "title": "Unheaded block 155",
        "startLine": 1693,
        "endLine": 1693,
        "textDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
        "sample": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.",
        "identityFingerprint": "296f985e5b54ee8a748bb127a90d0627b6a791eefd97e4cde988251e983780d6",
        "ancestry": [
          "Spec: Runner (vòng tự hành)",
          "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
          "0008 — Routing theo audience của từng interface",
          "Hệ quả"
        ],
        "text": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ."
      },
      {
        "unitKind": "unheaded-block",
        "anchor": "unheaded-block-167",
        "githubAnchor": "unheaded-block-167",
        "stableAnchor": "unheaded-block-167",
        "title": "Unheaded block 167",
        "startLine": 1802,
        "endLine": 1802,
        "textDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
        "sample": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.",
        "identityFingerprint": "296f985e5b54ee8a748bb127a90d0627b6a791eefd97e4cde988251e983780d6",
        "ancestry": [
          "Spec: Runner (vòng tự hành)",
          "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
          "0020 — Chặn `.fgos/` khỏi worktree worker (không khóa, không cô lập)",
          "Hệ quả"
        ],
        "text": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ."
      },
      {
        "unitKind": "unheaded-block",
        "anchor": "unheaded-block-176",
        "githubAnchor": "unheaded-block-176",
        "stableAnchor": "unheaded-block-176",
        "title": "Unheaded block 176",
        "startLine": 1886,
        "endLine": 1886,
        "textDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
        "sample": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.",
        "identityFingerprint": "296f985e5b54ee8a748bb127a90d0627b6a791eefd97e4cde988251e983780d6",
        "ancestry": [
          "Spec: Runner (vòng tự hành)",
          "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
          "0021 — Wire main-checkout lock hook qua fgos doctor/setup, không epoch-fence",
          "Hệ quả"
        ],
        "text": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ."
      },
      {
        "unitKind": "unheaded-block",
        "anchor": "unheaded-block-241",
        "githubAnchor": "unheaded-block-241",
        "stableAnchor": "unheaded-block-241",
        "title": "Unheaded block 241",
        "startLine": 2410,
        "endLine": 2410,
        "textDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
        "sample": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.",
        "identityFingerprint": "296f985e5b54ee8a748bb127a90d0627b6a791eefd97e4cde988251e983780d6",
        "ancestry": [
          "Spec: Runner (vòng tự hành)",
          "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
          "0028 — Đổi tên pinned term `orchestrator` thành `launcher`",
          "Hệ quả"
        ],
        "text": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ."
      },
      {
        "unitKind": "unheaded-block",
        "anchor": "unheaded-block-250",
        "githubAnchor": "unheaded-block-250",
        "stableAnchor": "unheaded-block-250",
        "title": "Unheaded block 250",
        "startLine": 2499,
        "endLine": 2499,
        "textDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
        "sample": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.",
        "identityFingerprint": "296f985e5b54ee8a748bb127a90d0627b6a791eefd97e4cde988251e983780d6",
        "ancestry": [
          "Spec: Runner (vòng tự hành)",
          "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
          "0029 — Sửa ba mệnh đề từ vựng dispatch của `0026`: bỏ `rootTask`/`subTask`, `capacity` là năng lực có tên, T1 hai giá trị",
          "Hệ quả"
        ],
        "text": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ."
      },
      {
        "unitKind": "unheaded-block",
        "anchor": "unheaded-block-274",
        "githubAnchor": "unheaded-block-274",
        "stableAnchor": "unheaded-block-274",
        "title": "Unheaded block 274",
        "startLine": 2680,
        "endLine": 2680,
        "textDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
        "sample": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.",
        "identityFingerprint": "296f985e5b54ee8a748bb127a90d0627b6a791eefd97e4cde988251e983780d6",
        "ancestry": [
          "Spec: Runner (vòng tự hành)",
          "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
          "0031 — Bỏ guard cấm từ `orchestrator` sau khi `0029` đã gán nghĩa mới",
          "Hệ quả"
        ],
        "text": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ."
      },
      {
        "unitKind": "unheaded-block",
        "anchor": "unheaded-block-286",
        "githubAnchor": "unheaded-block-286",
        "stableAnchor": "unheaded-block-286",
        "title": "Unheaded block 286",
        "startLine": 2792,
        "endLine": 2792,
        "textDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
        "sample": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.",
        "identityFingerprint": "296f985e5b54ee8a748bb127a90d0627b6a791eefd97e4cde988251e983780d6",
        "ancestry": [
          "Spec: Runner (vòng tự hành)",
          "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
          "0032 — Cổng Iron Law chỉ hỏi ở ranh giới trunk, thêm mức `warn`, agent gõ lệnh thay người",
          "Hệ quả"
        ],
        "text": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ."
      }
    ],
    "currentText": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.",
    "allPriorMatchingTextsEqualCurrent": true,
    "helperReplayed": true
  },
  "reviewScope": "Re-anchor receipt; claim verdict belongs to decisions section.",
  "packagedBy": "codex-session:unit-run-1792094246578-b2fbe39b@2026-10-16",
  "currentContentCommit": "345f15d95663260976200be66d1b9a6c648bcd6d",
  "entryId": "anchors-013"
}
```

## Entry anchors-014

```json
{
  "kind": "content-reanchoring-proof",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-boundary-gaps.json",
  "collection": "registryGaps",
  "before": {
    "claimId": "claim_50dca4885019ac5125d941ea5a86f448",
    "sourcePath": "docs/specs/runner.md",
    "sourceUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "disposition": "supersede",
    "targetOwner": "docs/specs/runner.md",
    "targetAnchor": "unheaded-block-153",
    "targetUnitDigest": "e42d5e19a449f4279faa1d1d32033bafdc01e1a595a641547d91962bc24ba63d",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewStatus": "pending",
    "rationale": "A31 main-only source change: this native old identity gap has the shown same-file successor from the upstream diff. This is conservation accounting, not a plan move or truth approval. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
    "targetAncestry": [
      "Spec: Runner (vòng tự hành)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0008 — Routing theo audience của từng interface",
      "Quyết định"
    ],
    "reviewNote": "Independent review pending at corrected current binding; no approval carried."
  },
  "after": {
    "claimId": "claim_50dca4885019ac5125d941ea5a86f448",
    "sourcePath": "docs/specs/runner.md",
    "sourceUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "disposition": "supersede",
    "targetOwner": "docs/specs/runner.md",
    "targetAnchor": "unheaded-block-155",
    "targetUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewStatus": "pending",
    "rationale": "A31 main-only source change: this native old identity gap has the shown same-file successor from the upstream diff. This is conservation accounting, not a plan move or truth approval. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. L10-21: content-based rebind from reviewed prior target unheaded-block-153 (95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104) to unheaded-block-155 (95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104); inserted paragraphs shift the anchor, prior target text is unchanged.",
    "targetAncestry": [
      "Spec: Runner (vòng tự hành)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0008 — Routing theo audience của từng interface",
      "Hệ quả"
    ]
  },
  "prior": {
    "claimId": "claim_50dca4885019ac5125d941ea5a86f448",
    "sourcePath": "docs/specs/runner.md",
    "sourceUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "disposition": "supersede",
    "targetOwner": "docs/specs/runner.md",
    "targetAnchor": "unheaded-block-153",
    "targetUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "authoredBy": "codex-session:5@2026-10-13",
    "reviewStatus": "reviewed",
    "rationale": "A31 main-only source change: this native old identity gap has the shown same-file successor from the upstream diff. This is conservation accounting, not a plan move or truth approval.",
    "targetAncestry": [
      "Spec: Runner (vòng tự hành)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0008 — Routing theo audience của từng interface",
      "Hệ quả"
    ],
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-13",
    "reviewedAt": "2026-10-13",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-3-boundary-gaps.md",
    "reviewReportCommit": "168a27c6c704854b4777792e6632302f1616c65a",
    "reviewMode": "ordinary",
    "reviewNote": "ok. Identical boilerplate line; anchor 149 to 153, line 1636 to 1653 (+17); occurrence 2 of 19 in both versions. No text change."
  },
  "targetWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-155",
    "githubAnchor": "unheaded-block-155",
    "stableAnchor": "unheaded-block-155",
    "title": "Unheaded block 155",
    "startLine": 1693,
    "endLine": 1693,
    "textDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "sample": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.",
    "identityFingerprint": "296f985e5b54ee8a748bb127a90d0627b6a791eefd97e4cde988251e983780d6",
    "ancestry": [
      "Spec: Runner (vòng tự hành)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0008 — Routing theo audience của từng interface",
      "Hệ quả"
    ],
    "text": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ."
  },
  "relatedClaimId": "claim_50dca4885019ac5125d941ea5a86f448",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_50dca4885019ac5125d941ea5a86f448",
    "sourcePath": "docs/specs/runner.md",
    "sourceUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "disposition": "supersede",
    "targetOwner": "docs/specs/runner.md",
    "targetAnchor": "unheaded-block-155",
    "targetUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewStatus": "pending",
    "rationale": "A31 main-only source change: this native old identity gap has the shown same-file successor from the upstream diff. This is conservation accounting, not a plan move or truth approval. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. L10-21: content-based rebind from reviewed prior target unheaded-block-153 (95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104) to unheaded-block-155 (95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104); inserted paragraphs shift the anchor, prior target text is unchanged.",
    "targetAncestry": [
      "Spec: Runner (vòng tự hành)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0008 — Routing theo audience của từng interface",
      "Hệ quả"
    ]
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-155",
    "githubAnchor": "unheaded-block-155",
    "stableAnchor": "unheaded-block-155",
    "title": "Unheaded block 155",
    "startLine": 1693,
    "endLine": 1693,
    "textDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "sample": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.",
    "identityFingerprint": "296f985e5b54ee8a748bb127a90d0627b6a791eefd97e4cde988251e983780d6",
    "ancestry": [
      "Spec: Runner (vòng tự hành)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0008 — Routing theo audience của từng interface",
      "Hệ quả"
    ],
    "text": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ."
  },
  "oldAnchor": "unheaded-block-153",
  "newAnchor": "unheaded-block-155",
  "oldDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
  "newDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
  "deepRequired": true,
  "helper": "scripts/doc-binding-repair.mjs",
  "contentProof": {
    "priorCommit": "ab4d6274a",
    "priorMatchingUnits": [
      {
        "unitKind": "unheaded-block",
        "anchor": "unheaded-block-150",
        "githubAnchor": "unheaded-block-150",
        "stableAnchor": "unheaded-block-150",
        "title": "Unheaded block 150",
        "startLine": 1665,
        "endLine": 1665,
        "textDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
        "sample": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.",
        "identityFingerprint": "296f985e5b54ee8a748bb127a90d0627b6a791eefd97e4cde988251e983780d6",
        "ancestry": [
          "Spec: Runner (vòng tự hành)",
          "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
          "0005 — Runner & cô lập worker",
          "Hệ quả"
        ],
        "text": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ."
      },
      {
        "unitKind": "unheaded-block",
        "anchor": "unheaded-block-155",
        "githubAnchor": "unheaded-block-155",
        "stableAnchor": "unheaded-block-155",
        "title": "Unheaded block 155",
        "startLine": 1693,
        "endLine": 1693,
        "textDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
        "sample": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.",
        "identityFingerprint": "296f985e5b54ee8a748bb127a90d0627b6a791eefd97e4cde988251e983780d6",
        "ancestry": [
          "Spec: Runner (vòng tự hành)",
          "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
          "0008 — Routing theo audience của từng interface",
          "Hệ quả"
        ],
        "text": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ."
      },
      {
        "unitKind": "unheaded-block",
        "anchor": "unheaded-block-167",
        "githubAnchor": "unheaded-block-167",
        "stableAnchor": "unheaded-block-167",
        "title": "Unheaded block 167",
        "startLine": 1802,
        "endLine": 1802,
        "textDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
        "sample": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.",
        "identityFingerprint": "296f985e5b54ee8a748bb127a90d0627b6a791eefd97e4cde988251e983780d6",
        "ancestry": [
          "Spec: Runner (vòng tự hành)",
          "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
          "0020 — Chặn `.fgos/` khỏi worktree worker (không khóa, không cô lập)",
          "Hệ quả"
        ],
        "text": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ."
      },
      {
        "unitKind": "unheaded-block",
        "anchor": "unheaded-block-176",
        "githubAnchor": "unheaded-block-176",
        "stableAnchor": "unheaded-block-176",
        "title": "Unheaded block 176",
        "startLine": 1886,
        "endLine": 1886,
        "textDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
        "sample": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.",
        "identityFingerprint": "296f985e5b54ee8a748bb127a90d0627b6a791eefd97e4cde988251e983780d6",
        "ancestry": [
          "Spec: Runner (vòng tự hành)",
          "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
          "0021 — Wire main-checkout lock hook qua fgos doctor/setup, không epoch-fence",
          "Hệ quả"
        ],
        "text": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ."
      },
      {
        "unitKind": "unheaded-block",
        "anchor": "unheaded-block-241",
        "githubAnchor": "unheaded-block-241",
        "stableAnchor": "unheaded-block-241",
        "title": "Unheaded block 241",
        "startLine": 2410,
        "endLine": 2410,
        "textDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
        "sample": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.",
        "identityFingerprint": "296f985e5b54ee8a748bb127a90d0627b6a791eefd97e4cde988251e983780d6",
        "ancestry": [
          "Spec: Runner (vòng tự hành)",
          "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
          "0028 — Đổi tên pinned term `orchestrator` thành `launcher`",
          "Hệ quả"
        ],
        "text": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ."
      },
      {
        "unitKind": "unheaded-block",
        "anchor": "unheaded-block-250",
        "githubAnchor": "unheaded-block-250",
        "stableAnchor": "unheaded-block-250",
        "title": "Unheaded block 250",
        "startLine": 2499,
        "endLine": 2499,
        "textDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
        "sample": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.",
        "identityFingerprint": "296f985e5b54ee8a748bb127a90d0627b6a791eefd97e4cde988251e983780d6",
        "ancestry": [
          "Spec: Runner (vòng tự hành)",
          "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
          "0029 — Sửa ba mệnh đề từ vựng dispatch của `0026`: bỏ `rootTask`/`subTask`, `capacity` là năng lực có tên, T1 hai giá trị",
          "Hệ quả"
        ],
        "text": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ."
      },
      {
        "unitKind": "unheaded-block",
        "anchor": "unheaded-block-274",
        "githubAnchor": "unheaded-block-274",
        "stableAnchor": "unheaded-block-274",
        "title": "Unheaded block 274",
        "startLine": 2680,
        "endLine": 2680,
        "textDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
        "sample": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.",
        "identityFingerprint": "296f985e5b54ee8a748bb127a90d0627b6a791eefd97e4cde988251e983780d6",
        "ancestry": [
          "Spec: Runner (vòng tự hành)",
          "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
          "0031 — Bỏ guard cấm từ `orchestrator` sau khi `0029` đã gán nghĩa mới",
          "Hệ quả"
        ],
        "text": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ."
      },
      {
        "unitKind": "unheaded-block",
        "anchor": "unheaded-block-286",
        "githubAnchor": "unheaded-block-286",
        "stableAnchor": "unheaded-block-286",
        "title": "Unheaded block 286",
        "startLine": 2792,
        "endLine": 2792,
        "textDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
        "sample": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.",
        "identityFingerprint": "296f985e5b54ee8a748bb127a90d0627b6a791eefd97e4cde988251e983780d6",
        "ancestry": [
          "Spec: Runner (vòng tự hành)",
          "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
          "0032 — Cổng Iron Law chỉ hỏi ở ranh giới trunk, thêm mức `warn`, agent gõ lệnh thay người",
          "Hệ quả"
        ],
        "text": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ."
      }
    ],
    "currentText": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.",
    "allPriorMatchingTextsEqualCurrent": true,
    "helperReplayed": true
  },
  "reviewScope": "Re-anchor receipt; claim verdict belongs to decisions section.",
  "packagedBy": "codex-session:unit-run-1792094246578-b2fbe39b@2026-10-16",
  "currentContentCommit": "345f15d95663260976200be66d1b9a6c648bcd6d",
  "entryId": "anchors-014"
}
```

## Entry anchors-015

```json
{
  "kind": "content-reanchoring-proof",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-boundary-gaps.json",
  "collection": "registryGaps",
  "before": {
    "claimId": "claim_07ae72c4d2c93884a120cf2ca12250a8",
    "sourcePath": "docs/specs/runner.md",
    "sourceUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "disposition": "supersede",
    "targetOwner": "docs/specs/runner.md",
    "targetAnchor": "unheaded-block-165",
    "targetUnitDigest": "a864acacd269750cf31c62618e5f4d294754bc7393bdb5dd130eec00cf278527",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewStatus": "pending",
    "rationale": "A31 main-only source change: this native old identity gap has the shown same-file successor from the upstream diff. This is conservation accounting, not a plan move or truth approval. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
    "targetAncestry": [
      "Spec: Runner (vòng tự hành)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0020 — Chặn `.fgos/` khỏi worktree worker (không khóa, không cô lập)",
      "Quyết định",
      "Vì sao chặn-cây"
    ],
    "reviewNote": "Independent review pending at corrected current binding; no approval carried."
  },
  "after": {
    "claimId": "claim_07ae72c4d2c93884a120cf2ca12250a8",
    "sourcePath": "docs/specs/runner.md",
    "sourceUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "disposition": "supersede",
    "targetOwner": "docs/specs/runner.md",
    "targetAnchor": "unheaded-block-167",
    "targetUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewStatus": "pending",
    "rationale": "A31 main-only source change: this native old identity gap has the shown same-file successor from the upstream diff. This is conservation accounting, not a plan move or truth approval. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. L10-21: content-based rebind from reviewed prior target unheaded-block-165 (95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104) to unheaded-block-167 (95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104); inserted paragraphs shift the anchor, prior target text is unchanged.",
    "targetAncestry": [
      "Spec: Runner (vòng tự hành)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0020 — Chặn `.fgos/` khỏi worktree worker (không khóa, không cô lập)",
      "Hệ quả"
    ]
  },
  "prior": {
    "claimId": "claim_07ae72c4d2c93884a120cf2ca12250a8",
    "sourcePath": "docs/specs/runner.md",
    "sourceUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "disposition": "supersede",
    "targetOwner": "docs/specs/runner.md",
    "targetAnchor": "unheaded-block-165",
    "targetUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "authoredBy": "codex-session:5@2026-10-13",
    "reviewStatus": "reviewed",
    "rationale": "A31 main-only source change: this native old identity gap has the shown same-file successor from the upstream diff. This is conservation accounting, not a plan move or truth approval.",
    "targetAncestry": [
      "Spec: Runner (vòng tự hành)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0020 — Chặn `.fgos/` khỏi worktree worker (không khóa, không cô lập)",
      "Hệ quả"
    ],
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-13",
    "reviewedAt": "2026-10-13",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-3-boundary-gaps.md",
    "reviewReportCommit": "168a27c6c704854b4777792e6632302f1616c65a",
    "reviewMode": "ordinary",
    "reviewNote": "ok. Identical boilerplate line; anchor 161 to 165, line 1745 to 1762 (+17); occurrence 3 of 19 in both versions. No text change."
  },
  "targetWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-167",
    "githubAnchor": "unheaded-block-167",
    "stableAnchor": "unheaded-block-167",
    "title": "Unheaded block 167",
    "startLine": 1802,
    "endLine": 1802,
    "textDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "sample": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.",
    "identityFingerprint": "296f985e5b54ee8a748bb127a90d0627b6a791eefd97e4cde988251e983780d6",
    "ancestry": [
      "Spec: Runner (vòng tự hành)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0020 — Chặn `.fgos/` khỏi worktree worker (không khóa, không cô lập)",
      "Hệ quả"
    ],
    "text": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ."
  },
  "relatedClaimId": "claim_07ae72c4d2c93884a120cf2ca12250a8",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_07ae72c4d2c93884a120cf2ca12250a8",
    "sourcePath": "docs/specs/runner.md",
    "sourceUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "disposition": "supersede",
    "targetOwner": "docs/specs/runner.md",
    "targetAnchor": "unheaded-block-167",
    "targetUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewStatus": "pending",
    "rationale": "A31 main-only source change: this native old identity gap has the shown same-file successor from the upstream diff. This is conservation accounting, not a plan move or truth approval. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. L10-21: content-based rebind from reviewed prior target unheaded-block-165 (95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104) to unheaded-block-167 (95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104); inserted paragraphs shift the anchor, prior target text is unchanged.",
    "targetAncestry": [
      "Spec: Runner (vòng tự hành)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0020 — Chặn `.fgos/` khỏi worktree worker (không khóa, không cô lập)",
      "Hệ quả"
    ]
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-167",
    "githubAnchor": "unheaded-block-167",
    "stableAnchor": "unheaded-block-167",
    "title": "Unheaded block 167",
    "startLine": 1802,
    "endLine": 1802,
    "textDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "sample": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.",
    "identityFingerprint": "296f985e5b54ee8a748bb127a90d0627b6a791eefd97e4cde988251e983780d6",
    "ancestry": [
      "Spec: Runner (vòng tự hành)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0020 — Chặn `.fgos/` khỏi worktree worker (không khóa, không cô lập)",
      "Hệ quả"
    ],
    "text": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ."
  },
  "oldAnchor": "unheaded-block-165",
  "newAnchor": "unheaded-block-167",
  "oldDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
  "newDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
  "deepRequired": true,
  "helper": "scripts/doc-binding-repair.mjs",
  "contentProof": {
    "priorCommit": "ab4d6274a",
    "priorMatchingUnits": [
      {
        "unitKind": "unheaded-block",
        "anchor": "unheaded-block-150",
        "githubAnchor": "unheaded-block-150",
        "stableAnchor": "unheaded-block-150",
        "title": "Unheaded block 150",
        "startLine": 1665,
        "endLine": 1665,
        "textDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
        "sample": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.",
        "identityFingerprint": "296f985e5b54ee8a748bb127a90d0627b6a791eefd97e4cde988251e983780d6",
        "ancestry": [
          "Spec: Runner (vòng tự hành)",
          "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
          "0005 — Runner & cô lập worker",
          "Hệ quả"
        ],
        "text": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ."
      },
      {
        "unitKind": "unheaded-block",
        "anchor": "unheaded-block-155",
        "githubAnchor": "unheaded-block-155",
        "stableAnchor": "unheaded-block-155",
        "title": "Unheaded block 155",
        "startLine": 1693,
        "endLine": 1693,
        "textDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
        "sample": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.",
        "identityFingerprint": "296f985e5b54ee8a748bb127a90d0627b6a791eefd97e4cde988251e983780d6",
        "ancestry": [
          "Spec: Runner (vòng tự hành)",
          "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
          "0008 — Routing theo audience của từng interface",
          "Hệ quả"
        ],
        "text": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ."
      },
      {
        "unitKind": "unheaded-block",
        "anchor": "unheaded-block-167",
        "githubAnchor": "unheaded-block-167",
        "stableAnchor": "unheaded-block-167",
        "title": "Unheaded block 167",
        "startLine": 1802,
        "endLine": 1802,
        "textDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
        "sample": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.",
        "identityFingerprint": "296f985e5b54ee8a748bb127a90d0627b6a791eefd97e4cde988251e983780d6",
        "ancestry": [
          "Spec: Runner (vòng tự hành)",
          "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
          "0020 — Chặn `.fgos/` khỏi worktree worker (không khóa, không cô lập)",
          "Hệ quả"
        ],
        "text": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ."
      },
      {
        "unitKind": "unheaded-block",
        "anchor": "unheaded-block-176",
        "githubAnchor": "unheaded-block-176",
        "stableAnchor": "unheaded-block-176",
        "title": "Unheaded block 176",
        "startLine": 1886,
        "endLine": 1886,
        "textDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
        "sample": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.",
        "identityFingerprint": "296f985e5b54ee8a748bb127a90d0627b6a791eefd97e4cde988251e983780d6",
        "ancestry": [
          "Spec: Runner (vòng tự hành)",
          "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
          "0021 — Wire main-checkout lock hook qua fgos doctor/setup, không epoch-fence",
          "Hệ quả"
        ],
        "text": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ."
      },
      {
        "unitKind": "unheaded-block",
        "anchor": "unheaded-block-241",
        "githubAnchor": "unheaded-block-241",
        "stableAnchor": "unheaded-block-241",
        "title": "Unheaded block 241",
        "startLine": 2410,
        "endLine": 2410,
        "textDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
        "sample": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.",
        "identityFingerprint": "296f985e5b54ee8a748bb127a90d0627b6a791eefd97e4cde988251e983780d6",
        "ancestry": [
          "Spec: Runner (vòng tự hành)",
          "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
          "0028 — Đổi tên pinned term `orchestrator` thành `launcher`",
          "Hệ quả"
        ],
        "text": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ."
      },
      {
        "unitKind": "unheaded-block",
        "anchor": "unheaded-block-250",
        "githubAnchor": "unheaded-block-250",
        "stableAnchor": "unheaded-block-250",
        "title": "Unheaded block 250",
        "startLine": 2499,
        "endLine": 2499,
        "textDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
        "sample": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.",
        "identityFingerprint": "296f985e5b54ee8a748bb127a90d0627b6a791eefd97e4cde988251e983780d6",
        "ancestry": [
          "Spec: Runner (vòng tự hành)",
          "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
          "0029 — Sửa ba mệnh đề từ vựng dispatch của `0026`: bỏ `rootTask`/`subTask`, `capacity` là năng lực có tên, T1 hai giá trị",
          "Hệ quả"
        ],
        "text": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ."
      },
      {
        "unitKind": "unheaded-block",
        "anchor": "unheaded-block-274",
        "githubAnchor": "unheaded-block-274",
        "stableAnchor": "unheaded-block-274",
        "title": "Unheaded block 274",
        "startLine": 2680,
        "endLine": 2680,
        "textDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
        "sample": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.",
        "identityFingerprint": "296f985e5b54ee8a748bb127a90d0627b6a791eefd97e4cde988251e983780d6",
        "ancestry": [
          "Spec: Runner (vòng tự hành)",
          "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
          "0031 — Bỏ guard cấm từ `orchestrator` sau khi `0029` đã gán nghĩa mới",
          "Hệ quả"
        ],
        "text": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ."
      },
      {
        "unitKind": "unheaded-block",
        "anchor": "unheaded-block-286",
        "githubAnchor": "unheaded-block-286",
        "stableAnchor": "unheaded-block-286",
        "title": "Unheaded block 286",
        "startLine": 2792,
        "endLine": 2792,
        "textDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
        "sample": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.",
        "identityFingerprint": "296f985e5b54ee8a748bb127a90d0627b6a791eefd97e4cde988251e983780d6",
        "ancestry": [
          "Spec: Runner (vòng tự hành)",
          "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
          "0032 — Cổng Iron Law chỉ hỏi ở ranh giới trunk, thêm mức `warn`, agent gõ lệnh thay người",
          "Hệ quả"
        ],
        "text": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ."
      }
    ],
    "currentText": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.",
    "allPriorMatchingTextsEqualCurrent": true,
    "helperReplayed": true
  },
  "reviewScope": "Re-anchor receipt; claim verdict belongs to decisions section.",
  "packagedBy": "codex-session:unit-run-1792094246578-b2fbe39b@2026-10-16",
  "currentContentCommit": "345f15d95663260976200be66d1b9a6c648bcd6d",
  "entryId": "anchors-015"
}
```

## Entry anchors-016

```json
{
  "kind": "content-reanchoring-proof",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-boundary-gaps.json",
  "collection": "registryGaps",
  "before": {
    "claimId": "claim_211f0b98400863f2a0e9b9cdaa2259fe",
    "sourcePath": "docs/specs/runner.md",
    "sourceUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "disposition": "supersede",
    "targetOwner": "docs/specs/runner.md",
    "targetAnchor": "unheaded-block-174",
    "targetUnitDigest": "439edeebfe8f7843e4e29586c6fe3f3d0ab942285ef564447c8ab1de76a130d3",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewStatus": "pending",
    "rationale": "A31 main-only source change: this native old identity gap has the shown same-file successor from the upstream diff. This is conservation accounting, not a plan move or truth approval. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
    "targetAncestry": [
      "Spec: Runner (vòng tự hành)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0021 — Wire main-checkout lock hook qua fgos doctor/setup, không epoch-fence",
      "Quyết định",
      "Vì sao không epoch-fence-merge-gate"
    ],
    "reviewNote": "Independent review pending at corrected current binding; no approval carried."
  },
  "after": {
    "claimId": "claim_211f0b98400863f2a0e9b9cdaa2259fe",
    "sourcePath": "docs/specs/runner.md",
    "sourceUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "disposition": "supersede",
    "targetOwner": "docs/specs/runner.md",
    "targetAnchor": "unheaded-block-176",
    "targetUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewStatus": "pending",
    "rationale": "A31 main-only source change: this native old identity gap has the shown same-file successor from the upstream diff. This is conservation accounting, not a plan move or truth approval. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. L10-21: content-based rebind from reviewed prior target unheaded-block-174 (95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104) to unheaded-block-176 (95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104); inserted paragraphs shift the anchor, prior target text is unchanged.",
    "targetAncestry": [
      "Spec: Runner (vòng tự hành)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0021 — Wire main-checkout lock hook qua fgos doctor/setup, không epoch-fence",
      "Hệ quả"
    ]
  },
  "prior": {
    "claimId": "claim_211f0b98400863f2a0e9b9cdaa2259fe",
    "sourcePath": "docs/specs/runner.md",
    "sourceUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "disposition": "supersede",
    "targetOwner": "docs/specs/runner.md",
    "targetAnchor": "unheaded-block-174",
    "targetUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "authoredBy": "codex-session:5@2026-10-13",
    "reviewStatus": "reviewed",
    "rationale": "A31 main-only source change: this native old identity gap has the shown same-file successor from the upstream diff. This is conservation accounting, not a plan move or truth approval.",
    "targetAncestry": [
      "Spec: Runner (vòng tự hành)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0021 — Wire main-checkout lock hook qua fgos doctor/setup, không epoch-fence",
      "Hệ quả"
    ],
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-13",
    "reviewedAt": "2026-10-13",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-3-boundary-gaps.md",
    "reviewReportCommit": "168a27c6c704854b4777792e6632302f1616c65a",
    "reviewMode": "ordinary",
    "reviewNote": "ok. Identical boilerplate line; anchor 170 to 174, line 1829 to 1846 (+17); occurrence 4 of 19 in both versions. No text change."
  },
  "targetWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-176",
    "githubAnchor": "unheaded-block-176",
    "stableAnchor": "unheaded-block-176",
    "title": "Unheaded block 176",
    "startLine": 1886,
    "endLine": 1886,
    "textDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "sample": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.",
    "identityFingerprint": "296f985e5b54ee8a748bb127a90d0627b6a791eefd97e4cde988251e983780d6",
    "ancestry": [
      "Spec: Runner (vòng tự hành)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0021 — Wire main-checkout lock hook qua fgos doctor/setup, không epoch-fence",
      "Hệ quả"
    ],
    "text": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ."
  },
  "relatedClaimId": "claim_211f0b98400863f2a0e9b9cdaa2259fe",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_211f0b98400863f2a0e9b9cdaa2259fe",
    "sourcePath": "docs/specs/runner.md",
    "sourceUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "disposition": "supersede",
    "targetOwner": "docs/specs/runner.md",
    "targetAnchor": "unheaded-block-176",
    "targetUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewStatus": "pending",
    "rationale": "A31 main-only source change: this native old identity gap has the shown same-file successor from the upstream diff. This is conservation accounting, not a plan move or truth approval. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. L10-21: content-based rebind from reviewed prior target unheaded-block-174 (95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104) to unheaded-block-176 (95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104); inserted paragraphs shift the anchor, prior target text is unchanged.",
    "targetAncestry": [
      "Spec: Runner (vòng tự hành)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0021 — Wire main-checkout lock hook qua fgos doctor/setup, không epoch-fence",
      "Hệ quả"
    ]
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-176",
    "githubAnchor": "unheaded-block-176",
    "stableAnchor": "unheaded-block-176",
    "title": "Unheaded block 176",
    "startLine": 1886,
    "endLine": 1886,
    "textDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "sample": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.",
    "identityFingerprint": "296f985e5b54ee8a748bb127a90d0627b6a791eefd97e4cde988251e983780d6",
    "ancestry": [
      "Spec: Runner (vòng tự hành)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0021 — Wire main-checkout lock hook qua fgos doctor/setup, không epoch-fence",
      "Hệ quả"
    ],
    "text": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ."
  },
  "oldAnchor": "unheaded-block-174",
  "newAnchor": "unheaded-block-176",
  "oldDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
  "newDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
  "deepRequired": true,
  "helper": "scripts/doc-binding-repair.mjs",
  "contentProof": {
    "priorCommit": "ab4d6274a",
    "priorMatchingUnits": [
      {
        "unitKind": "unheaded-block",
        "anchor": "unheaded-block-150",
        "githubAnchor": "unheaded-block-150",
        "stableAnchor": "unheaded-block-150",
        "title": "Unheaded block 150",
        "startLine": 1665,
        "endLine": 1665,
        "textDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
        "sample": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.",
        "identityFingerprint": "296f985e5b54ee8a748bb127a90d0627b6a791eefd97e4cde988251e983780d6",
        "ancestry": [
          "Spec: Runner (vòng tự hành)",
          "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
          "0005 — Runner & cô lập worker",
          "Hệ quả"
        ],
        "text": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ."
      },
      {
        "unitKind": "unheaded-block",
        "anchor": "unheaded-block-155",
        "githubAnchor": "unheaded-block-155",
        "stableAnchor": "unheaded-block-155",
        "title": "Unheaded block 155",
        "startLine": 1693,
        "endLine": 1693,
        "textDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
        "sample": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.",
        "identityFingerprint": "296f985e5b54ee8a748bb127a90d0627b6a791eefd97e4cde988251e983780d6",
        "ancestry": [
          "Spec: Runner (vòng tự hành)",
          "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
          "0008 — Routing theo audience của từng interface",
          "Hệ quả"
        ],
        "text": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ."
      },
      {
        "unitKind": "unheaded-block",
        "anchor": "unheaded-block-167",
        "githubAnchor": "unheaded-block-167",
        "stableAnchor": "unheaded-block-167",
        "title": "Unheaded block 167",
        "startLine": 1802,
        "endLine": 1802,
        "textDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
        "sample": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.",
        "identityFingerprint": "296f985e5b54ee8a748bb127a90d0627b6a791eefd97e4cde988251e983780d6",
        "ancestry": [
          "Spec: Runner (vòng tự hành)",
          "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
          "0020 — Chặn `.fgos/` khỏi worktree worker (không khóa, không cô lập)",
          "Hệ quả"
        ],
        "text": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ."
      },
      {
        "unitKind": "unheaded-block",
        "anchor": "unheaded-block-176",
        "githubAnchor": "unheaded-block-176",
        "stableAnchor": "unheaded-block-176",
        "title": "Unheaded block 176",
        "startLine": 1886,
        "endLine": 1886,
        "textDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
        "sample": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.",
        "identityFingerprint": "296f985e5b54ee8a748bb127a90d0627b6a791eefd97e4cde988251e983780d6",
        "ancestry": [
          "Spec: Runner (vòng tự hành)",
          "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
          "0021 — Wire main-checkout lock hook qua fgos doctor/setup, không epoch-fence",
          "Hệ quả"
        ],
        "text": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ."
      },
      {
        "unitKind": "unheaded-block",
        "anchor": "unheaded-block-241",
        "githubAnchor": "unheaded-block-241",
        "stableAnchor": "unheaded-block-241",
        "title": "Unheaded block 241",
        "startLine": 2410,
        "endLine": 2410,
        "textDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
        "sample": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.",
        "identityFingerprint": "296f985e5b54ee8a748bb127a90d0627b6a791eefd97e4cde988251e983780d6",
        "ancestry": [
          "Spec: Runner (vòng tự hành)",
          "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
          "0028 — Đổi tên pinned term `orchestrator` thành `launcher`",
          "Hệ quả"
        ],
        "text": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ."
      },
      {
        "unitKind": "unheaded-block",
        "anchor": "unheaded-block-250",
        "githubAnchor": "unheaded-block-250",
        "stableAnchor": "unheaded-block-250",
        "title": "Unheaded block 250",
        "startLine": 2499,
        "endLine": 2499,
        "textDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
        "sample": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.",
        "identityFingerprint": "296f985e5b54ee8a748bb127a90d0627b6a791eefd97e4cde988251e983780d6",
        "ancestry": [
          "Spec: Runner (vòng tự hành)",
          "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
          "0029 — Sửa ba mệnh đề từ vựng dispatch của `0026`: bỏ `rootTask`/`subTask`, `capacity` là năng lực có tên, T1 hai giá trị",
          "Hệ quả"
        ],
        "text": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ."
      },
      {
        "unitKind": "unheaded-block",
        "anchor": "unheaded-block-274",
        "githubAnchor": "unheaded-block-274",
        "stableAnchor": "unheaded-block-274",
        "title": "Unheaded block 274",
        "startLine": 2680,
        "endLine": 2680,
        "textDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
        "sample": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.",
        "identityFingerprint": "296f985e5b54ee8a748bb127a90d0627b6a791eefd97e4cde988251e983780d6",
        "ancestry": [
          "Spec: Runner (vòng tự hành)",
          "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
          "0031 — Bỏ guard cấm từ `orchestrator` sau khi `0029` đã gán nghĩa mới",
          "Hệ quả"
        ],
        "text": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ."
      },
      {
        "unitKind": "unheaded-block",
        "anchor": "unheaded-block-286",
        "githubAnchor": "unheaded-block-286",
        "stableAnchor": "unheaded-block-286",
        "title": "Unheaded block 286",
        "startLine": 2792,
        "endLine": 2792,
        "textDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
        "sample": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.",
        "identityFingerprint": "296f985e5b54ee8a748bb127a90d0627b6a791eefd97e4cde988251e983780d6",
        "ancestry": [
          "Spec: Runner (vòng tự hành)",
          "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
          "0032 — Cổng Iron Law chỉ hỏi ở ranh giới trunk, thêm mức `warn`, agent gõ lệnh thay người",
          "Hệ quả"
        ],
        "text": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ."
      }
    ],
    "currentText": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.",
    "allPriorMatchingTextsEqualCurrent": true,
    "helperReplayed": true
  },
  "reviewScope": "Re-anchor receipt; claim verdict belongs to decisions section.",
  "packagedBy": "codex-session:unit-run-1792094246578-b2fbe39b@2026-10-16",
  "currentContentCommit": "345f15d95663260976200be66d1b9a6c648bcd6d",
  "entryId": "anchors-016"
}
```

## Entry anchors-017

```json
{
  "kind": "content-reanchoring-proof",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-boundary-gaps.json",
  "collection": "registryGaps",
  "before": {
    "claimId": "claim_1d8baa1def0cea7595b62de99846b489",
    "sourcePath": "docs/specs/runner.md",
    "sourceUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "disposition": "supersede",
    "targetOwner": "docs/specs/runner.md",
    "targetAnchor": "unheaded-block-239",
    "targetUnitDigest": "ba2849d909619a304171ccece011f39238a3516f95643631c023e0699eaef99f",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewStatus": "pending",
    "rationale": "A31 main-only source change: this native old identity gap has the shown same-file successor from the upstream diff. This is conservation accounting, not a plan move or truth approval. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
    "targetAncestry": [
      "Spec: Runner (vòng tự hành)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0028 — Đổi tên pinned term `orchestrator` thành `launcher`",
      "Quyết định"
    ],
    "reviewNote": "Independent review pending at corrected current binding; no approval carried."
  },
  "after": {
    "claimId": "claim_1d8baa1def0cea7595b62de99846b489",
    "sourcePath": "docs/specs/runner.md",
    "sourceUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "disposition": "supersede",
    "targetOwner": "docs/specs/runner.md",
    "targetAnchor": "unheaded-block-241",
    "targetUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewStatus": "pending",
    "rationale": "A31 main-only source change: this native old identity gap has the shown same-file successor from the upstream diff. This is conservation accounting, not a plan move or truth approval. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. L10-21: content-based rebind from reviewed prior target unheaded-block-239 (95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104) to unheaded-block-241 (95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104); inserted paragraphs shift the anchor, prior target text is unchanged.",
    "targetAncestry": [
      "Spec: Runner (vòng tự hành)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0028 — Đổi tên pinned term `orchestrator` thành `launcher`",
      "Hệ quả"
    ]
  },
  "prior": {
    "claimId": "claim_1d8baa1def0cea7595b62de99846b489",
    "sourcePath": "docs/specs/runner.md",
    "sourceUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "disposition": "supersede",
    "targetOwner": "docs/specs/runner.md",
    "targetAnchor": "unheaded-block-239",
    "targetUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "authoredBy": "codex-session:5@2026-10-13",
    "reviewStatus": "reviewed",
    "rationale": "A31 main-only source change: this native old identity gap has the shown same-file successor from the upstream diff. This is conservation accounting, not a plan move or truth approval.",
    "targetAncestry": [
      "Spec: Runner (vòng tự hành)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0028 — Đổi tên pinned term `orchestrator` thành `launcher`",
      "Hệ quả"
    ],
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-13",
    "reviewedAt": "2026-10-13",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-3-boundary-gaps.md",
    "reviewReportCommit": "168a27c6c704854b4777792e6632302f1616c65a",
    "reviewMode": "ordinary",
    "reviewNote": "ok. Identical boilerplate line; anchor 235 to 239, line 2353 to 2370 (+17); occurrence 5 of 19 in both versions. No text change."
  },
  "targetWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-241",
    "githubAnchor": "unheaded-block-241",
    "stableAnchor": "unheaded-block-241",
    "title": "Unheaded block 241",
    "startLine": 2410,
    "endLine": 2410,
    "textDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "sample": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.",
    "identityFingerprint": "296f985e5b54ee8a748bb127a90d0627b6a791eefd97e4cde988251e983780d6",
    "ancestry": [
      "Spec: Runner (vòng tự hành)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0028 — Đổi tên pinned term `orchestrator` thành `launcher`",
      "Hệ quả"
    ],
    "text": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ."
  },
  "relatedClaimId": "claim_1d8baa1def0cea7595b62de99846b489",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_1d8baa1def0cea7595b62de99846b489",
    "sourcePath": "docs/specs/runner.md",
    "sourceUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "disposition": "supersede",
    "targetOwner": "docs/specs/runner.md",
    "targetAnchor": "unheaded-block-241",
    "targetUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewStatus": "pending",
    "rationale": "A31 main-only source change: this native old identity gap has the shown same-file successor from the upstream diff. This is conservation accounting, not a plan move or truth approval. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. L10-21: content-based rebind from reviewed prior target unheaded-block-239 (95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104) to unheaded-block-241 (95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104); inserted paragraphs shift the anchor, prior target text is unchanged.",
    "targetAncestry": [
      "Spec: Runner (vòng tự hành)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0028 — Đổi tên pinned term `orchestrator` thành `launcher`",
      "Hệ quả"
    ]
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-241",
    "githubAnchor": "unheaded-block-241",
    "stableAnchor": "unheaded-block-241",
    "title": "Unheaded block 241",
    "startLine": 2410,
    "endLine": 2410,
    "textDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "sample": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.",
    "identityFingerprint": "296f985e5b54ee8a748bb127a90d0627b6a791eefd97e4cde988251e983780d6",
    "ancestry": [
      "Spec: Runner (vòng tự hành)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0028 — Đổi tên pinned term `orchestrator` thành `launcher`",
      "Hệ quả"
    ],
    "text": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ."
  },
  "oldAnchor": "unheaded-block-239",
  "newAnchor": "unheaded-block-241",
  "oldDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
  "newDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
  "deepRequired": true,
  "helper": "scripts/doc-binding-repair.mjs",
  "contentProof": {
    "priorCommit": "ab4d6274a",
    "priorMatchingUnits": [
      {
        "unitKind": "unheaded-block",
        "anchor": "unheaded-block-150",
        "githubAnchor": "unheaded-block-150",
        "stableAnchor": "unheaded-block-150",
        "title": "Unheaded block 150",
        "startLine": 1665,
        "endLine": 1665,
        "textDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
        "sample": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.",
        "identityFingerprint": "296f985e5b54ee8a748bb127a90d0627b6a791eefd97e4cde988251e983780d6",
        "ancestry": [
          "Spec: Runner (vòng tự hành)",
          "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
          "0005 — Runner & cô lập worker",
          "Hệ quả"
        ],
        "text": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ."
      },
      {
        "unitKind": "unheaded-block",
        "anchor": "unheaded-block-155",
        "githubAnchor": "unheaded-block-155",
        "stableAnchor": "unheaded-block-155",
        "title": "Unheaded block 155",
        "startLine": 1693,
        "endLine": 1693,
        "textDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
        "sample": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.",
        "identityFingerprint": "296f985e5b54ee8a748bb127a90d0627b6a791eefd97e4cde988251e983780d6",
        "ancestry": [
          "Spec: Runner (vòng tự hành)",
          "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
          "0008 — Routing theo audience của từng interface",
          "Hệ quả"
        ],
        "text": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ."
      },
      {
        "unitKind": "unheaded-block",
        "anchor": "unheaded-block-167",
        "githubAnchor": "unheaded-block-167",
        "stableAnchor": "unheaded-block-167",
        "title": "Unheaded block 167",
        "startLine": 1802,
        "endLine": 1802,
        "textDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
        "sample": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.",
        "identityFingerprint": "296f985e5b54ee8a748bb127a90d0627b6a791eefd97e4cde988251e983780d6",
        "ancestry": [
          "Spec: Runner (vòng tự hành)",
          "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
          "0020 — Chặn `.fgos/` khỏi worktree worker (không khóa, không cô lập)",
          "Hệ quả"
        ],
        "text": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ."
      },
      {
        "unitKind": "unheaded-block",
        "anchor": "unheaded-block-176",
        "githubAnchor": "unheaded-block-176",
        "stableAnchor": "unheaded-block-176",
        "title": "Unheaded block 176",
        "startLine": 1886,
        "endLine": 1886,
        "textDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
        "sample": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.",
        "identityFingerprint": "296f985e5b54ee8a748bb127a90d0627b6a791eefd97e4cde988251e983780d6",
        "ancestry": [
          "Spec: Runner (vòng tự hành)",
          "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
          "0021 — Wire main-checkout lock hook qua fgos doctor/setup, không epoch-fence",
          "Hệ quả"
        ],
        "text": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ."
      },
      {
        "unitKind": "unheaded-block",
        "anchor": "unheaded-block-241",
        "githubAnchor": "unheaded-block-241",
        "stableAnchor": "unheaded-block-241",
        "title": "Unheaded block 241",
        "startLine": 2410,
        "endLine": 2410,
        "textDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
        "sample": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.",
        "identityFingerprint": "296f985e5b54ee8a748bb127a90d0627b6a791eefd97e4cde988251e983780d6",
        "ancestry": [
          "Spec: Runner (vòng tự hành)",
          "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
          "0028 — Đổi tên pinned term `orchestrator` thành `launcher`",
          "Hệ quả"
        ],
        "text": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ."
      },
      {
        "unitKind": "unheaded-block",
        "anchor": "unheaded-block-250",
        "githubAnchor": "unheaded-block-250",
        "stableAnchor": "unheaded-block-250",
        "title": "Unheaded block 250",
        "startLine": 2499,
        "endLine": 2499,
        "textDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
        "sample": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.",
        "identityFingerprint": "296f985e5b54ee8a748bb127a90d0627b6a791eefd97e4cde988251e983780d6",
        "ancestry": [
          "Spec: Runner (vòng tự hành)",
          "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
          "0029 — Sửa ba mệnh đề từ vựng dispatch của `0026`: bỏ `rootTask`/`subTask`, `capacity` là năng lực có tên, T1 hai giá trị",
          "Hệ quả"
        ],
        "text": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ."
      },
      {
        "unitKind": "unheaded-block",
        "anchor": "unheaded-block-274",
        "githubAnchor": "unheaded-block-274",
        "stableAnchor": "unheaded-block-274",
        "title": "Unheaded block 274",
        "startLine": 2680,
        "endLine": 2680,
        "textDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
        "sample": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.",
        "identityFingerprint": "296f985e5b54ee8a748bb127a90d0627b6a791eefd97e4cde988251e983780d6",
        "ancestry": [
          "Spec: Runner (vòng tự hành)",
          "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
          "0031 — Bỏ guard cấm từ `orchestrator` sau khi `0029` đã gán nghĩa mới",
          "Hệ quả"
        ],
        "text": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ."
      },
      {
        "unitKind": "unheaded-block",
        "anchor": "unheaded-block-286",
        "githubAnchor": "unheaded-block-286",
        "stableAnchor": "unheaded-block-286",
        "title": "Unheaded block 286",
        "startLine": 2792,
        "endLine": 2792,
        "textDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
        "sample": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.",
        "identityFingerprint": "296f985e5b54ee8a748bb127a90d0627b6a791eefd97e4cde988251e983780d6",
        "ancestry": [
          "Spec: Runner (vòng tự hành)",
          "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
          "0032 — Cổng Iron Law chỉ hỏi ở ranh giới trunk, thêm mức `warn`, agent gõ lệnh thay người",
          "Hệ quả"
        ],
        "text": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ."
      }
    ],
    "currentText": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.",
    "allPriorMatchingTextsEqualCurrent": true,
    "helperReplayed": true
  },
  "reviewScope": "Re-anchor receipt; claim verdict belongs to decisions section.",
  "packagedBy": "codex-session:unit-run-1792094246578-b2fbe39b@2026-10-16",
  "currentContentCommit": "345f15d95663260976200be66d1b9a6c648bcd6d",
  "entryId": "anchors-017"
}
```

## Entry anchors-018

```json
{
  "kind": "content-reanchoring-proof",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-boundary-gaps.json",
  "collection": "registryGaps",
  "before": {
    "claimId": "claim_012bfa2639fb107eeb3baee4fb502f54",
    "sourcePath": "docs/specs/runner.md",
    "sourceUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "disposition": "supersede",
    "targetOwner": "docs/specs/runner.md",
    "targetAnchor": "unheaded-block-248",
    "targetUnitDigest": "4f37e3101303fb13398d4b292c695eb061d36e653b3c4aafb275f4949238bc1e",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewStatus": "pending",
    "rationale": "A31 main-only source change: this native old identity gap has the shown same-file successor from the upstream diff. This is conservation accounting, not a plan move or truth approval. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
    "targetAncestry": [
      "Spec: Runner (vòng tự hành)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0029 — Sửa ba mệnh đề từ vựng dispatch của `0026`: bỏ `rootTask`/`subTask`, `capacity` là năng lực có tên, T1 hai giá trị",
      "Quyết định",
      "— T1 (vai trò bên gọi) hai giá trị: `launcher`/`driver`; `orchestrator` = tầng hợp thành T0"
    ],
    "reviewNote": "Independent review pending at corrected current binding; no approval carried."
  },
  "after": {
    "claimId": "claim_012bfa2639fb107eeb3baee4fb502f54",
    "sourcePath": "docs/specs/runner.md",
    "sourceUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "disposition": "supersede",
    "targetOwner": "docs/specs/runner.md",
    "targetAnchor": "unheaded-block-250",
    "targetUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewStatus": "pending",
    "rationale": "A31 main-only source change: this native old identity gap has the shown same-file successor from the upstream diff. This is conservation accounting, not a plan move or truth approval. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. L10-21: content-based rebind from reviewed prior target unheaded-block-248 (95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104) to unheaded-block-250 (95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104); inserted paragraphs shift the anchor, prior target text is unchanged.",
    "targetAncestry": [
      "Spec: Runner (vòng tự hành)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0029 — Sửa ba mệnh đề từ vựng dispatch của `0026`: bỏ `rootTask`/`subTask`, `capacity` là năng lực có tên, T1 hai giá trị",
      "Hệ quả"
    ]
  },
  "prior": {
    "claimId": "claim_012bfa2639fb107eeb3baee4fb502f54",
    "sourcePath": "docs/specs/runner.md",
    "sourceUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "disposition": "supersede",
    "targetOwner": "docs/specs/runner.md",
    "targetAnchor": "unheaded-block-248",
    "targetUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "authoredBy": "codex-session:5@2026-10-13",
    "reviewStatus": "reviewed",
    "rationale": "A31 main-only source change: this native old identity gap has the shown same-file successor from the upstream diff. This is conservation accounting, not a plan move or truth approval.",
    "targetAncestry": [
      "Spec: Runner (vòng tự hành)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0029 — Sửa ba mệnh đề từ vựng dispatch của `0026`: bỏ `rootTask`/`subTask`, `capacity` là năng lực có tên, T1 hai giá trị",
      "Hệ quả"
    ],
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-13",
    "reviewedAt": "2026-10-13",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-3-boundary-gaps.md",
    "reviewReportCommit": "168a27c6c704854b4777792e6632302f1616c65a",
    "reviewMode": "ordinary",
    "reviewNote": "ok. Identical boilerplate line; anchor 244 to 248, line 2442 to 2459 (+17); occurrence 6 of 19 in both versions. No text change."
  },
  "targetWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-250",
    "githubAnchor": "unheaded-block-250",
    "stableAnchor": "unheaded-block-250",
    "title": "Unheaded block 250",
    "startLine": 2499,
    "endLine": 2499,
    "textDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "sample": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.",
    "identityFingerprint": "296f985e5b54ee8a748bb127a90d0627b6a791eefd97e4cde988251e983780d6",
    "ancestry": [
      "Spec: Runner (vòng tự hành)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0029 — Sửa ba mệnh đề từ vựng dispatch của `0026`: bỏ `rootTask`/`subTask`, `capacity` là năng lực có tên, T1 hai giá trị",
      "Hệ quả"
    ],
    "text": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ."
  },
  "relatedClaimId": "claim_012bfa2639fb107eeb3baee4fb502f54",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_012bfa2639fb107eeb3baee4fb502f54",
    "sourcePath": "docs/specs/runner.md",
    "sourceUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "disposition": "supersede",
    "targetOwner": "docs/specs/runner.md",
    "targetAnchor": "unheaded-block-250",
    "targetUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewStatus": "pending",
    "rationale": "A31 main-only source change: this native old identity gap has the shown same-file successor from the upstream diff. This is conservation accounting, not a plan move or truth approval. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. L10-21: content-based rebind from reviewed prior target unheaded-block-248 (95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104) to unheaded-block-250 (95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104); inserted paragraphs shift the anchor, prior target text is unchanged.",
    "targetAncestry": [
      "Spec: Runner (vòng tự hành)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0029 — Sửa ba mệnh đề từ vựng dispatch của `0026`: bỏ `rootTask`/`subTask`, `capacity` là năng lực có tên, T1 hai giá trị",
      "Hệ quả"
    ]
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-250",
    "githubAnchor": "unheaded-block-250",
    "stableAnchor": "unheaded-block-250",
    "title": "Unheaded block 250",
    "startLine": 2499,
    "endLine": 2499,
    "textDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "sample": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.",
    "identityFingerprint": "296f985e5b54ee8a748bb127a90d0627b6a791eefd97e4cde988251e983780d6",
    "ancestry": [
      "Spec: Runner (vòng tự hành)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0029 — Sửa ba mệnh đề từ vựng dispatch của `0026`: bỏ `rootTask`/`subTask`, `capacity` là năng lực có tên, T1 hai giá trị",
      "Hệ quả"
    ],
    "text": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ."
  },
  "oldAnchor": "unheaded-block-248",
  "newAnchor": "unheaded-block-250",
  "oldDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
  "newDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
  "deepRequired": true,
  "helper": "scripts/doc-binding-repair.mjs",
  "contentProof": {
    "priorCommit": "ab4d6274a",
    "priorMatchingUnits": [
      {
        "unitKind": "unheaded-block",
        "anchor": "unheaded-block-150",
        "githubAnchor": "unheaded-block-150",
        "stableAnchor": "unheaded-block-150",
        "title": "Unheaded block 150",
        "startLine": 1665,
        "endLine": 1665,
        "textDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
        "sample": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.",
        "identityFingerprint": "296f985e5b54ee8a748bb127a90d0627b6a791eefd97e4cde988251e983780d6",
        "ancestry": [
          "Spec: Runner (vòng tự hành)",
          "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
          "0005 — Runner & cô lập worker",
          "Hệ quả"
        ],
        "text": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ."
      },
      {
        "unitKind": "unheaded-block",
        "anchor": "unheaded-block-155",
        "githubAnchor": "unheaded-block-155",
        "stableAnchor": "unheaded-block-155",
        "title": "Unheaded block 155",
        "startLine": 1693,
        "endLine": 1693,
        "textDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
        "sample": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.",
        "identityFingerprint": "296f985e5b54ee8a748bb127a90d0627b6a791eefd97e4cde988251e983780d6",
        "ancestry": [
          "Spec: Runner (vòng tự hành)",
          "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
          "0008 — Routing theo audience của từng interface",
          "Hệ quả"
        ],
        "text": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ."
      },
      {
        "unitKind": "unheaded-block",
        "anchor": "unheaded-block-167",
        "githubAnchor": "unheaded-block-167",
        "stableAnchor": "unheaded-block-167",
        "title": "Unheaded block 167",
        "startLine": 1802,
        "endLine": 1802,
        "textDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
        "sample": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.",
        "identityFingerprint": "296f985e5b54ee8a748bb127a90d0627b6a791eefd97e4cde988251e983780d6",
        "ancestry": [
          "Spec: Runner (vòng tự hành)",
          "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
          "0020 — Chặn `.fgos/` khỏi worktree worker (không khóa, không cô lập)",
          "Hệ quả"
        ],
        "text": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ."
      },
      {
        "unitKind": "unheaded-block",
        "anchor": "unheaded-block-176",
        "githubAnchor": "unheaded-block-176",
        "stableAnchor": "unheaded-block-176",
        "title": "Unheaded block 176",
        "startLine": 1886,
        "endLine": 1886,
        "textDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
        "sample": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.",
        "identityFingerprint": "296f985e5b54ee8a748bb127a90d0627b6a791eefd97e4cde988251e983780d6",
        "ancestry": [
          "Spec: Runner (vòng tự hành)",
          "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
          "0021 — Wire main-checkout lock hook qua fgos doctor/setup, không epoch-fence",
          "Hệ quả"
        ],
        "text": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ."
      },
      {
        "unitKind": "unheaded-block",
        "anchor": "unheaded-block-241",
        "githubAnchor": "unheaded-block-241",
        "stableAnchor": "unheaded-block-241",
        "title": "Unheaded block 241",
        "startLine": 2410,
        "endLine": 2410,
        "textDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
        "sample": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.",
        "identityFingerprint": "296f985e5b54ee8a748bb127a90d0627b6a791eefd97e4cde988251e983780d6",
        "ancestry": [
          "Spec: Runner (vòng tự hành)",
          "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
          "0028 — Đổi tên pinned term `orchestrator` thành `launcher`",
          "Hệ quả"
        ],
        "text": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ."
      },
      {
        "unitKind": "unheaded-block",
        "anchor": "unheaded-block-250",
        "githubAnchor": "unheaded-block-250",
        "stableAnchor": "unheaded-block-250",
        "title": "Unheaded block 250",
        "startLine": 2499,
        "endLine": 2499,
        "textDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
        "sample": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.",
        "identityFingerprint": "296f985e5b54ee8a748bb127a90d0627b6a791eefd97e4cde988251e983780d6",
        "ancestry": [
          "Spec: Runner (vòng tự hành)",
          "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
          "0029 — Sửa ba mệnh đề từ vựng dispatch của `0026`: bỏ `rootTask`/`subTask`, `capacity` là năng lực có tên, T1 hai giá trị",
          "Hệ quả"
        ],
        "text": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ."
      },
      {
        "unitKind": "unheaded-block",
        "anchor": "unheaded-block-274",
        "githubAnchor": "unheaded-block-274",
        "stableAnchor": "unheaded-block-274",
        "title": "Unheaded block 274",
        "startLine": 2680,
        "endLine": 2680,
        "textDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
        "sample": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.",
        "identityFingerprint": "296f985e5b54ee8a748bb127a90d0627b6a791eefd97e4cde988251e983780d6",
        "ancestry": [
          "Spec: Runner (vòng tự hành)",
          "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
          "0031 — Bỏ guard cấm từ `orchestrator` sau khi `0029` đã gán nghĩa mới",
          "Hệ quả"
        ],
        "text": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ."
      },
      {
        "unitKind": "unheaded-block",
        "anchor": "unheaded-block-286",
        "githubAnchor": "unheaded-block-286",
        "stableAnchor": "unheaded-block-286",
        "title": "Unheaded block 286",
        "startLine": 2792,
        "endLine": 2792,
        "textDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
        "sample": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.",
        "identityFingerprint": "296f985e5b54ee8a748bb127a90d0627b6a791eefd97e4cde988251e983780d6",
        "ancestry": [
          "Spec: Runner (vòng tự hành)",
          "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
          "0032 — Cổng Iron Law chỉ hỏi ở ranh giới trunk, thêm mức `warn`, agent gõ lệnh thay người",
          "Hệ quả"
        ],
        "text": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ."
      }
    ],
    "currentText": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.",
    "allPriorMatchingTextsEqualCurrent": true,
    "helperReplayed": true
  },
  "reviewScope": "Re-anchor receipt; claim verdict belongs to decisions section.",
  "packagedBy": "codex-session:unit-run-1792094246578-b2fbe39b@2026-10-16",
  "currentContentCommit": "345f15d95663260976200be66d1b9a6c648bcd6d",
  "entryId": "anchors-018"
}
```

## Entry anchors-019

```json
{
  "kind": "content-reanchoring-proof",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-boundary-gaps.json",
  "collection": "registryGaps",
  "before": {
    "claimId": "claim_99806d8b21d05eb7a8e8744d765bea00",
    "sourcePath": "docs/specs/runner.md",
    "sourceUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "disposition": "supersede",
    "targetOwner": "docs/specs/runner.md",
    "targetAnchor": "unheaded-block-272",
    "targetUnitDigest": "1f2b182749f127340bb8dcd372d42350e304ea1f1d9b4f4ba4819b49f277cf19",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewStatus": "pending",
    "rationale": "A31 main-only source change: this native old identity gap has the shown same-file successor from the upstream diff. This is conservation accounting, not a plan move or truth approval. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
    "targetAncestry": [
      "Spec: Runner (vòng tự hành)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0031 — Bỏ guard cấm từ `orchestrator` sau khi `0029` đã gán nghĩa mới",
      "Từ vựng sau record này"
    ],
    "reviewNote": "Independent review pending at corrected current binding; no approval carried."
  },
  "after": {
    "claimId": "claim_99806d8b21d05eb7a8e8744d765bea00",
    "sourcePath": "docs/specs/runner.md",
    "sourceUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "disposition": "supersede",
    "targetOwner": "docs/specs/runner.md",
    "targetAnchor": "unheaded-block-274",
    "targetUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewStatus": "pending",
    "rationale": "A31 main-only source change: this native old identity gap has the shown same-file successor from the upstream diff. This is conservation accounting, not a plan move or truth approval. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. L10-21: content-based rebind from reviewed prior target unheaded-block-272 (95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104) to unheaded-block-274 (95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104); inserted paragraphs shift the anchor, prior target text is unchanged.",
    "targetAncestry": [
      "Spec: Runner (vòng tự hành)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0031 — Bỏ guard cấm từ `orchestrator` sau khi `0029` đã gán nghĩa mới",
      "Hệ quả"
    ]
  },
  "prior": {
    "claimId": "claim_99806d8b21d05eb7a8e8744d765bea00",
    "sourcePath": "docs/specs/runner.md",
    "sourceUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "disposition": "supersede",
    "targetOwner": "docs/specs/runner.md",
    "targetAnchor": "unheaded-block-272",
    "targetUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "authoredBy": "codex-session:5@2026-10-13",
    "reviewStatus": "reviewed",
    "rationale": "A31 main-only source change: this native old identity gap has the shown same-file successor from the upstream diff. This is conservation accounting, not a plan move or truth approval.",
    "targetAncestry": [
      "Spec: Runner (vòng tự hành)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0031 — Bỏ guard cấm từ `orchestrator` sau khi `0029` đã gán nghĩa mới",
      "Hệ quả"
    ],
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-13",
    "reviewedAt": "2026-10-13",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-3-boundary-gaps.md",
    "reviewReportCommit": "168a27c6c704854b4777792e6632302f1616c65a",
    "reviewMode": "ordinary",
    "reviewNote": "ok. Identical boilerplate line; anchor 268 to 272, line 2623 to 2640 (+17); occurrence 7 of 19 in both versions. No text change."
  },
  "targetWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-274",
    "githubAnchor": "unheaded-block-274",
    "stableAnchor": "unheaded-block-274",
    "title": "Unheaded block 274",
    "startLine": 2680,
    "endLine": 2680,
    "textDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "sample": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.",
    "identityFingerprint": "296f985e5b54ee8a748bb127a90d0627b6a791eefd97e4cde988251e983780d6",
    "ancestry": [
      "Spec: Runner (vòng tự hành)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0031 — Bỏ guard cấm từ `orchestrator` sau khi `0029` đã gán nghĩa mới",
      "Hệ quả"
    ],
    "text": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ."
  },
  "relatedClaimId": "claim_99806d8b21d05eb7a8e8744d765bea00",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_99806d8b21d05eb7a8e8744d765bea00",
    "sourcePath": "docs/specs/runner.md",
    "sourceUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "disposition": "supersede",
    "targetOwner": "docs/specs/runner.md",
    "targetAnchor": "unheaded-block-274",
    "targetUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewStatus": "pending",
    "rationale": "A31 main-only source change: this native old identity gap has the shown same-file successor from the upstream diff. This is conservation accounting, not a plan move or truth approval. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. L10-21: content-based rebind from reviewed prior target unheaded-block-272 (95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104) to unheaded-block-274 (95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104); inserted paragraphs shift the anchor, prior target text is unchanged.",
    "targetAncestry": [
      "Spec: Runner (vòng tự hành)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0031 — Bỏ guard cấm từ `orchestrator` sau khi `0029` đã gán nghĩa mới",
      "Hệ quả"
    ]
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-274",
    "githubAnchor": "unheaded-block-274",
    "stableAnchor": "unheaded-block-274",
    "title": "Unheaded block 274",
    "startLine": 2680,
    "endLine": 2680,
    "textDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "sample": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.",
    "identityFingerprint": "296f985e5b54ee8a748bb127a90d0627b6a791eefd97e4cde988251e983780d6",
    "ancestry": [
      "Spec: Runner (vòng tự hành)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0031 — Bỏ guard cấm từ `orchestrator` sau khi `0029` đã gán nghĩa mới",
      "Hệ quả"
    ],
    "text": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ."
  },
  "oldAnchor": "unheaded-block-272",
  "newAnchor": "unheaded-block-274",
  "oldDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
  "newDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
  "deepRequired": true,
  "helper": "scripts/doc-binding-repair.mjs",
  "contentProof": {
    "priorCommit": "ab4d6274a",
    "priorMatchingUnits": [
      {
        "unitKind": "unheaded-block",
        "anchor": "unheaded-block-150",
        "githubAnchor": "unheaded-block-150",
        "stableAnchor": "unheaded-block-150",
        "title": "Unheaded block 150",
        "startLine": 1665,
        "endLine": 1665,
        "textDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
        "sample": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.",
        "identityFingerprint": "296f985e5b54ee8a748bb127a90d0627b6a791eefd97e4cde988251e983780d6",
        "ancestry": [
          "Spec: Runner (vòng tự hành)",
          "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
          "0005 — Runner & cô lập worker",
          "Hệ quả"
        ],
        "text": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ."
      },
      {
        "unitKind": "unheaded-block",
        "anchor": "unheaded-block-155",
        "githubAnchor": "unheaded-block-155",
        "stableAnchor": "unheaded-block-155",
        "title": "Unheaded block 155",
        "startLine": 1693,
        "endLine": 1693,
        "textDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
        "sample": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.",
        "identityFingerprint": "296f985e5b54ee8a748bb127a90d0627b6a791eefd97e4cde988251e983780d6",
        "ancestry": [
          "Spec: Runner (vòng tự hành)",
          "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
          "0008 — Routing theo audience của từng interface",
          "Hệ quả"
        ],
        "text": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ."
      },
      {
        "unitKind": "unheaded-block",
        "anchor": "unheaded-block-167",
        "githubAnchor": "unheaded-block-167",
        "stableAnchor": "unheaded-block-167",
        "title": "Unheaded block 167",
        "startLine": 1802,
        "endLine": 1802,
        "textDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
        "sample": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.",
        "identityFingerprint": "296f985e5b54ee8a748bb127a90d0627b6a791eefd97e4cde988251e983780d6",
        "ancestry": [
          "Spec: Runner (vòng tự hành)",
          "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
          "0020 — Chặn `.fgos/` khỏi worktree worker (không khóa, không cô lập)",
          "Hệ quả"
        ],
        "text": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ."
      },
      {
        "unitKind": "unheaded-block",
        "anchor": "unheaded-block-176",
        "githubAnchor": "unheaded-block-176",
        "stableAnchor": "unheaded-block-176",
        "title": "Unheaded block 176",
        "startLine": 1886,
        "endLine": 1886,
        "textDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
        "sample": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.",
        "identityFingerprint": "296f985e5b54ee8a748bb127a90d0627b6a791eefd97e4cde988251e983780d6",
        "ancestry": [
          "Spec: Runner (vòng tự hành)",
          "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
          "0021 — Wire main-checkout lock hook qua fgos doctor/setup, không epoch-fence",
          "Hệ quả"
        ],
        "text": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ."
      },
      {
        "unitKind": "unheaded-block",
        "anchor": "unheaded-block-241",
        "githubAnchor": "unheaded-block-241",
        "stableAnchor": "unheaded-block-241",
        "title": "Unheaded block 241",
        "startLine": 2410,
        "endLine": 2410,
        "textDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
        "sample": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.",
        "identityFingerprint": "296f985e5b54ee8a748bb127a90d0627b6a791eefd97e4cde988251e983780d6",
        "ancestry": [
          "Spec: Runner (vòng tự hành)",
          "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
          "0028 — Đổi tên pinned term `orchestrator` thành `launcher`",
          "Hệ quả"
        ],
        "text": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ."
      },
      {
        "unitKind": "unheaded-block",
        "anchor": "unheaded-block-250",
        "githubAnchor": "unheaded-block-250",
        "stableAnchor": "unheaded-block-250",
        "title": "Unheaded block 250",
        "startLine": 2499,
        "endLine": 2499,
        "textDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
        "sample": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.",
        "identityFingerprint": "296f985e5b54ee8a748bb127a90d0627b6a791eefd97e4cde988251e983780d6",
        "ancestry": [
          "Spec: Runner (vòng tự hành)",
          "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
          "0029 — Sửa ba mệnh đề từ vựng dispatch của `0026`: bỏ `rootTask`/`subTask`, `capacity` là năng lực có tên, T1 hai giá trị",
          "Hệ quả"
        ],
        "text": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ."
      },
      {
        "unitKind": "unheaded-block",
        "anchor": "unheaded-block-274",
        "githubAnchor": "unheaded-block-274",
        "stableAnchor": "unheaded-block-274",
        "title": "Unheaded block 274",
        "startLine": 2680,
        "endLine": 2680,
        "textDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
        "sample": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.",
        "identityFingerprint": "296f985e5b54ee8a748bb127a90d0627b6a791eefd97e4cde988251e983780d6",
        "ancestry": [
          "Spec: Runner (vòng tự hành)",
          "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
          "0031 — Bỏ guard cấm từ `orchestrator` sau khi `0029` đã gán nghĩa mới",
          "Hệ quả"
        ],
        "text": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ."
      },
      {
        "unitKind": "unheaded-block",
        "anchor": "unheaded-block-286",
        "githubAnchor": "unheaded-block-286",
        "stableAnchor": "unheaded-block-286",
        "title": "Unheaded block 286",
        "startLine": 2792,
        "endLine": 2792,
        "textDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
        "sample": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.",
        "identityFingerprint": "296f985e5b54ee8a748bb127a90d0627b6a791eefd97e4cde988251e983780d6",
        "ancestry": [
          "Spec: Runner (vòng tự hành)",
          "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
          "0032 — Cổng Iron Law chỉ hỏi ở ranh giới trunk, thêm mức `warn`, agent gõ lệnh thay người",
          "Hệ quả"
        ],
        "text": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ."
      }
    ],
    "currentText": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.",
    "allPriorMatchingTextsEqualCurrent": true,
    "helperReplayed": true
  },
  "reviewScope": "Re-anchor receipt; claim verdict belongs to decisions section.",
  "packagedBy": "codex-session:unit-run-1792094246578-b2fbe39b@2026-10-16",
  "currentContentCommit": "345f15d95663260976200be66d1b9a6c648bcd6d",
  "entryId": "anchors-019"
}
```

## Entry anchors-020

```json
{
  "kind": "content-reanchoring-proof",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-boundary-gaps.json",
  "collection": "registryGaps",
  "before": {
    "claimId": "claim_a6f43d98b3eebe97802fd01a4ac7863b",
    "sourcePath": "docs/specs/runner.md",
    "sourceUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "disposition": "supersede",
    "targetOwner": "docs/specs/runner.md",
    "targetAnchor": "unheaded-block-284",
    "targetUnitDigest": "c496763228fcdb86cf688d7f082a09a001756e2cb92ef03fef99831934360e7b",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewStatus": "pending",
    "rationale": "A31 main-only source change: this native old identity gap has the shown same-file successor from the upstream diff. This is conservation accounting, not a plan move or truth approval. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
    "targetAncestry": [
      "Spec: Runner (vòng tự hành)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0032 — Cổng Iron Law chỉ hỏi ở ranh giới trunk, thêm mức `warn`, agent gõ lệnh thay người",
      "Vì sao `supersedes:` trống"
    ],
    "reviewNote": "Independent review pending at corrected current binding; no approval carried."
  },
  "after": {
    "claimId": "claim_a6f43d98b3eebe97802fd01a4ac7863b",
    "sourcePath": "docs/specs/runner.md",
    "sourceUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "disposition": "supersede",
    "targetOwner": "docs/specs/runner.md",
    "targetAnchor": "unheaded-block-286",
    "targetUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewStatus": "pending",
    "rationale": "A31 main-only source change: this native old identity gap has the shown same-file successor from the upstream diff. This is conservation accounting, not a plan move or truth approval. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. L10-21: content-based rebind from reviewed prior target unheaded-block-284 (95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104) to unheaded-block-286 (95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104); inserted paragraphs shift the anchor, prior target text is unchanged.",
    "targetAncestry": [
      "Spec: Runner (vòng tự hành)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0032 — Cổng Iron Law chỉ hỏi ở ranh giới trunk, thêm mức `warn`, agent gõ lệnh thay người",
      "Hệ quả"
    ]
  },
  "prior": {
    "claimId": "claim_a6f43d98b3eebe97802fd01a4ac7863b",
    "sourcePath": "docs/specs/runner.md",
    "sourceUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "disposition": "supersede",
    "targetOwner": "docs/specs/runner.md",
    "targetAnchor": "unheaded-block-284",
    "targetUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "authoredBy": "codex-session:5@2026-10-13",
    "reviewStatus": "reviewed",
    "rationale": "A31 main-only source change: this native old identity gap has the shown same-file successor from the upstream diff. This is conservation accounting, not a plan move or truth approval.",
    "targetAncestry": [
      "Spec: Runner (vòng tự hành)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0032 — Cổng Iron Law chỉ hỏi ở ranh giới trunk, thêm mức `warn`, agent gõ lệnh thay người",
      "Hệ quả"
    ],
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-13",
    "reviewedAt": "2026-10-13",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-3-boundary-gaps.md",
    "reviewReportCommit": "168a27c6c704854b4777792e6632302f1616c65a",
    "reviewMode": "ordinary",
    "reviewNote": "ok. Identical boilerplate line; anchor 280 to 284, line 2735 to 2752 (+17); occurrence 8 of 19 in both versions. No text change."
  },
  "targetWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-286",
    "githubAnchor": "unheaded-block-286",
    "stableAnchor": "unheaded-block-286",
    "title": "Unheaded block 286",
    "startLine": 2792,
    "endLine": 2792,
    "textDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "sample": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.",
    "identityFingerprint": "296f985e5b54ee8a748bb127a90d0627b6a791eefd97e4cde988251e983780d6",
    "ancestry": [
      "Spec: Runner (vòng tự hành)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0032 — Cổng Iron Law chỉ hỏi ở ranh giới trunk, thêm mức `warn`, agent gõ lệnh thay người",
      "Hệ quả"
    ],
    "text": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ."
  },
  "relatedClaimId": "claim_a6f43d98b3eebe97802fd01a4ac7863b",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_a6f43d98b3eebe97802fd01a4ac7863b",
    "sourcePath": "docs/specs/runner.md",
    "sourceUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "disposition": "supersede",
    "targetOwner": "docs/specs/runner.md",
    "targetAnchor": "unheaded-block-286",
    "targetUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewStatus": "pending",
    "rationale": "A31 main-only source change: this native old identity gap has the shown same-file successor from the upstream diff. This is conservation accounting, not a plan move or truth approval. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. L10-21: content-based rebind from reviewed prior target unheaded-block-284 (95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104) to unheaded-block-286 (95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104); inserted paragraphs shift the anchor, prior target text is unchanged.",
    "targetAncestry": [
      "Spec: Runner (vòng tự hành)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0032 — Cổng Iron Law chỉ hỏi ở ranh giới trunk, thêm mức `warn`, agent gõ lệnh thay người",
      "Hệ quả"
    ]
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-286",
    "githubAnchor": "unheaded-block-286",
    "stableAnchor": "unheaded-block-286",
    "title": "Unheaded block 286",
    "startLine": 2792,
    "endLine": 2792,
    "textDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "sample": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.",
    "identityFingerprint": "296f985e5b54ee8a748bb127a90d0627b6a791eefd97e4cde988251e983780d6",
    "ancestry": [
      "Spec: Runner (vòng tự hành)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0032 — Cổng Iron Law chỉ hỏi ở ranh giới trunk, thêm mức `warn`, agent gõ lệnh thay người",
      "Hệ quả"
    ],
    "text": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ."
  },
  "oldAnchor": "unheaded-block-284",
  "newAnchor": "unheaded-block-286",
  "oldDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
  "newDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
  "deepRequired": true,
  "helper": "scripts/doc-binding-repair.mjs",
  "contentProof": {
    "priorCommit": "ab4d6274a",
    "priorMatchingUnits": [
      {
        "unitKind": "unheaded-block",
        "anchor": "unheaded-block-150",
        "githubAnchor": "unheaded-block-150",
        "stableAnchor": "unheaded-block-150",
        "title": "Unheaded block 150",
        "startLine": 1665,
        "endLine": 1665,
        "textDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
        "sample": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.",
        "identityFingerprint": "296f985e5b54ee8a748bb127a90d0627b6a791eefd97e4cde988251e983780d6",
        "ancestry": [
          "Spec: Runner (vòng tự hành)",
          "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
          "0005 — Runner & cô lập worker",
          "Hệ quả"
        ],
        "text": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ."
      },
      {
        "unitKind": "unheaded-block",
        "anchor": "unheaded-block-155",
        "githubAnchor": "unheaded-block-155",
        "stableAnchor": "unheaded-block-155",
        "title": "Unheaded block 155",
        "startLine": 1693,
        "endLine": 1693,
        "textDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
        "sample": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.",
        "identityFingerprint": "296f985e5b54ee8a748bb127a90d0627b6a791eefd97e4cde988251e983780d6",
        "ancestry": [
          "Spec: Runner (vòng tự hành)",
          "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
          "0008 — Routing theo audience của từng interface",
          "Hệ quả"
        ],
        "text": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ."
      },
      {
        "unitKind": "unheaded-block",
        "anchor": "unheaded-block-167",
        "githubAnchor": "unheaded-block-167",
        "stableAnchor": "unheaded-block-167",
        "title": "Unheaded block 167",
        "startLine": 1802,
        "endLine": 1802,
        "textDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
        "sample": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.",
        "identityFingerprint": "296f985e5b54ee8a748bb127a90d0627b6a791eefd97e4cde988251e983780d6",
        "ancestry": [
          "Spec: Runner (vòng tự hành)",
          "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
          "0020 — Chặn `.fgos/` khỏi worktree worker (không khóa, không cô lập)",
          "Hệ quả"
        ],
        "text": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ."
      },
      {
        "unitKind": "unheaded-block",
        "anchor": "unheaded-block-176",
        "githubAnchor": "unheaded-block-176",
        "stableAnchor": "unheaded-block-176",
        "title": "Unheaded block 176",
        "startLine": 1886,
        "endLine": 1886,
        "textDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
        "sample": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.",
        "identityFingerprint": "296f985e5b54ee8a748bb127a90d0627b6a791eefd97e4cde988251e983780d6",
        "ancestry": [
          "Spec: Runner (vòng tự hành)",
          "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
          "0021 — Wire main-checkout lock hook qua fgos doctor/setup, không epoch-fence",
          "Hệ quả"
        ],
        "text": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ."
      },
      {
        "unitKind": "unheaded-block",
        "anchor": "unheaded-block-241",
        "githubAnchor": "unheaded-block-241",
        "stableAnchor": "unheaded-block-241",
        "title": "Unheaded block 241",
        "startLine": 2410,
        "endLine": 2410,
        "textDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
        "sample": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.",
        "identityFingerprint": "296f985e5b54ee8a748bb127a90d0627b6a791eefd97e4cde988251e983780d6",
        "ancestry": [
          "Spec: Runner (vòng tự hành)",
          "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
          "0028 — Đổi tên pinned term `orchestrator` thành `launcher`",
          "Hệ quả"
        ],
        "text": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ."
      },
      {
        "unitKind": "unheaded-block",
        "anchor": "unheaded-block-250",
        "githubAnchor": "unheaded-block-250",
        "stableAnchor": "unheaded-block-250",
        "title": "Unheaded block 250",
        "startLine": 2499,
        "endLine": 2499,
        "textDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
        "sample": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.",
        "identityFingerprint": "296f985e5b54ee8a748bb127a90d0627b6a791eefd97e4cde988251e983780d6",
        "ancestry": [
          "Spec: Runner (vòng tự hành)",
          "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
          "0029 — Sửa ba mệnh đề từ vựng dispatch của `0026`: bỏ `rootTask`/`subTask`, `capacity` là năng lực có tên, T1 hai giá trị",
          "Hệ quả"
        ],
        "text": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ."
      },
      {
        "unitKind": "unheaded-block",
        "anchor": "unheaded-block-274",
        "githubAnchor": "unheaded-block-274",
        "stableAnchor": "unheaded-block-274",
        "title": "Unheaded block 274",
        "startLine": 2680,
        "endLine": 2680,
        "textDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
        "sample": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.",
        "identityFingerprint": "296f985e5b54ee8a748bb127a90d0627b6a791eefd97e4cde988251e983780d6",
        "ancestry": [
          "Spec: Runner (vòng tự hành)",
          "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
          "0031 — Bỏ guard cấm từ `orchestrator` sau khi `0029` đã gán nghĩa mới",
          "Hệ quả"
        ],
        "text": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ."
      },
      {
        "unitKind": "unheaded-block",
        "anchor": "unheaded-block-286",
        "githubAnchor": "unheaded-block-286",
        "stableAnchor": "unheaded-block-286",
        "title": "Unheaded block 286",
        "startLine": 2792,
        "endLine": 2792,
        "textDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
        "sample": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.",
        "identityFingerprint": "296f985e5b54ee8a748bb127a90d0627b6a791eefd97e4cde988251e983780d6",
        "ancestry": [
          "Spec: Runner (vòng tự hành)",
          "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
          "0032 — Cổng Iron Law chỉ hỏi ở ranh giới trunk, thêm mức `warn`, agent gõ lệnh thay người",
          "Hệ quả"
        ],
        "text": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ."
      }
    ],
    "currentText": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.",
    "allPriorMatchingTextsEqualCurrent": true,
    "helperReplayed": true
  },
  "reviewScope": "Re-anchor receipt; claim verdict belongs to decisions section.",
  "packagedBy": "codex-session:unit-run-1792094246578-b2fbe39b@2026-10-16",
  "currentContentCommit": "345f15d95663260976200be66d1b9a6c648bcd6d",
  "entryId": "anchors-020"
}
```

## Entry anchors-021

```json
{
  "kind": "content-reanchoring-proof",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s4-packaging-distribution-successors.json",
  "collection": "registryGaps",
  "before": {
    "claimId": "claim_de531cd96f9f92540f16d2ec822dbaf3",
    "sourcePath": "docs/specs/confinement-authority.md",
    "sourceUnitDigest": "f99e0d4d9f055f630281cd3e3aead0de52d35fd8fa152c8d429bf0af333ca246",
    "disposition": "supersede",
    "targetOwner": "docs/specs/confinement-authority.md",
    "targetAnchor": "unheaded-block-144",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewStatus": "pending",
    "rationale": "A31 main-only text change has this native same-file successor from the upstream diff. Conservation proposal only; no code truth review or identity graft. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetUnitDigest": "9c24e69b1b4a4ede9fce9ed6d771f342920397506c61c2a546df8163a810c5ae",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)",
      "13.2 Login được gia hạn trong private home: bản chép là snapshot, bản mới hơn được ghi ngược"
    ]
  },
  "after": {
    "claimId": "claim_de531cd96f9f92540f16d2ec822dbaf3",
    "sourcePath": "docs/specs/confinement-authority.md",
    "sourceUnitDigest": "f99e0d4d9f055f630281cd3e3aead0de52d35fd8fa152c8d429bf0af333ca246",
    "disposition": "supersede",
    "targetOwner": "docs/specs/confinement-authority.md",
    "targetAnchor": "unheaded-block-145",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewStatus": "pending",
    "rationale": "A31 main-only text change has this native same-file successor from the upstream diff. Conservation proposal only; no code truth review or identity graft. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. L10-21: content-based rebind from reviewed prior target unheaded-block-144 (f0b5e6c1688beadf7d5f7bbe985a9b46c27990ea720f3a6bbbe3a8df9806dad3) to unheaded-block-145 (f0b5e6c1688beadf7d5f7bbe985a9b46c27990ea720f3a6bbbe3a8df9806dad3); inserted paragraphs shift the anchor, prior target text is unchanged.",
    "targetUnitDigest": "f0b5e6c1688beadf7d5f7bbe985a9b46c27990ea720f3a6bbbe3a8df9806dad3",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)",
      "13.2 Login được gia hạn trong private home: bản chép là snapshot, bản mới hơn được ghi ngược"
    ]
  },
  "prior": {
    "claimId": "claim_de531cd96f9f92540f16d2ec822dbaf3",
    "sourcePath": "docs/specs/confinement-authority.md",
    "sourceUnitDigest": "f99e0d4d9f055f630281cd3e3aead0de52d35fd8fa152c8d429bf0af333ca246",
    "disposition": "supersede",
    "targetOwner": "docs/specs/confinement-authority.md",
    "targetAnchor": "unheaded-block-144",
    "authoredBy": "codex-session:15@2026-10-14",
    "reviewStatus": "reviewed",
    "rationale": "A31 main-only text change has this native same-file successor from the upstream diff. Conservation proposal only; no code truth review or identity graft.",
    "reviewNote": "Historical confinement#144 (f99e0d4d, 1f911229f) superseded by f0b5e6c1; the old cap and held-when-full sentences are replaced by the redundant-only drop rule in the same unit, including main's latest per-store wording; same file, no graft",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-14",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-5-root-authorities-boundary-gaps.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "f0b5e6c1688beadf7d5f7bbe985a9b46c27990ea720f3a6bbbe3a8df9806dad3",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)",
      "13.2 Login được gia hạn trong private home: bản chép là snapshot, bản mới hơn được ghi ngược"
    ],
    "reviewReportCommit": "4f99b9ec9eaf90f9db38e9073f92ca76c6808d1e"
  },
  "targetWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-145",
    "githubAnchor": "unheaded-block-145",
    "stableAnchor": "unheaded-block-145",
    "title": "Unheaded block 145",
    "startLine": 1371,
    "endLine": 1372,
    "textDigest": "f0b5e6c1688beadf7d5f7bbe985a9b46c27990ea720f3a6bbbe3a8df9806dad3",
    "sample": "- **Kho SQLite chép dạng snapshot.** File `agent.db` (omp) trong danh sách `files` được chép bằng `VACUUM INTO` qua `node:sqlite` — snapshot nhất quán, gồm cả phần còn nằm trong wr",
    "identityFingerprint": "3b2449b1edc267a1157f77e25028c3045a65714309624b194d36cb5f286383bd",
    "ancestry": [
      "Spec: Agent Confinement Authority",
      "13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)",
      "13.2 Login được gia hạn trong private home: bản chép là snapshot, bản mới hơn được ghi ngược"
    ],
    "text": "- **Kho SQLite chép dạng snapshot.** File `agent.db` (omp) trong danh sách `files` được chép bằng `VACUUM INTO` qua `node:sqlite` — snapshot nhất quán, gồm cả phần còn nằm trong write-ahead log — thay vì chép file thô thiếu WAL; không có `node:sqlite` thì chép file như trước. Danh sách file được phép chép không đổi, thư mục account thật vẫn không bao giờ được mount.\n- **Bản mới hơn được ghi ngược lúc xoá home.** Khi dispatch được opt-in (caller truyền hàm gia hạn), ownership marker của private home ghi thêm `credentialWriteBack` (provider, account, home nguồn, layout, runtime dir; chỉ tên và đường dẫn, không giá trị credential) sau khi chép xong. Mọi đường xoá home — cleanup của driver, `finalizeConfinementResources` và orphan reaper — đi qua một hàm xoá duy nhất (`removeConfinementDir`, `confinement/cleanup.mjs`): trước khi xoá, login trong home mới hơn login nguồn thì được dàn (staging) rồi áp lên nguồn dưới lock của account, một lần thử không chờ; lock bận thì để `pending/` cho lần refresh-ahead kế tiếp. Lỗi ghi ngược chỉ báo bằng mã cố định trên stderr và chỉ chặn việc xoá trong đúng một trường hợp: việc dàn thất bại (xem dưới). Bản dàn không bao giờ bị xoá khi nguồn không đọc được (đang ghi dở, `agent.db` không mở được, hoặc không xác định được entry) hay khi bản chép không đọc được vì lý do có thể qua (thiếu `node:sqlite`, `agent.db` không mở được): bản chép được giữ ở `pending/` (giới hạn 5 bản mỗi kho login (mỗi account với một kho, mỗi `stores/<cli>` với kho theo CLI), nhưng chỉ bản dư thừa mới bị bỏ: sau khi áp các bản pending dưới account lock, bản có login trùng hệt một bản pending khác thì bị bỏ khi account vượt giới hạn, bản mới nhất của mỗi nhóm trùng được giữ; bản không chứng minh được là dư thừa hay lỗi thời thì không bao giờ bị bỏ để nhường chỗ, nên account có thể vượt giới hạn và check doctor báo; bản do probe ghi dở được giữ ở `torn/` cho việc khôi phục thủ công, không bao giờ tự áp hay tự bỏ, và doctor báo ở mọi tuổi; `torn/` chỉ áp cho bản scratch của probe, còn scratch do runner đã chết để lại và pane home có store bị cắt vẫn bị xoá khi JSON không đọc được; bản không parse được thì so theo byte của file store và của write-ahead log hoặc rollback journal không rỗng (file không đọc được, trừ khi không tồn tại, không bao giờ bị coi là không có; index `-shm` không tính); home có file store trùng từng byte với nguồn và không bên nào có write-ahead log hay journal không rỗng thì không renew gì nên không được dàn) và báo `staged`/`apply-deferred`; chỉ xoá khi nguồn đọc được và chứng minh bản chép không mới hơn, hoặc bản chép được chứng minh hỏng (JSON hỏng, hay không có entry dùng được). Lỗi đọc file của hệ điều hành (quyền, I/O; mã `unreadable-file`) có thể qua nên bản chép được giữ; chỉ file kho không tồn tại (`missing-file`) mới được coi là rỗng và bị xoá. Nếu việc dàn thất bại, private home và marker được giữ lại (việc xoá báo lỗi, một dòng stderr mã cố định) để lần xoá sau, kể cả của reaper, thử lại; mỗi lần thất bại được đếm trong marker (`credentialKept`; hai lần cách nhau dưới 15 phút chỉ tính một, để lỗi tạm thời không dùng hết hạn mức), marker được ghi qua file tạm rồi rename và marker có mặt nhưng đọc không được thì việc xoá dừng lại. Sau 5 lần home bị giữ hẳn: không thử xoá nữa, không bao giờ bị xoá vì quá tuổi. Home bị giữ được kiểm lại dưới account lock khi account đó được gia hạn lần kế tiếp và bởi `fgos doctor --fix` (tập temp root tìm kiếm giống của doctor: root mặc định cộng `tempRoot` của từng backend đã đăng ký, lấy qua hook do phía dispatch truyền xuống; home nằm dưới `privateHomeRoot` riêng của backend không thuộc tập này nên không check, repair, reaper hay lần gia hạn nào thấy, và cũng không bao giờ bị xoá), và chỉ với home thuộc đúng runtime dir của lock đang giữ: chỉ xoá khi nguồn đọc được và chứng minh login trong home không mới hơn, hoặc login đó đã dàn được cạnh nguồn (và được áp); không thì vẫn giữ. Bản đã dàn và thư mục `pending/` được đồng bộ xuống đĩa trước khi home bị xoá. File marker không nhận ra được là marker nào cả (không phải JSON, không phải object, hay không có tên contract) thì mọi việc xoá home đó dừng lại. Finalizer so digest của marker không tính `credentialKept` (cleanup của driver thêm trường này sau khi digest được lấy) và không dừng ở home đó mà vẫn xoá các resource còn lại của dispatch (dispatch ghi là `retained`, kèm lý do của home). Check `credential-copies-retained` của `fgos doctor` báo theo provider/account: home bị giữ hẳn (fail, nêu thư mục home), home đang thử lại và các bản `pending/`/scratch quá một ngày (cảnh báo); chỉ có số đếm và tuổi, không bao giờ in giá trị, và check không xoá gì. Provisioning Codex đóng kín (fail closed): `auth.json` là symlink trỏ ra ngoài home, hoặc `home` tương đối, làm dispatch thất bại trước khi worker chạy (trước đây symlink được theo, home tương đối được hiểu theo cwd). Đường xoá home gọi module gia hạn credential (`provider-credential-renewal.mjs`) và qua đó phụ thuộc vào provider capacity, chỉ để lấy account lock. Home không có field này được xoá y như trước."
  },
  "relatedClaimId": "claim_de531cd96f9f92540f16d2ec822dbaf3",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_de531cd96f9f92540f16d2ec822dbaf3",
    "sourcePath": "docs/specs/confinement-authority.md",
    "sourceUnitDigest": "f99e0d4d9f055f630281cd3e3aead0de52d35fd8fa152c8d429bf0af333ca246",
    "disposition": "supersede",
    "targetOwner": "docs/specs/confinement-authority.md",
    "targetAnchor": "unheaded-block-145",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewStatus": "pending",
    "rationale": "A31 main-only text change has this native same-file successor from the upstream diff. Conservation proposal only; no code truth review or identity graft. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. L10-21: content-based rebind from reviewed prior target unheaded-block-144 (f0b5e6c1688beadf7d5f7bbe985a9b46c27990ea720f3a6bbbe3a8df9806dad3) to unheaded-block-145 (f0b5e6c1688beadf7d5f7bbe985a9b46c27990ea720f3a6bbbe3a8df9806dad3); inserted paragraphs shift the anchor, prior target text is unchanged.",
    "targetUnitDigest": "f0b5e6c1688beadf7d5f7bbe985a9b46c27990ea720f3a6bbbe3a8df9806dad3",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)",
      "13.2 Login được gia hạn trong private home: bản chép là snapshot, bản mới hơn được ghi ngược"
    ]
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-145",
    "githubAnchor": "unheaded-block-145",
    "stableAnchor": "unheaded-block-145",
    "title": "Unheaded block 145",
    "startLine": 1371,
    "endLine": 1372,
    "textDigest": "f0b5e6c1688beadf7d5f7bbe985a9b46c27990ea720f3a6bbbe3a8df9806dad3",
    "sample": "- **Kho SQLite chép dạng snapshot.** File `agent.db` (omp) trong danh sách `files` được chép bằng `VACUUM INTO` qua `node:sqlite` — snapshot nhất quán, gồm cả phần còn nằm trong wr",
    "identityFingerprint": "3b2449b1edc267a1157f77e25028c3045a65714309624b194d36cb5f286383bd",
    "ancestry": [
      "Spec: Agent Confinement Authority",
      "13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)",
      "13.2 Login được gia hạn trong private home: bản chép là snapshot, bản mới hơn được ghi ngược"
    ],
    "text": "- **Kho SQLite chép dạng snapshot.** File `agent.db` (omp) trong danh sách `files` được chép bằng `VACUUM INTO` qua `node:sqlite` — snapshot nhất quán, gồm cả phần còn nằm trong write-ahead log — thay vì chép file thô thiếu WAL; không có `node:sqlite` thì chép file như trước. Danh sách file được phép chép không đổi, thư mục account thật vẫn không bao giờ được mount.\n- **Bản mới hơn được ghi ngược lúc xoá home.** Khi dispatch được opt-in (caller truyền hàm gia hạn), ownership marker của private home ghi thêm `credentialWriteBack` (provider, account, home nguồn, layout, runtime dir; chỉ tên và đường dẫn, không giá trị credential) sau khi chép xong. Mọi đường xoá home — cleanup của driver, `finalizeConfinementResources` và orphan reaper — đi qua một hàm xoá duy nhất (`removeConfinementDir`, `confinement/cleanup.mjs`): trước khi xoá, login trong home mới hơn login nguồn thì được dàn (staging) rồi áp lên nguồn dưới lock của account, một lần thử không chờ; lock bận thì để `pending/` cho lần refresh-ahead kế tiếp. Lỗi ghi ngược chỉ báo bằng mã cố định trên stderr và chỉ chặn việc xoá trong đúng một trường hợp: việc dàn thất bại (xem dưới). Bản dàn không bao giờ bị xoá khi nguồn không đọc được (đang ghi dở, `agent.db` không mở được, hoặc không xác định được entry) hay khi bản chép không đọc được vì lý do có thể qua (thiếu `node:sqlite`, `agent.db` không mở được): bản chép được giữ ở `pending/` (giới hạn 5 bản mỗi kho login (mỗi account với một kho, mỗi `stores/<cli>` với kho theo CLI), nhưng chỉ bản dư thừa mới bị bỏ: sau khi áp các bản pending dưới account lock, bản có login trùng hệt một bản pending khác thì bị bỏ khi account vượt giới hạn, bản mới nhất của mỗi nhóm trùng được giữ; bản không chứng minh được là dư thừa hay lỗi thời thì không bao giờ bị bỏ để nhường chỗ, nên account có thể vượt giới hạn và check doctor báo; bản do probe ghi dở được giữ ở `torn/` cho việc khôi phục thủ công, không bao giờ tự áp hay tự bỏ, và doctor báo ở mọi tuổi; `torn/` chỉ áp cho bản scratch của probe, còn scratch do runner đã chết để lại và pane home có store bị cắt vẫn bị xoá khi JSON không đọc được; bản không parse được thì so theo byte của file store và của write-ahead log hoặc rollback journal không rỗng (file không đọc được, trừ khi không tồn tại, không bao giờ bị coi là không có; index `-shm` không tính); home có file store trùng từng byte với nguồn và không bên nào có write-ahead log hay journal không rỗng thì không renew gì nên không được dàn) và báo `staged`/`apply-deferred`; chỉ xoá khi nguồn đọc được và chứng minh bản chép không mới hơn, hoặc bản chép được chứng minh hỏng (JSON hỏng, hay không có entry dùng được). Lỗi đọc file của hệ điều hành (quyền, I/O; mã `unreadable-file`) có thể qua nên bản chép được giữ; chỉ file kho không tồn tại (`missing-file`) mới được coi là rỗng và bị xoá. Nếu việc dàn thất bại, private home và marker được giữ lại (việc xoá báo lỗi, một dòng stderr mã cố định) để lần xoá sau, kể cả của reaper, thử lại; mỗi lần thất bại được đếm trong marker (`credentialKept`; hai lần cách nhau dưới 15 phút chỉ tính một, để lỗi tạm thời không dùng hết hạn mức), marker được ghi qua file tạm rồi rename và marker có mặt nhưng đọc không được thì việc xoá dừng lại. Sau 5 lần home bị giữ hẳn: không thử xoá nữa, không bao giờ bị xoá vì quá tuổi. Home bị giữ được kiểm lại dưới account lock khi account đó được gia hạn lần kế tiếp và bởi `fgos doctor --fix` (tập temp root tìm kiếm giống của doctor: root mặc định cộng `tempRoot` của từng backend đã đăng ký, lấy qua hook do phía dispatch truyền xuống; home nằm dưới `privateHomeRoot` riêng của backend không thuộc tập này nên không check, repair, reaper hay lần gia hạn nào thấy, và cũng không bao giờ bị xoá), và chỉ với home thuộc đúng runtime dir của lock đang giữ: chỉ xoá khi nguồn đọc được và chứng minh login trong home không mới hơn, hoặc login đó đã dàn được cạnh nguồn (và được áp); không thì vẫn giữ. Bản đã dàn và thư mục `pending/` được đồng bộ xuống đĩa trước khi home bị xoá. File marker không nhận ra được là marker nào cả (không phải JSON, không phải object, hay không có tên contract) thì mọi việc xoá home đó dừng lại. Finalizer so digest của marker không tính `credentialKept` (cleanup của driver thêm trường này sau khi digest được lấy) và không dừng ở home đó mà vẫn xoá các resource còn lại của dispatch (dispatch ghi là `retained`, kèm lý do của home). Check `credential-copies-retained` của `fgos doctor` báo theo provider/account: home bị giữ hẳn (fail, nêu thư mục home), home đang thử lại và các bản `pending/`/scratch quá một ngày (cảnh báo); chỉ có số đếm và tuổi, không bao giờ in giá trị, và check không xoá gì. Provisioning Codex đóng kín (fail closed): `auth.json` là symlink trỏ ra ngoài home, hoặc `home` tương đối, làm dispatch thất bại trước khi worker chạy (trước đây symlink được theo, home tương đối được hiểu theo cwd). Đường xoá home gọi module gia hạn credential (`provider-credential-renewal.mjs`) và qua đó phụ thuộc vào provider capacity, chỉ để lấy account lock. Home không có field này được xoá y như trước."
  },
  "oldAnchor": "unheaded-block-144",
  "newAnchor": "unheaded-block-145",
  "oldDigest": "f0b5e6c1688beadf7d5f7bbe985a9b46c27990ea720f3a6bbbe3a8df9806dad3",
  "newDigest": "f0b5e6c1688beadf7d5f7bbe985a9b46c27990ea720f3a6bbbe3a8df9806dad3",
  "deepRequired": true,
  "helper": "scripts/doc-binding-repair.mjs",
  "contentProof": {
    "priorCommit": "ab4d6274a",
    "priorMatchingUnits": [
      {
        "unitKind": "unheaded-block",
        "anchor": "unheaded-block-145",
        "githubAnchor": "unheaded-block-145",
        "stableAnchor": "unheaded-block-145",
        "title": "Unheaded block 145",
        "startLine": 1371,
        "endLine": 1372,
        "textDigest": "f0b5e6c1688beadf7d5f7bbe985a9b46c27990ea720f3a6bbbe3a8df9806dad3",
        "sample": "- **Kho SQLite chép dạng snapshot.** File `agent.db` (omp) trong danh sách `files` được chép bằng `VACUUM INTO` qua `node:sqlite` — snapshot nhất quán, gồm cả phần còn nằm trong wr",
        "identityFingerprint": "3b2449b1edc267a1157f77e25028c3045a65714309624b194d36cb5f286383bd",
        "ancestry": [
          "Spec: Agent Confinement Authority",
          "13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)",
          "13.2 Login được gia hạn trong private home: bản chép là snapshot, bản mới hơn được ghi ngược"
        ],
        "text": "- **Kho SQLite chép dạng snapshot.** File `agent.db` (omp) trong danh sách `files` được chép bằng `VACUUM INTO` qua `node:sqlite` — snapshot nhất quán, gồm cả phần còn nằm trong write-ahead log — thay vì chép file thô thiếu WAL; không có `node:sqlite` thì chép file như trước. Danh sách file được phép chép không đổi, thư mục account thật vẫn không bao giờ được mount.\n- **Bản mới hơn được ghi ngược lúc xoá home.** Khi dispatch được opt-in (caller truyền hàm gia hạn), ownership marker của private home ghi thêm `credentialWriteBack` (provider, account, home nguồn, layout, runtime dir; chỉ tên và đường dẫn, không giá trị credential) sau khi chép xong. Mọi đường xoá home — cleanup của driver, `finalizeConfinementResources` và orphan reaper — đi qua một hàm xoá duy nhất (`removeConfinementDir`, `confinement/cleanup.mjs`): trước khi xoá, login trong home mới hơn login nguồn thì được dàn (staging) rồi áp lên nguồn dưới lock của account, một lần thử không chờ; lock bận thì để `pending/` cho lần refresh-ahead kế tiếp. Lỗi ghi ngược chỉ báo bằng mã cố định trên stderr và chỉ chặn việc xoá trong đúng một trường hợp: việc dàn thất bại (xem dưới). Bản dàn không bao giờ bị xoá khi nguồn không đọc được (đang ghi dở, `agent.db` không mở được, hoặc không xác định được entry) hay khi bản chép không đọc được vì lý do có thể qua (thiếu `node:sqlite`, `agent.db` không mở được): bản chép được giữ ở `pending/` (giới hạn 5 bản mỗi kho login (mỗi account với một kho, mỗi `stores/<cli>` với kho theo CLI), nhưng chỉ bản dư thừa mới bị bỏ: sau khi áp các bản pending dưới account lock, bản có login trùng hệt một bản pending khác thì bị bỏ khi account vượt giới hạn, bản mới nhất của mỗi nhóm trùng được giữ; bản không chứng minh được là dư thừa hay lỗi thời thì không bao giờ bị bỏ để nhường chỗ, nên account có thể vượt giới hạn và check doctor báo; bản do probe ghi dở được giữ ở `torn/` cho việc khôi phục thủ công, không bao giờ tự áp hay tự bỏ, và doctor báo ở mọi tuổi; `torn/` chỉ áp cho bản scratch của probe, còn scratch do runner đã chết để lại và pane home có store bị cắt vẫn bị xoá khi JSON không đọc được; bản không parse được thì so theo byte của file store và của write-ahead log hoặc rollback journal không rỗng (file không đọc được, trừ khi không tồn tại, không bao giờ bị coi là không có; index `-shm` không tính); home có file store trùng từng byte với nguồn và không bên nào có write-ahead log hay journal không rỗng thì không renew gì nên không được dàn) và báo `staged`/`apply-deferred`; chỉ xoá khi nguồn đọc được và chứng minh bản chép không mới hơn, hoặc bản chép được chứng minh hỏng (JSON hỏng, hay không có entry dùng được). Lỗi đọc file của hệ điều hành (quyền, I/O; mã `unreadable-file`) có thể qua nên bản chép được giữ; chỉ file kho không tồn tại (`missing-file`) mới được coi là rỗng và bị xoá. Nếu việc dàn thất bại, private home và marker được giữ lại (việc xoá báo lỗi, một dòng stderr mã cố định) để lần xoá sau, kể cả của reaper, thử lại; mỗi lần thất bại được đếm trong marker (`credentialKept`; hai lần cách nhau dưới 15 phút chỉ tính một, để lỗi tạm thời không dùng hết hạn mức), marker được ghi qua file tạm rồi rename và marker có mặt nhưng đọc không được thì việc xoá dừng lại. Sau 5 lần home bị giữ hẳn: không thử xoá nữa, không bao giờ bị xoá vì quá tuổi. Home bị giữ được kiểm lại dưới account lock khi account đó được gia hạn lần kế tiếp và bởi `fgos doctor --fix` (tập temp root tìm kiếm giống của doctor: root mặc định cộng `tempRoot` của từng backend đã đăng ký, lấy qua hook do phía dispatch truyền xuống; home nằm dưới `privateHomeRoot` riêng của backend không thuộc tập này nên không check, repair, reaper hay lần gia hạn nào thấy, và cũng không bao giờ bị xoá), và chỉ với home thuộc đúng runtime dir của lock đang giữ: chỉ xoá khi nguồn đọc được và chứng minh login trong home không mới hơn, hoặc login đó đã dàn được cạnh nguồn (và được áp); không thì vẫn giữ. Bản đã dàn và thư mục `pending/` được đồng bộ xuống đĩa trước khi home bị xoá. File marker không nhận ra được là marker nào cả (không phải JSON, không phải object, hay không có tên contract) thì mọi việc xoá home đó dừng lại. Finalizer so digest của marker không tính `credentialKept` (cleanup của driver thêm trường này sau khi digest được lấy) và không dừng ở home đó mà vẫn xoá các resource còn lại của dispatch (dispatch ghi là `retained`, kèm lý do của home). Check `credential-copies-retained` của `fgos doctor` báo theo provider/account: home bị giữ hẳn (fail, nêu thư mục home), home đang thử lại và các bản `pending/`/scratch quá một ngày (cảnh báo); chỉ có số đếm và tuổi, không bao giờ in giá trị, và check không xoá gì. Provisioning Codex đóng kín (fail closed): `auth.json` là symlink trỏ ra ngoài home, hoặc `home` tương đối, làm dispatch thất bại trước khi worker chạy (trước đây symlink được theo, home tương đối được hiểu theo cwd). Đường xoá home gọi module gia hạn credential (`provider-credential-renewal.mjs`) và qua đó phụ thuộc vào provider capacity, chỉ để lấy account lock. Home không có field này được xoá y như trước."
      }
    ],
    "currentText": "- **Kho SQLite chép dạng snapshot.** File `agent.db` (omp) trong danh sách `files` được chép bằng `VACUUM INTO` qua `node:sqlite` — snapshot nhất quán, gồm cả phần còn nằm trong write-ahead log — thay vì chép file thô thiếu WAL; không có `node:sqlite` thì chép file như trước. Danh sách file được phép chép không đổi, thư mục account thật vẫn không bao giờ được mount.\n- **Bản mới hơn được ghi ngược lúc xoá home.** Khi dispatch được opt-in (caller truyền hàm gia hạn), ownership marker của private home ghi thêm `credentialWriteBack` (provider, account, home nguồn, layout, runtime dir; chỉ tên và đường dẫn, không giá trị credential) sau khi chép xong. Mọi đường xoá home — cleanup của driver, `finalizeConfinementResources` và orphan reaper — đi qua một hàm xoá duy nhất (`removeConfinementDir`, `confinement/cleanup.mjs`): trước khi xoá, login trong home mới hơn login nguồn thì được dàn (staging) rồi áp lên nguồn dưới lock của account, một lần thử không chờ; lock bận thì để `pending/` cho lần refresh-ahead kế tiếp. Lỗi ghi ngược chỉ báo bằng mã cố định trên stderr và chỉ chặn việc xoá trong đúng một trường hợp: việc dàn thất bại (xem dưới). Bản dàn không bao giờ bị xoá khi nguồn không đọc được (đang ghi dở, `agent.db` không mở được, hoặc không xác định được entry) hay khi bản chép không đọc được vì lý do có thể qua (thiếu `node:sqlite`, `agent.db` không mở được): bản chép được giữ ở `pending/` (giới hạn 5 bản mỗi kho login (mỗi account với một kho, mỗi `stores/<cli>` với kho theo CLI), nhưng chỉ bản dư thừa mới bị bỏ: sau khi áp các bản pending dưới account lock, bản có login trùng hệt một bản pending khác thì bị bỏ khi account vượt giới hạn, bản mới nhất của mỗi nhóm trùng được giữ; bản không chứng minh được là dư thừa hay lỗi thời thì không bao giờ bị bỏ để nhường chỗ, nên account có thể vượt giới hạn và check doctor báo; bản do probe ghi dở được giữ ở `torn/` cho việc khôi phục thủ công, không bao giờ tự áp hay tự bỏ, và doctor báo ở mọi tuổi; `torn/` chỉ áp cho bản scratch của probe, còn scratch do runner đã chết để lại và pane home có store bị cắt vẫn bị xoá khi JSON không đọc được; bản không parse được thì so theo byte của file store và của write-ahead log hoặc rollback journal không rỗng (file không đọc được, trừ khi không tồn tại, không bao giờ bị coi là không có; index `-shm` không tính); home có file store trùng từng byte với nguồn và không bên nào có write-ahead log hay journal không rỗng thì không renew gì nên không được dàn) và báo `staged`/`apply-deferred`; chỉ xoá khi nguồn đọc được và chứng minh bản chép không mới hơn, hoặc bản chép được chứng minh hỏng (JSON hỏng, hay không có entry dùng được). Lỗi đọc file của hệ điều hành (quyền, I/O; mã `unreadable-file`) có thể qua nên bản chép được giữ; chỉ file kho không tồn tại (`missing-file`) mới được coi là rỗng và bị xoá. Nếu việc dàn thất bại, private home và marker được giữ lại (việc xoá báo lỗi, một dòng stderr mã cố định) để lần xoá sau, kể cả của reaper, thử lại; mỗi lần thất bại được đếm trong marker (`credentialKept`; hai lần cách nhau dưới 15 phút chỉ tính một, để lỗi tạm thời không dùng hết hạn mức), marker được ghi qua file tạm rồi rename và marker có mặt nhưng đọc không được thì việc xoá dừng lại. Sau 5 lần home bị giữ hẳn: không thử xoá nữa, không bao giờ bị xoá vì quá tuổi. Home bị giữ được kiểm lại dưới account lock khi account đó được gia hạn lần kế tiếp và bởi `fgos doctor --fix` (tập temp root tìm kiếm giống của doctor: root mặc định cộng `tempRoot` của từng backend đã đăng ký, lấy qua hook do phía dispatch truyền xuống; home nằm dưới `privateHomeRoot` riêng của backend không thuộc tập này nên không check, repair, reaper hay lần gia hạn nào thấy, và cũng không bao giờ bị xoá), và chỉ với home thuộc đúng runtime dir của lock đang giữ: chỉ xoá khi nguồn đọc được và chứng minh login trong home không mới hơn, hoặc login đó đã dàn được cạnh nguồn (và được áp); không thì vẫn giữ. Bản đã dàn và thư mục `pending/` được đồng bộ xuống đĩa trước khi home bị xoá. File marker không nhận ra được là marker nào cả (không phải JSON, không phải object, hay không có tên contract) thì mọi việc xoá home đó dừng lại. Finalizer so digest của marker không tính `credentialKept` (cleanup của driver thêm trường này sau khi digest được lấy) và không dừng ở home đó mà vẫn xoá các resource còn lại của dispatch (dispatch ghi là `retained`, kèm lý do của home). Check `credential-copies-retained` của `fgos doctor` báo theo provider/account: home bị giữ hẳn (fail, nêu thư mục home), home đang thử lại và các bản `pending/`/scratch quá một ngày (cảnh báo); chỉ có số đếm và tuổi, không bao giờ in giá trị, và check không xoá gì. Provisioning Codex đóng kín (fail closed): `auth.json` là symlink trỏ ra ngoài home, hoặc `home` tương đối, làm dispatch thất bại trước khi worker chạy (trước đây symlink được theo, home tương đối được hiểu theo cwd). Đường xoá home gọi module gia hạn credential (`provider-credential-renewal.mjs`) và qua đó phụ thuộc vào provider capacity, chỉ để lấy account lock. Home không có field này được xoá y như trước.",
    "allPriorMatchingTextsEqualCurrent": true,
    "helperReplayed": true
  },
  "reviewScope": "Re-anchor receipt; claim verdict belongs to decisions section.",
  "packagedBy": "codex-session:unit-run-1792094246578-b2fbe39b@2026-10-16",
  "currentContentCommit": "345f15d95663260976200be66d1b9a6c648bcd6d",
  "entryId": "anchors-021"
}
```

## Entry anchors-022

```json
{
  "kind": "content-reanchoring-proof",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s5-root-authorities-boundary-gaps.json",
  "collection": "registryGaps",
  "before": {
    "claimId": "claim_04703f011b22383992b94545055b9e56",
    "sourcePath": "docs/specs/confinement-authority.md",
    "sourceUnitDigest": "12018d6ddfb98564eca2e0dbd9267ffa859e1e5e69c11db3f506886fa0ab717c",
    "disposition": "supersede",
    "targetOwner": "docs/specs/confinement-authority.md",
    "targetAnchor": "unheaded-block-144",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewStatus": "pending",
    "rationale": "A31 exact upstream/candidate restoration successor: the old native identity gap is conserved by the complete same-file current unit shown in the main/import diff. No guessed identity graft or carried approval; code truth and the future batch source disposition remain separate. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetUnitDigest": "9c24e69b1b4a4ede9fce9ed6d771f342920397506c61c2a546df8163a810c5ae",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)",
      "13.2 Login được gia hạn trong private home: bản chép là snapshot, bản mới hơn được ghi ngược"
    ]
  },
  "after": {
    "claimId": "claim_04703f011b22383992b94545055b9e56",
    "sourcePath": "docs/specs/confinement-authority.md",
    "sourceUnitDigest": "12018d6ddfb98564eca2e0dbd9267ffa859e1e5e69c11db3f506886fa0ab717c",
    "disposition": "supersede",
    "targetOwner": "docs/specs/confinement-authority.md",
    "targetAnchor": "unheaded-block-145",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewStatus": "pending",
    "rationale": "A31 exact upstream/candidate restoration successor: the old native identity gap is conserved by the complete same-file current unit shown in the main/import diff. No guessed identity graft or carried approval; code truth and the future batch source disposition remain separate. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. L10-21: content-based rebind from reviewed prior target unheaded-block-144 (f0b5e6c1688beadf7d5f7bbe985a9b46c27990ea720f3a6bbbe3a8df9806dad3) to unheaded-block-145 (f0b5e6c1688beadf7d5f7bbe985a9b46c27990ea720f3a6bbbe3a8df9806dad3); inserted paragraphs shift the anchor, prior target text is unchanged.",
    "targetUnitDigest": "f0b5e6c1688beadf7d5f7bbe985a9b46c27990ea720f3a6bbbe3a8df9806dad3",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)",
      "13.2 Login được gia hạn trong private home: bản chép là snapshot, bản mới hơn được ghi ngược"
    ]
  },
  "prior": {
    "claimId": "claim_04703f011b22383992b94545055b9e56",
    "sourcePath": "docs/specs/confinement-authority.md",
    "sourceUnitDigest": "12018d6ddfb98564eca2e0dbd9267ffa859e1e5e69c11db3f506886fa0ab717c",
    "disposition": "supersede",
    "targetOwner": "docs/specs/confinement-authority.md",
    "targetAnchor": "unheaded-block-144",
    "authoredBy": "codex-session:15@2026-10-14",
    "reviewStatus": "reviewed",
    "rationale": "A31 exact upstream/candidate restoration successor: the old native identity gap is conserved by the complete same-file current unit shown in the main/import diff. No guessed identity graft or carried approval; code truth and the future batch source disposition remain separate.",
    "reviewNote": "Pre-merge confinement#144 (12018d6d) superseded by f0b5e6c1; main's diff replaces only the word account with the per-store phrase, so nothing is lost; the word candidate in the rationale is boilerplate since no candidate carrier exists here, harmless",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-14",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-5-root-authorities-boundary-gaps.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "f0b5e6c1688beadf7d5f7bbe985a9b46c27990ea720f3a6bbbe3a8df9806dad3",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)",
      "13.2 Login được gia hạn trong private home: bản chép là snapshot, bản mới hơn được ghi ngược"
    ],
    "reviewReportCommit": "4f99b9ec9eaf90f9db38e9073f92ca76c6808d1e"
  },
  "targetWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-145",
    "githubAnchor": "unheaded-block-145",
    "stableAnchor": "unheaded-block-145",
    "title": "Unheaded block 145",
    "startLine": 1371,
    "endLine": 1372,
    "textDigest": "f0b5e6c1688beadf7d5f7bbe985a9b46c27990ea720f3a6bbbe3a8df9806dad3",
    "sample": "- **Kho SQLite chép dạng snapshot.** File `agent.db` (omp) trong danh sách `files` được chép bằng `VACUUM INTO` qua `node:sqlite` — snapshot nhất quán, gồm cả phần còn nằm trong wr",
    "identityFingerprint": "3b2449b1edc267a1157f77e25028c3045a65714309624b194d36cb5f286383bd",
    "ancestry": [
      "Spec: Agent Confinement Authority",
      "13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)",
      "13.2 Login được gia hạn trong private home: bản chép là snapshot, bản mới hơn được ghi ngược"
    ],
    "text": "- **Kho SQLite chép dạng snapshot.** File `agent.db` (omp) trong danh sách `files` được chép bằng `VACUUM INTO` qua `node:sqlite` — snapshot nhất quán, gồm cả phần còn nằm trong write-ahead log — thay vì chép file thô thiếu WAL; không có `node:sqlite` thì chép file như trước. Danh sách file được phép chép không đổi, thư mục account thật vẫn không bao giờ được mount.\n- **Bản mới hơn được ghi ngược lúc xoá home.** Khi dispatch được opt-in (caller truyền hàm gia hạn), ownership marker của private home ghi thêm `credentialWriteBack` (provider, account, home nguồn, layout, runtime dir; chỉ tên và đường dẫn, không giá trị credential) sau khi chép xong. Mọi đường xoá home — cleanup của driver, `finalizeConfinementResources` và orphan reaper — đi qua một hàm xoá duy nhất (`removeConfinementDir`, `confinement/cleanup.mjs`): trước khi xoá, login trong home mới hơn login nguồn thì được dàn (staging) rồi áp lên nguồn dưới lock của account, một lần thử không chờ; lock bận thì để `pending/` cho lần refresh-ahead kế tiếp. Lỗi ghi ngược chỉ báo bằng mã cố định trên stderr và chỉ chặn việc xoá trong đúng một trường hợp: việc dàn thất bại (xem dưới). Bản dàn không bao giờ bị xoá khi nguồn không đọc được (đang ghi dở, `agent.db` không mở được, hoặc không xác định được entry) hay khi bản chép không đọc được vì lý do có thể qua (thiếu `node:sqlite`, `agent.db` không mở được): bản chép được giữ ở `pending/` (giới hạn 5 bản mỗi kho login (mỗi account với một kho, mỗi `stores/<cli>` với kho theo CLI), nhưng chỉ bản dư thừa mới bị bỏ: sau khi áp các bản pending dưới account lock, bản có login trùng hệt một bản pending khác thì bị bỏ khi account vượt giới hạn, bản mới nhất của mỗi nhóm trùng được giữ; bản không chứng minh được là dư thừa hay lỗi thời thì không bao giờ bị bỏ để nhường chỗ, nên account có thể vượt giới hạn và check doctor báo; bản do probe ghi dở được giữ ở `torn/` cho việc khôi phục thủ công, không bao giờ tự áp hay tự bỏ, và doctor báo ở mọi tuổi; `torn/` chỉ áp cho bản scratch của probe, còn scratch do runner đã chết để lại và pane home có store bị cắt vẫn bị xoá khi JSON không đọc được; bản không parse được thì so theo byte của file store và của write-ahead log hoặc rollback journal không rỗng (file không đọc được, trừ khi không tồn tại, không bao giờ bị coi là không có; index `-shm` không tính); home có file store trùng từng byte với nguồn và không bên nào có write-ahead log hay journal không rỗng thì không renew gì nên không được dàn) và báo `staged`/`apply-deferred`; chỉ xoá khi nguồn đọc được và chứng minh bản chép không mới hơn, hoặc bản chép được chứng minh hỏng (JSON hỏng, hay không có entry dùng được). Lỗi đọc file của hệ điều hành (quyền, I/O; mã `unreadable-file`) có thể qua nên bản chép được giữ; chỉ file kho không tồn tại (`missing-file`) mới được coi là rỗng và bị xoá. Nếu việc dàn thất bại, private home và marker được giữ lại (việc xoá báo lỗi, một dòng stderr mã cố định) để lần xoá sau, kể cả của reaper, thử lại; mỗi lần thất bại được đếm trong marker (`credentialKept`; hai lần cách nhau dưới 15 phút chỉ tính một, để lỗi tạm thời không dùng hết hạn mức), marker được ghi qua file tạm rồi rename và marker có mặt nhưng đọc không được thì việc xoá dừng lại. Sau 5 lần home bị giữ hẳn: không thử xoá nữa, không bao giờ bị xoá vì quá tuổi. Home bị giữ được kiểm lại dưới account lock khi account đó được gia hạn lần kế tiếp và bởi `fgos doctor --fix` (tập temp root tìm kiếm giống của doctor: root mặc định cộng `tempRoot` của từng backend đã đăng ký, lấy qua hook do phía dispatch truyền xuống; home nằm dưới `privateHomeRoot` riêng của backend không thuộc tập này nên không check, repair, reaper hay lần gia hạn nào thấy, và cũng không bao giờ bị xoá), và chỉ với home thuộc đúng runtime dir của lock đang giữ: chỉ xoá khi nguồn đọc được và chứng minh login trong home không mới hơn, hoặc login đó đã dàn được cạnh nguồn (và được áp); không thì vẫn giữ. Bản đã dàn và thư mục `pending/` được đồng bộ xuống đĩa trước khi home bị xoá. File marker không nhận ra được là marker nào cả (không phải JSON, không phải object, hay không có tên contract) thì mọi việc xoá home đó dừng lại. Finalizer so digest của marker không tính `credentialKept` (cleanup của driver thêm trường này sau khi digest được lấy) và không dừng ở home đó mà vẫn xoá các resource còn lại của dispatch (dispatch ghi là `retained`, kèm lý do của home). Check `credential-copies-retained` của `fgos doctor` báo theo provider/account: home bị giữ hẳn (fail, nêu thư mục home), home đang thử lại và các bản `pending/`/scratch quá một ngày (cảnh báo); chỉ có số đếm và tuổi, không bao giờ in giá trị, và check không xoá gì. Provisioning Codex đóng kín (fail closed): `auth.json` là symlink trỏ ra ngoài home, hoặc `home` tương đối, làm dispatch thất bại trước khi worker chạy (trước đây symlink được theo, home tương đối được hiểu theo cwd). Đường xoá home gọi module gia hạn credential (`provider-credential-renewal.mjs`) và qua đó phụ thuộc vào provider capacity, chỉ để lấy account lock. Home không có field này được xoá y như trước."
  },
  "relatedClaimId": "claim_04703f011b22383992b94545055b9e56",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_04703f011b22383992b94545055b9e56",
    "sourcePath": "docs/specs/confinement-authority.md",
    "sourceUnitDigest": "12018d6ddfb98564eca2e0dbd9267ffa859e1e5e69c11db3f506886fa0ab717c",
    "disposition": "supersede",
    "targetOwner": "docs/specs/confinement-authority.md",
    "targetAnchor": "unheaded-block-145",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewStatus": "pending",
    "rationale": "A31 exact upstream/candidate restoration successor: the old native identity gap is conserved by the complete same-file current unit shown in the main/import diff. No guessed identity graft or carried approval; code truth and the future batch source disposition remain separate. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. L10-21: content-based rebind from reviewed prior target unheaded-block-144 (f0b5e6c1688beadf7d5f7bbe985a9b46c27990ea720f3a6bbbe3a8df9806dad3) to unheaded-block-145 (f0b5e6c1688beadf7d5f7bbe985a9b46c27990ea720f3a6bbbe3a8df9806dad3); inserted paragraphs shift the anchor, prior target text is unchanged.",
    "targetUnitDigest": "f0b5e6c1688beadf7d5f7bbe985a9b46c27990ea720f3a6bbbe3a8df9806dad3",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)",
      "13.2 Login được gia hạn trong private home: bản chép là snapshot, bản mới hơn được ghi ngược"
    ]
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-145",
    "githubAnchor": "unheaded-block-145",
    "stableAnchor": "unheaded-block-145",
    "title": "Unheaded block 145",
    "startLine": 1371,
    "endLine": 1372,
    "textDigest": "f0b5e6c1688beadf7d5f7bbe985a9b46c27990ea720f3a6bbbe3a8df9806dad3",
    "sample": "- **Kho SQLite chép dạng snapshot.** File `agent.db` (omp) trong danh sách `files` được chép bằng `VACUUM INTO` qua `node:sqlite` — snapshot nhất quán, gồm cả phần còn nằm trong wr",
    "identityFingerprint": "3b2449b1edc267a1157f77e25028c3045a65714309624b194d36cb5f286383bd",
    "ancestry": [
      "Spec: Agent Confinement Authority",
      "13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)",
      "13.2 Login được gia hạn trong private home: bản chép là snapshot, bản mới hơn được ghi ngược"
    ],
    "text": "- **Kho SQLite chép dạng snapshot.** File `agent.db` (omp) trong danh sách `files` được chép bằng `VACUUM INTO` qua `node:sqlite` — snapshot nhất quán, gồm cả phần còn nằm trong write-ahead log — thay vì chép file thô thiếu WAL; không có `node:sqlite` thì chép file như trước. Danh sách file được phép chép không đổi, thư mục account thật vẫn không bao giờ được mount.\n- **Bản mới hơn được ghi ngược lúc xoá home.** Khi dispatch được opt-in (caller truyền hàm gia hạn), ownership marker của private home ghi thêm `credentialWriteBack` (provider, account, home nguồn, layout, runtime dir; chỉ tên và đường dẫn, không giá trị credential) sau khi chép xong. Mọi đường xoá home — cleanup của driver, `finalizeConfinementResources` và orphan reaper — đi qua một hàm xoá duy nhất (`removeConfinementDir`, `confinement/cleanup.mjs`): trước khi xoá, login trong home mới hơn login nguồn thì được dàn (staging) rồi áp lên nguồn dưới lock của account, một lần thử không chờ; lock bận thì để `pending/` cho lần refresh-ahead kế tiếp. Lỗi ghi ngược chỉ báo bằng mã cố định trên stderr và chỉ chặn việc xoá trong đúng một trường hợp: việc dàn thất bại (xem dưới). Bản dàn không bao giờ bị xoá khi nguồn không đọc được (đang ghi dở, `agent.db` không mở được, hoặc không xác định được entry) hay khi bản chép không đọc được vì lý do có thể qua (thiếu `node:sqlite`, `agent.db` không mở được): bản chép được giữ ở `pending/` (giới hạn 5 bản mỗi kho login (mỗi account với một kho, mỗi `stores/<cli>` với kho theo CLI), nhưng chỉ bản dư thừa mới bị bỏ: sau khi áp các bản pending dưới account lock, bản có login trùng hệt một bản pending khác thì bị bỏ khi account vượt giới hạn, bản mới nhất của mỗi nhóm trùng được giữ; bản không chứng minh được là dư thừa hay lỗi thời thì không bao giờ bị bỏ để nhường chỗ, nên account có thể vượt giới hạn và check doctor báo; bản do probe ghi dở được giữ ở `torn/` cho việc khôi phục thủ công, không bao giờ tự áp hay tự bỏ, và doctor báo ở mọi tuổi; `torn/` chỉ áp cho bản scratch của probe, còn scratch do runner đã chết để lại và pane home có store bị cắt vẫn bị xoá khi JSON không đọc được; bản không parse được thì so theo byte của file store và của write-ahead log hoặc rollback journal không rỗng (file không đọc được, trừ khi không tồn tại, không bao giờ bị coi là không có; index `-shm` không tính); home có file store trùng từng byte với nguồn và không bên nào có write-ahead log hay journal không rỗng thì không renew gì nên không được dàn) và báo `staged`/`apply-deferred`; chỉ xoá khi nguồn đọc được và chứng minh bản chép không mới hơn, hoặc bản chép được chứng minh hỏng (JSON hỏng, hay không có entry dùng được). Lỗi đọc file của hệ điều hành (quyền, I/O; mã `unreadable-file`) có thể qua nên bản chép được giữ; chỉ file kho không tồn tại (`missing-file`) mới được coi là rỗng và bị xoá. Nếu việc dàn thất bại, private home và marker được giữ lại (việc xoá báo lỗi, một dòng stderr mã cố định) để lần xoá sau, kể cả của reaper, thử lại; mỗi lần thất bại được đếm trong marker (`credentialKept`; hai lần cách nhau dưới 15 phút chỉ tính một, để lỗi tạm thời không dùng hết hạn mức), marker được ghi qua file tạm rồi rename và marker có mặt nhưng đọc không được thì việc xoá dừng lại. Sau 5 lần home bị giữ hẳn: không thử xoá nữa, không bao giờ bị xoá vì quá tuổi. Home bị giữ được kiểm lại dưới account lock khi account đó được gia hạn lần kế tiếp và bởi `fgos doctor --fix` (tập temp root tìm kiếm giống của doctor: root mặc định cộng `tempRoot` của từng backend đã đăng ký, lấy qua hook do phía dispatch truyền xuống; home nằm dưới `privateHomeRoot` riêng của backend không thuộc tập này nên không check, repair, reaper hay lần gia hạn nào thấy, và cũng không bao giờ bị xoá), và chỉ với home thuộc đúng runtime dir của lock đang giữ: chỉ xoá khi nguồn đọc được và chứng minh login trong home không mới hơn, hoặc login đó đã dàn được cạnh nguồn (và được áp); không thì vẫn giữ. Bản đã dàn và thư mục `pending/` được đồng bộ xuống đĩa trước khi home bị xoá. File marker không nhận ra được là marker nào cả (không phải JSON, không phải object, hay không có tên contract) thì mọi việc xoá home đó dừng lại. Finalizer so digest của marker không tính `credentialKept` (cleanup của driver thêm trường này sau khi digest được lấy) và không dừng ở home đó mà vẫn xoá các resource còn lại của dispatch (dispatch ghi là `retained`, kèm lý do của home). Check `credential-copies-retained` của `fgos doctor` báo theo provider/account: home bị giữ hẳn (fail, nêu thư mục home), home đang thử lại và các bản `pending/`/scratch quá một ngày (cảnh báo); chỉ có số đếm và tuổi, không bao giờ in giá trị, và check không xoá gì. Provisioning Codex đóng kín (fail closed): `auth.json` là symlink trỏ ra ngoài home, hoặc `home` tương đối, làm dispatch thất bại trước khi worker chạy (trước đây symlink được theo, home tương đối được hiểu theo cwd). Đường xoá home gọi module gia hạn credential (`provider-credential-renewal.mjs`) và qua đó phụ thuộc vào provider capacity, chỉ để lấy account lock. Home không có field này được xoá y như trước."
  },
  "oldAnchor": "unheaded-block-144",
  "newAnchor": "unheaded-block-145",
  "oldDigest": "f0b5e6c1688beadf7d5f7bbe985a9b46c27990ea720f3a6bbbe3a8df9806dad3",
  "newDigest": "f0b5e6c1688beadf7d5f7bbe985a9b46c27990ea720f3a6bbbe3a8df9806dad3",
  "deepRequired": true,
  "helper": "scripts/doc-binding-repair.mjs",
  "contentProof": {
    "priorCommit": "ab4d6274a",
    "priorMatchingUnits": [
      {
        "unitKind": "unheaded-block",
        "anchor": "unheaded-block-145",
        "githubAnchor": "unheaded-block-145",
        "stableAnchor": "unheaded-block-145",
        "title": "Unheaded block 145",
        "startLine": 1371,
        "endLine": 1372,
        "textDigest": "f0b5e6c1688beadf7d5f7bbe985a9b46c27990ea720f3a6bbbe3a8df9806dad3",
        "sample": "- **Kho SQLite chép dạng snapshot.** File `agent.db` (omp) trong danh sách `files` được chép bằng `VACUUM INTO` qua `node:sqlite` — snapshot nhất quán, gồm cả phần còn nằm trong wr",
        "identityFingerprint": "3b2449b1edc267a1157f77e25028c3045a65714309624b194d36cb5f286383bd",
        "ancestry": [
          "Spec: Agent Confinement Authority",
          "13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)",
          "13.2 Login được gia hạn trong private home: bản chép là snapshot, bản mới hơn được ghi ngược"
        ],
        "text": "- **Kho SQLite chép dạng snapshot.** File `agent.db` (omp) trong danh sách `files` được chép bằng `VACUUM INTO` qua `node:sqlite` — snapshot nhất quán, gồm cả phần còn nằm trong write-ahead log — thay vì chép file thô thiếu WAL; không có `node:sqlite` thì chép file như trước. Danh sách file được phép chép không đổi, thư mục account thật vẫn không bao giờ được mount.\n- **Bản mới hơn được ghi ngược lúc xoá home.** Khi dispatch được opt-in (caller truyền hàm gia hạn), ownership marker của private home ghi thêm `credentialWriteBack` (provider, account, home nguồn, layout, runtime dir; chỉ tên và đường dẫn, không giá trị credential) sau khi chép xong. Mọi đường xoá home — cleanup của driver, `finalizeConfinementResources` và orphan reaper — đi qua một hàm xoá duy nhất (`removeConfinementDir`, `confinement/cleanup.mjs`): trước khi xoá, login trong home mới hơn login nguồn thì được dàn (staging) rồi áp lên nguồn dưới lock của account, một lần thử không chờ; lock bận thì để `pending/` cho lần refresh-ahead kế tiếp. Lỗi ghi ngược chỉ báo bằng mã cố định trên stderr và chỉ chặn việc xoá trong đúng một trường hợp: việc dàn thất bại (xem dưới). Bản dàn không bao giờ bị xoá khi nguồn không đọc được (đang ghi dở, `agent.db` không mở được, hoặc không xác định được entry) hay khi bản chép không đọc được vì lý do có thể qua (thiếu `node:sqlite`, `agent.db` không mở được): bản chép được giữ ở `pending/` (giới hạn 5 bản mỗi kho login (mỗi account với một kho, mỗi `stores/<cli>` với kho theo CLI), nhưng chỉ bản dư thừa mới bị bỏ: sau khi áp các bản pending dưới account lock, bản có login trùng hệt một bản pending khác thì bị bỏ khi account vượt giới hạn, bản mới nhất của mỗi nhóm trùng được giữ; bản không chứng minh được là dư thừa hay lỗi thời thì không bao giờ bị bỏ để nhường chỗ, nên account có thể vượt giới hạn và check doctor báo; bản do probe ghi dở được giữ ở `torn/` cho việc khôi phục thủ công, không bao giờ tự áp hay tự bỏ, và doctor báo ở mọi tuổi; `torn/` chỉ áp cho bản scratch của probe, còn scratch do runner đã chết để lại và pane home có store bị cắt vẫn bị xoá khi JSON không đọc được; bản không parse được thì so theo byte của file store và của write-ahead log hoặc rollback journal không rỗng (file không đọc được, trừ khi không tồn tại, không bao giờ bị coi là không có; index `-shm` không tính); home có file store trùng từng byte với nguồn và không bên nào có write-ahead log hay journal không rỗng thì không renew gì nên không được dàn) và báo `staged`/`apply-deferred`; chỉ xoá khi nguồn đọc được và chứng minh bản chép không mới hơn, hoặc bản chép được chứng minh hỏng (JSON hỏng, hay không có entry dùng được). Lỗi đọc file của hệ điều hành (quyền, I/O; mã `unreadable-file`) có thể qua nên bản chép được giữ; chỉ file kho không tồn tại (`missing-file`) mới được coi là rỗng và bị xoá. Nếu việc dàn thất bại, private home và marker được giữ lại (việc xoá báo lỗi, một dòng stderr mã cố định) để lần xoá sau, kể cả của reaper, thử lại; mỗi lần thất bại được đếm trong marker (`credentialKept`; hai lần cách nhau dưới 15 phút chỉ tính một, để lỗi tạm thời không dùng hết hạn mức), marker được ghi qua file tạm rồi rename và marker có mặt nhưng đọc không được thì việc xoá dừng lại. Sau 5 lần home bị giữ hẳn: không thử xoá nữa, không bao giờ bị xoá vì quá tuổi. Home bị giữ được kiểm lại dưới account lock khi account đó được gia hạn lần kế tiếp và bởi `fgos doctor --fix` (tập temp root tìm kiếm giống của doctor: root mặc định cộng `tempRoot` của từng backend đã đăng ký, lấy qua hook do phía dispatch truyền xuống; home nằm dưới `privateHomeRoot` riêng của backend không thuộc tập này nên không check, repair, reaper hay lần gia hạn nào thấy, và cũng không bao giờ bị xoá), và chỉ với home thuộc đúng runtime dir của lock đang giữ: chỉ xoá khi nguồn đọc được và chứng minh login trong home không mới hơn, hoặc login đó đã dàn được cạnh nguồn (và được áp); không thì vẫn giữ. Bản đã dàn và thư mục `pending/` được đồng bộ xuống đĩa trước khi home bị xoá. File marker không nhận ra được là marker nào cả (không phải JSON, không phải object, hay không có tên contract) thì mọi việc xoá home đó dừng lại. Finalizer so digest của marker không tính `credentialKept` (cleanup của driver thêm trường này sau khi digest được lấy) và không dừng ở home đó mà vẫn xoá các resource còn lại của dispatch (dispatch ghi là `retained`, kèm lý do của home). Check `credential-copies-retained` của `fgos doctor` báo theo provider/account: home bị giữ hẳn (fail, nêu thư mục home), home đang thử lại và các bản `pending/`/scratch quá một ngày (cảnh báo); chỉ có số đếm và tuổi, không bao giờ in giá trị, và check không xoá gì. Provisioning Codex đóng kín (fail closed): `auth.json` là symlink trỏ ra ngoài home, hoặc `home` tương đối, làm dispatch thất bại trước khi worker chạy (trước đây symlink được theo, home tương đối được hiểu theo cwd). Đường xoá home gọi module gia hạn credential (`provider-credential-renewal.mjs`) và qua đó phụ thuộc vào provider capacity, chỉ để lấy account lock. Home không có field này được xoá y như trước."
      }
    ],
    "currentText": "- **Kho SQLite chép dạng snapshot.** File `agent.db` (omp) trong danh sách `files` được chép bằng `VACUUM INTO` qua `node:sqlite` — snapshot nhất quán, gồm cả phần còn nằm trong write-ahead log — thay vì chép file thô thiếu WAL; không có `node:sqlite` thì chép file như trước. Danh sách file được phép chép không đổi, thư mục account thật vẫn không bao giờ được mount.\n- **Bản mới hơn được ghi ngược lúc xoá home.** Khi dispatch được opt-in (caller truyền hàm gia hạn), ownership marker của private home ghi thêm `credentialWriteBack` (provider, account, home nguồn, layout, runtime dir; chỉ tên và đường dẫn, không giá trị credential) sau khi chép xong. Mọi đường xoá home — cleanup của driver, `finalizeConfinementResources` và orphan reaper — đi qua một hàm xoá duy nhất (`removeConfinementDir`, `confinement/cleanup.mjs`): trước khi xoá, login trong home mới hơn login nguồn thì được dàn (staging) rồi áp lên nguồn dưới lock của account, một lần thử không chờ; lock bận thì để `pending/` cho lần refresh-ahead kế tiếp. Lỗi ghi ngược chỉ báo bằng mã cố định trên stderr và chỉ chặn việc xoá trong đúng một trường hợp: việc dàn thất bại (xem dưới). Bản dàn không bao giờ bị xoá khi nguồn không đọc được (đang ghi dở, `agent.db` không mở được, hoặc không xác định được entry) hay khi bản chép không đọc được vì lý do có thể qua (thiếu `node:sqlite`, `agent.db` không mở được): bản chép được giữ ở `pending/` (giới hạn 5 bản mỗi kho login (mỗi account với một kho, mỗi `stores/<cli>` với kho theo CLI), nhưng chỉ bản dư thừa mới bị bỏ: sau khi áp các bản pending dưới account lock, bản có login trùng hệt một bản pending khác thì bị bỏ khi account vượt giới hạn, bản mới nhất của mỗi nhóm trùng được giữ; bản không chứng minh được là dư thừa hay lỗi thời thì không bao giờ bị bỏ để nhường chỗ, nên account có thể vượt giới hạn và check doctor báo; bản do probe ghi dở được giữ ở `torn/` cho việc khôi phục thủ công, không bao giờ tự áp hay tự bỏ, và doctor báo ở mọi tuổi; `torn/` chỉ áp cho bản scratch của probe, còn scratch do runner đã chết để lại và pane home có store bị cắt vẫn bị xoá khi JSON không đọc được; bản không parse được thì so theo byte của file store và của write-ahead log hoặc rollback journal không rỗng (file không đọc được, trừ khi không tồn tại, không bao giờ bị coi là không có; index `-shm` không tính); home có file store trùng từng byte với nguồn và không bên nào có write-ahead log hay journal không rỗng thì không renew gì nên không được dàn) và báo `staged`/`apply-deferred`; chỉ xoá khi nguồn đọc được và chứng minh bản chép không mới hơn, hoặc bản chép được chứng minh hỏng (JSON hỏng, hay không có entry dùng được). Lỗi đọc file của hệ điều hành (quyền, I/O; mã `unreadable-file`) có thể qua nên bản chép được giữ; chỉ file kho không tồn tại (`missing-file`) mới được coi là rỗng và bị xoá. Nếu việc dàn thất bại, private home và marker được giữ lại (việc xoá báo lỗi, một dòng stderr mã cố định) để lần xoá sau, kể cả của reaper, thử lại; mỗi lần thất bại được đếm trong marker (`credentialKept`; hai lần cách nhau dưới 15 phút chỉ tính một, để lỗi tạm thời không dùng hết hạn mức), marker được ghi qua file tạm rồi rename và marker có mặt nhưng đọc không được thì việc xoá dừng lại. Sau 5 lần home bị giữ hẳn: không thử xoá nữa, không bao giờ bị xoá vì quá tuổi. Home bị giữ được kiểm lại dưới account lock khi account đó được gia hạn lần kế tiếp và bởi `fgos doctor --fix` (tập temp root tìm kiếm giống của doctor: root mặc định cộng `tempRoot` của từng backend đã đăng ký, lấy qua hook do phía dispatch truyền xuống; home nằm dưới `privateHomeRoot` riêng của backend không thuộc tập này nên không check, repair, reaper hay lần gia hạn nào thấy, và cũng không bao giờ bị xoá), và chỉ với home thuộc đúng runtime dir của lock đang giữ: chỉ xoá khi nguồn đọc được và chứng minh login trong home không mới hơn, hoặc login đó đã dàn được cạnh nguồn (và được áp); không thì vẫn giữ. Bản đã dàn và thư mục `pending/` được đồng bộ xuống đĩa trước khi home bị xoá. File marker không nhận ra được là marker nào cả (không phải JSON, không phải object, hay không có tên contract) thì mọi việc xoá home đó dừng lại. Finalizer so digest của marker không tính `credentialKept` (cleanup của driver thêm trường này sau khi digest được lấy) và không dừng ở home đó mà vẫn xoá các resource còn lại của dispatch (dispatch ghi là `retained`, kèm lý do của home). Check `credential-copies-retained` của `fgos doctor` báo theo provider/account: home bị giữ hẳn (fail, nêu thư mục home), home đang thử lại và các bản `pending/`/scratch quá một ngày (cảnh báo); chỉ có số đếm và tuổi, không bao giờ in giá trị, và check không xoá gì. Provisioning Codex đóng kín (fail closed): `auth.json` là symlink trỏ ra ngoài home, hoặc `home` tương đối, làm dispatch thất bại trước khi worker chạy (trước đây symlink được theo, home tương đối được hiểu theo cwd). Đường xoá home gọi module gia hạn credential (`provider-credential-renewal.mjs`) và qua đó phụ thuộc vào provider capacity, chỉ để lấy account lock. Home không có field này được xoá y như trước.",
    "allPriorMatchingTextsEqualCurrent": true,
    "helperReplayed": true
  },
  "reviewScope": "Re-anchor receipt; claim verdict belongs to decisions section.",
  "packagedBy": "codex-session:unit-run-1792094246578-b2fbe39b@2026-10-16",
  "currentContentCommit": "345f15d95663260976200be66d1b9a6c648bcd6d",
  "entryId": "anchors-022"
}
```

## Entry anchors-023

```json
{
  "kind": "content-reanchoring-proof",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s5-root-authorities-sc1-gaps.json",
  "collection": "registryGaps",
  "before": {
    "claimId": "claim_4a023fa2faa879fb0e1dfd8bc5c051e7",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "sourceUnitDigest": "857ad2167a0283ad4b9f08a4493f324f899b84211e10234b9d0eddfb9683c63f",
    "disposition": "supersede",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-33",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewStatus": "pending",
    "rationale": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetUnitDigest": "51dd3c8aa026a8f5a15e4c12c522b3bf2ad7c29238c49bf9ba51324806e10e23",
    "targetAncestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Manifest Shape"
    ]
  },
  "after": {
    "claimId": "claim_4a023fa2faa879fb0e1dfd8bc5c051e7",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "sourceUnitDigest": "857ad2167a0283ad4b9f08a4493f324f899b84211e10234b9d0eddfb9683c63f",
    "disposition": "supersede",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-34",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewStatus": "pending",
    "rationale": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. L10-21: content-based rebind from reviewed prior target unheaded-block-33 (0b3d8cfa5bd06f2dc735968a1297d8567d8f78a6257cf8aed0b0611067e870a2) to unheaded-block-34 (0b3d8cfa5bd06f2dc735968a1297d8567d8f78a6257cf8aed0b0611067e870a2); inserted paragraphs shift the anchor, prior target text is unchanged.",
    "targetUnitDigest": "0b3d8cfa5bd06f2dc735968a1297d8567d8f78a6257cf8aed0b0611067e870a2",
    "targetAncestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Entry Fields And Effect Axes"
    ]
  },
  "prior": {
    "claimId": "claim_4a023fa2faa879fb0e1dfd8bc5c051e7",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "sourceUnitDigest": "857ad2167a0283ad4b9f08a4493f324f899b84211e10234b9d0eddfb9683c63f",
    "disposition": "supersede",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-33",
    "authoredBy": "codex-session:unit-run-1792052396770-6f1c5957@2026-10-15",
    "reviewStatus": "reviewed",
    "rationale": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover.",
    "reviewNote": "deep: gap row; old paragraph unit found at 9881f8622 block 31; successor effect-axis paragraph at block 33 digest 0b3d8cfa unchanged, anchor shift 32 to 33 only; word diff old to target read (one sentence of the externalEffect list differs); mapping and disposition unchanged from the reviewed decision",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-15",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-261015-1526-specs-ui-reworks-main-recarry.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "0b3d8cfa5bd06f2dc735968a1297d8567d8f78a6257cf8aed0b0611067e870a2",
    "targetAncestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Entry Fields And Effect Axes"
    ],
    "reviewReportCommit": "0e8ce7710ac67ad038927b242b2461876bf8c90d"
  },
  "targetWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-34",
    "githubAnchor": "unheaded-block-34",
    "stableAnchor": "unheaded-block-34",
    "title": "Unheaded block 34",
    "startLine": 310,
    "endLine": 320,
    "textDigest": "0b3d8cfa5bd06f2dc735968a1297d8567d8f78a6257cf8aed0b0611067e870a2",
    "sample": "**Hai trục thay cho `access` (per str46-io-contract).** Cờ `access`\nđơn (`read` hay `mutation`) từng gộp hai câu hỏi khác nhau vào một giá trị —\nlộ rõ khi `review` khai `mutation` ",
    "identityFingerprint": "abdaf7574d8107b6e5d325a95cb8c7327dac1248939788580176154fa990dace",
    "ancestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Entry Fields And Effect Axes"
    ],
    "text": "**Hai trục thay cho `access` (per str46-io-contract).** Cờ `access`\nđơn (`read` hay `mutation`) từng gộp hai câu hỏi khác nhau vào một giá trị —\nlộ rõ khi `review` khai `mutation` chỉ vì chế độ `--github` của nó tạo một\nPR thật, dù bản thân `review` (không `--github`) không hề đổi trạng thái\nfgOS. Sổ verb nay tách thành **hai trường độc lập**: `touchesState`\n(verb có bao giờ ghi trạng thái fgOS hay không) và `externalEffect` (verb\ncó bao giờ gọi một dịch vụ ngoài fgOS hay không — danh sách hiện hành mang `externalEffect: true` lấy từ manifest `COMMAND_REGISTRY` qua `fgos --help --json`: 15 verb, không có `coordination` (ví dụ `review`, `approve`, `run` — dispatch executor thật tính là effect ngoài `.fgos/`);\n`review` mang `touchesState: false` vì nó không bao giờ ghi trạng thái, kể\ncả qua `--github`). Cả hai cờ vẫn thuần **khai báo** — chưa nối vào điều\nphối hay xác danh; cổng \"ai được nói verb nào\" vẫn là việc riêng sau này\n(backlog STR38)."
  },
  "relatedClaimId": "claim_4a023fa2faa879fb0e1dfd8bc5c051e7",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_4a023fa2faa879fb0e1dfd8bc5c051e7",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "sourceUnitDigest": "857ad2167a0283ad4b9f08a4493f324f899b84211e10234b9d0eddfb9683c63f",
    "disposition": "supersede",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-34",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewStatus": "pending",
    "rationale": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. L10-21: content-based rebind from reviewed prior target unheaded-block-33 (0b3d8cfa5bd06f2dc735968a1297d8567d8f78a6257cf8aed0b0611067e870a2) to unheaded-block-34 (0b3d8cfa5bd06f2dc735968a1297d8567d8f78a6257cf8aed0b0611067e870a2); inserted paragraphs shift the anchor, prior target text is unchanged.",
    "targetUnitDigest": "0b3d8cfa5bd06f2dc735968a1297d8567d8f78a6257cf8aed0b0611067e870a2",
    "targetAncestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Entry Fields And Effect Axes"
    ]
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-34",
    "githubAnchor": "unheaded-block-34",
    "stableAnchor": "unheaded-block-34",
    "title": "Unheaded block 34",
    "startLine": 310,
    "endLine": 320,
    "textDigest": "0b3d8cfa5bd06f2dc735968a1297d8567d8f78a6257cf8aed0b0611067e870a2",
    "sample": "**Hai trục thay cho `access` (per str46-io-contract).** Cờ `access`\nđơn (`read` hay `mutation`) từng gộp hai câu hỏi khác nhau vào một giá trị —\nlộ rõ khi `review` khai `mutation` ",
    "identityFingerprint": "abdaf7574d8107b6e5d325a95cb8c7327dac1248939788580176154fa990dace",
    "ancestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Entry Fields And Effect Axes"
    ],
    "text": "**Hai trục thay cho `access` (per str46-io-contract).** Cờ `access`\nđơn (`read` hay `mutation`) từng gộp hai câu hỏi khác nhau vào một giá trị —\nlộ rõ khi `review` khai `mutation` chỉ vì chế độ `--github` của nó tạo một\nPR thật, dù bản thân `review` (không `--github`) không hề đổi trạng thái\nfgOS. Sổ verb nay tách thành **hai trường độc lập**: `touchesState`\n(verb có bao giờ ghi trạng thái fgOS hay không) và `externalEffect` (verb\ncó bao giờ gọi một dịch vụ ngoài fgOS hay không — danh sách hiện hành mang `externalEffect: true` lấy từ manifest `COMMAND_REGISTRY` qua `fgos --help --json`: 15 verb, không có `coordination` (ví dụ `review`, `approve`, `run` — dispatch executor thật tính là effect ngoài `.fgos/`);\n`review` mang `touchesState: false` vì nó không bao giờ ghi trạng thái, kể\ncả qua `--github`). Cả hai cờ vẫn thuần **khai báo** — chưa nối vào điều\nphối hay xác danh; cổng \"ai được nói verb nào\" vẫn là việc riêng sau này\n(backlog STR38)."
  },
  "oldAnchor": "unheaded-block-33",
  "newAnchor": "unheaded-block-34",
  "oldDigest": "0b3d8cfa5bd06f2dc735968a1297d8567d8f78a6257cf8aed0b0611067e870a2",
  "newDigest": "0b3d8cfa5bd06f2dc735968a1297d8567d8f78a6257cf8aed0b0611067e870a2",
  "deepRequired": true,
  "helper": "scripts/doc-binding-repair.mjs",
  "contentProof": {
    "priorCommit": "ab4d6274a",
    "priorMatchingUnits": [
      {
        "unitKind": "unheaded-block",
        "anchor": "unheaded-block-33",
        "githubAnchor": "unheaded-block-33",
        "stableAnchor": "unheaded-block-33",
        "title": "Unheaded block 33",
        "startLine": 300,
        "endLine": 310,
        "textDigest": "0b3d8cfa5bd06f2dc735968a1297d8567d8f78a6257cf8aed0b0611067e870a2",
        "sample": "**Hai trục thay cho `access` (per str46-io-contract).** Cờ `access`\nđơn (`read` hay `mutation`) từng gộp hai câu hỏi khác nhau vào một giá trị —\nlộ rõ khi `review` khai `mutation` ",
        "identityFingerprint": "abdaf7574d8107b6e5d325a95cb8c7327dac1248939788580176154fa990dace",
        "ancestry": [
          "CLI I/O Contract",
          "7. Machine-Readable Verb Registry",
          "Entry Fields And Effect Axes"
        ],
        "text": "**Hai trục thay cho `access` (per str46-io-contract).** Cờ `access`\nđơn (`read` hay `mutation`) từng gộp hai câu hỏi khác nhau vào một giá trị —\nlộ rõ khi `review` khai `mutation` chỉ vì chế độ `--github` của nó tạo một\nPR thật, dù bản thân `review` (không `--github`) không hề đổi trạng thái\nfgOS. Sổ verb nay tách thành **hai trường độc lập**: `touchesState`\n(verb có bao giờ ghi trạng thái fgOS hay không) và `externalEffect` (verb\ncó bao giờ gọi một dịch vụ ngoài fgOS hay không — danh sách hiện hành mang `externalEffect: true` lấy từ manifest `COMMAND_REGISTRY` qua `fgos --help --json`: 15 verb, không có `coordination` (ví dụ `review`, `approve`, `run` — dispatch executor thật tính là effect ngoài `.fgos/`);\n`review` mang `touchesState: false` vì nó không bao giờ ghi trạng thái, kể\ncả qua `--github`). Cả hai cờ vẫn thuần **khai báo** — chưa nối vào điều\nphối hay xác danh; cổng \"ai được nói verb nào\" vẫn là việc riêng sau này\n(backlog STR38)."
      }
    ],
    "currentText": "**Hai trục thay cho `access` (per str46-io-contract).** Cờ `access`\nđơn (`read` hay `mutation`) từng gộp hai câu hỏi khác nhau vào một giá trị —\nlộ rõ khi `review` khai `mutation` chỉ vì chế độ `--github` của nó tạo một\nPR thật, dù bản thân `review` (không `--github`) không hề đổi trạng thái\nfgOS. Sổ verb nay tách thành **hai trường độc lập**: `touchesState`\n(verb có bao giờ ghi trạng thái fgOS hay không) và `externalEffect` (verb\ncó bao giờ gọi một dịch vụ ngoài fgOS hay không — danh sách hiện hành mang `externalEffect: true` lấy từ manifest `COMMAND_REGISTRY` qua `fgos --help --json`: 15 verb, không có `coordination` (ví dụ `review`, `approve`, `run` — dispatch executor thật tính là effect ngoài `.fgos/`);\n`review` mang `touchesState: false` vì nó không bao giờ ghi trạng thái, kể\ncả qua `--github`). Cả hai cờ vẫn thuần **khai báo** — chưa nối vào điều\nphối hay xác danh; cổng \"ai được nói verb nào\" vẫn là việc riêng sau này\n(backlog STR38).",
    "allPriorMatchingTextsEqualCurrent": true,
    "helperReplayed": true
  },
  "reviewScope": "Re-anchor receipt; claim verdict belongs to decisions section.",
  "packagedBy": "codex-session:unit-run-1792094246578-b2fbe39b@2026-10-16",
  "currentContentCommit": "345f15d95663260976200be66d1b9a6c648bcd6d",
  "entryId": "anchors-023"
}
```

## Entry anchors-024

```json
{
  "kind": "content-reanchoring-proof",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s5-root-authorities-sc1-gaps.json",
  "collection": "registryGaps",
  "before": {
    "claimId": "claim_7333c439fa8d29886b82168e015ca113",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "sourceUnitDigest": "97e661532202da60735c985f4cda6302e805d100441b148cd8b0ff05c9c914b2",
    "disposition": "supersede",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-33",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewStatus": "pending",
    "rationale": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetUnitDigest": "51dd3c8aa026a8f5a15e4c12c522b3bf2ad7c29238c49bf9ba51324806e10e23",
    "targetAncestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Manifest Shape"
    ]
  },
  "after": {
    "claimId": "claim_7333c439fa8d29886b82168e015ca113",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "sourceUnitDigest": "97e661532202da60735c985f4cda6302e805d100441b148cd8b0ff05c9c914b2",
    "disposition": "supersede",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-34",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewStatus": "pending",
    "rationale": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. L10-21: content-based rebind from reviewed prior target unheaded-block-33 (0b3d8cfa5bd06f2dc735968a1297d8567d8f78a6257cf8aed0b0611067e870a2) to unheaded-block-34 (0b3d8cfa5bd06f2dc735968a1297d8567d8f78a6257cf8aed0b0611067e870a2); inserted paragraphs shift the anchor, prior target text is unchanged.",
    "targetUnitDigest": "0b3d8cfa5bd06f2dc735968a1297d8567d8f78a6257cf8aed0b0611067e870a2",
    "targetAncestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Entry Fields And Effect Axes"
    ]
  },
  "prior": {
    "claimId": "claim_7333c439fa8d29886b82168e015ca113",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "sourceUnitDigest": "97e661532202da60735c985f4cda6302e805d100441b148cd8b0ff05c9c914b2",
    "disposition": "supersede",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-33",
    "authoredBy": "codex-session:unit-run-1792052396770-6f1c5957@2026-10-15",
    "reviewStatus": "reviewed",
    "rationale": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover.",
    "reviewNote": "deep: gap row; old paragraph unit found at 977509d5f block 31; same successor block 33 digest 0b3d8cfa unchanged, anchor shift only; word diff read (see-help pointer rewritten into the registry sentence); mapping unchanged",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-15",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-261015-1526-specs-ui-reworks-main-recarry.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "0b3d8cfa5bd06f2dc735968a1297d8567d8f78a6257cf8aed0b0611067e870a2",
    "targetAncestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Entry Fields And Effect Axes"
    ],
    "reviewReportCommit": "0e8ce7710ac67ad038927b242b2461876bf8c90d"
  },
  "targetWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-34",
    "githubAnchor": "unheaded-block-34",
    "stableAnchor": "unheaded-block-34",
    "title": "Unheaded block 34",
    "startLine": 310,
    "endLine": 320,
    "textDigest": "0b3d8cfa5bd06f2dc735968a1297d8567d8f78a6257cf8aed0b0611067e870a2",
    "sample": "**Hai trục thay cho `access` (per str46-io-contract).** Cờ `access`\nđơn (`read` hay `mutation`) từng gộp hai câu hỏi khác nhau vào một giá trị —\nlộ rõ khi `review` khai `mutation` ",
    "identityFingerprint": "abdaf7574d8107b6e5d325a95cb8c7327dac1248939788580176154fa990dace",
    "ancestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Entry Fields And Effect Axes"
    ],
    "text": "**Hai trục thay cho `access` (per str46-io-contract).** Cờ `access`\nđơn (`read` hay `mutation`) từng gộp hai câu hỏi khác nhau vào một giá trị —\nlộ rõ khi `review` khai `mutation` chỉ vì chế độ `--github` của nó tạo một\nPR thật, dù bản thân `review` (không `--github`) không hề đổi trạng thái\nfgOS. Sổ verb nay tách thành **hai trường độc lập**: `touchesState`\n(verb có bao giờ ghi trạng thái fgOS hay không) và `externalEffect` (verb\ncó bao giờ gọi một dịch vụ ngoài fgOS hay không — danh sách hiện hành mang `externalEffect: true` lấy từ manifest `COMMAND_REGISTRY` qua `fgos --help --json`: 15 verb, không có `coordination` (ví dụ `review`, `approve`, `run` — dispatch executor thật tính là effect ngoài `.fgos/`);\n`review` mang `touchesState: false` vì nó không bao giờ ghi trạng thái, kể\ncả qua `--github`). Cả hai cờ vẫn thuần **khai báo** — chưa nối vào điều\nphối hay xác danh; cổng \"ai được nói verb nào\" vẫn là việc riêng sau này\n(backlog STR38)."
  },
  "relatedClaimId": "claim_7333c439fa8d29886b82168e015ca113",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_7333c439fa8d29886b82168e015ca113",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "sourceUnitDigest": "97e661532202da60735c985f4cda6302e805d100441b148cd8b0ff05c9c914b2",
    "disposition": "supersede",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-34",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewStatus": "pending",
    "rationale": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. L10-21: content-based rebind from reviewed prior target unheaded-block-33 (0b3d8cfa5bd06f2dc735968a1297d8567d8f78a6257cf8aed0b0611067e870a2) to unheaded-block-34 (0b3d8cfa5bd06f2dc735968a1297d8567d8f78a6257cf8aed0b0611067e870a2); inserted paragraphs shift the anchor, prior target text is unchanged.",
    "targetUnitDigest": "0b3d8cfa5bd06f2dc735968a1297d8567d8f78a6257cf8aed0b0611067e870a2",
    "targetAncestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Entry Fields And Effect Axes"
    ]
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-34",
    "githubAnchor": "unheaded-block-34",
    "stableAnchor": "unheaded-block-34",
    "title": "Unheaded block 34",
    "startLine": 310,
    "endLine": 320,
    "textDigest": "0b3d8cfa5bd06f2dc735968a1297d8567d8f78a6257cf8aed0b0611067e870a2",
    "sample": "**Hai trục thay cho `access` (per str46-io-contract).** Cờ `access`\nđơn (`read` hay `mutation`) từng gộp hai câu hỏi khác nhau vào một giá trị —\nlộ rõ khi `review` khai `mutation` ",
    "identityFingerprint": "abdaf7574d8107b6e5d325a95cb8c7327dac1248939788580176154fa990dace",
    "ancestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Entry Fields And Effect Axes"
    ],
    "text": "**Hai trục thay cho `access` (per str46-io-contract).** Cờ `access`\nđơn (`read` hay `mutation`) từng gộp hai câu hỏi khác nhau vào một giá trị —\nlộ rõ khi `review` khai `mutation` chỉ vì chế độ `--github` của nó tạo một\nPR thật, dù bản thân `review` (không `--github`) không hề đổi trạng thái\nfgOS. Sổ verb nay tách thành **hai trường độc lập**: `touchesState`\n(verb có bao giờ ghi trạng thái fgOS hay không) và `externalEffect` (verb\ncó bao giờ gọi một dịch vụ ngoài fgOS hay không — danh sách hiện hành mang `externalEffect: true` lấy từ manifest `COMMAND_REGISTRY` qua `fgos --help --json`: 15 verb, không có `coordination` (ví dụ `review`, `approve`, `run` — dispatch executor thật tính là effect ngoài `.fgos/`);\n`review` mang `touchesState: false` vì nó không bao giờ ghi trạng thái, kể\ncả qua `--github`). Cả hai cờ vẫn thuần **khai báo** — chưa nối vào điều\nphối hay xác danh; cổng \"ai được nói verb nào\" vẫn là việc riêng sau này\n(backlog STR38)."
  },
  "oldAnchor": "unheaded-block-33",
  "newAnchor": "unheaded-block-34",
  "oldDigest": "0b3d8cfa5bd06f2dc735968a1297d8567d8f78a6257cf8aed0b0611067e870a2",
  "newDigest": "0b3d8cfa5bd06f2dc735968a1297d8567d8f78a6257cf8aed0b0611067e870a2",
  "deepRequired": true,
  "helper": "scripts/doc-binding-repair.mjs",
  "contentProof": {
    "priorCommit": "ab4d6274a",
    "priorMatchingUnits": [
      {
        "unitKind": "unheaded-block",
        "anchor": "unheaded-block-33",
        "githubAnchor": "unheaded-block-33",
        "stableAnchor": "unheaded-block-33",
        "title": "Unheaded block 33",
        "startLine": 300,
        "endLine": 310,
        "textDigest": "0b3d8cfa5bd06f2dc735968a1297d8567d8f78a6257cf8aed0b0611067e870a2",
        "sample": "**Hai trục thay cho `access` (per str46-io-contract).** Cờ `access`\nđơn (`read` hay `mutation`) từng gộp hai câu hỏi khác nhau vào một giá trị —\nlộ rõ khi `review` khai `mutation` ",
        "identityFingerprint": "abdaf7574d8107b6e5d325a95cb8c7327dac1248939788580176154fa990dace",
        "ancestry": [
          "CLI I/O Contract",
          "7. Machine-Readable Verb Registry",
          "Entry Fields And Effect Axes"
        ],
        "text": "**Hai trục thay cho `access` (per str46-io-contract).** Cờ `access`\nđơn (`read` hay `mutation`) từng gộp hai câu hỏi khác nhau vào một giá trị —\nlộ rõ khi `review` khai `mutation` chỉ vì chế độ `--github` của nó tạo một\nPR thật, dù bản thân `review` (không `--github`) không hề đổi trạng thái\nfgOS. Sổ verb nay tách thành **hai trường độc lập**: `touchesState`\n(verb có bao giờ ghi trạng thái fgOS hay không) và `externalEffect` (verb\ncó bao giờ gọi một dịch vụ ngoài fgOS hay không — danh sách hiện hành mang `externalEffect: true` lấy từ manifest `COMMAND_REGISTRY` qua `fgos --help --json`: 15 verb, không có `coordination` (ví dụ `review`, `approve`, `run` — dispatch executor thật tính là effect ngoài `.fgos/`);\n`review` mang `touchesState: false` vì nó không bao giờ ghi trạng thái, kể\ncả qua `--github`). Cả hai cờ vẫn thuần **khai báo** — chưa nối vào điều\nphối hay xác danh; cổng \"ai được nói verb nào\" vẫn là việc riêng sau này\n(backlog STR38)."
      }
    ],
    "currentText": "**Hai trục thay cho `access` (per str46-io-contract).** Cờ `access`\nđơn (`read` hay `mutation`) từng gộp hai câu hỏi khác nhau vào một giá trị —\nlộ rõ khi `review` khai `mutation` chỉ vì chế độ `--github` của nó tạo một\nPR thật, dù bản thân `review` (không `--github`) không hề đổi trạng thái\nfgOS. Sổ verb nay tách thành **hai trường độc lập**: `touchesState`\n(verb có bao giờ ghi trạng thái fgOS hay không) và `externalEffect` (verb\ncó bao giờ gọi một dịch vụ ngoài fgOS hay không — danh sách hiện hành mang `externalEffect: true` lấy từ manifest `COMMAND_REGISTRY` qua `fgos --help --json`: 15 verb, không có `coordination` (ví dụ `review`, `approve`, `run` — dispatch executor thật tính là effect ngoài `.fgos/`);\n`review` mang `touchesState: false` vì nó không bao giờ ghi trạng thái, kể\ncả qua `--github`). Cả hai cờ vẫn thuần **khai báo** — chưa nối vào điều\nphối hay xác danh; cổng \"ai được nói verb nào\" vẫn là việc riêng sau này\n(backlog STR38).",
    "allPriorMatchingTextsEqualCurrent": true,
    "helperReplayed": true
  },
  "reviewScope": "Re-anchor receipt; claim verdict belongs to decisions section.",
  "packagedBy": "codex-session:unit-run-1792094246578-b2fbe39b@2026-10-16",
  "currentContentCommit": "345f15d95663260976200be66d1b9a6c648bcd6d",
  "entryId": "anchors-024"
}
```

## Entry anchors-025

```json
{
  "kind": "content-reanchoring-proof",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s5-root-authorities-sc1-gaps.json",
  "collection": "registryGaps",
  "before": {
    "claimId": "claim_665eb7f4bfb9bee7ba3f5e58368eaba1",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "sourceUnitDigest": "ba9c9d6e641e3049b46d0596077eabd74593dd83e12391cd7336986f7733d796",
    "disposition": "supersede",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-34",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewStatus": "pending",
    "rationale": "The native predecessor docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-32 at 01fe216b4 is superseded by the complete same-file effect-axis unit. It preserves the field definitions, review/--github rationale where present, every list item and the external dispatch qualifier, adds explicit COMMAND_REGISTRY/15/no-coordination manifest wording, and keeps the valid review/approve/run examples. Whole source and target are shown; no identity graft or approval carry. Corrected binding: the successor is the bullets unit unheaded-block-34 (name, touchesState, externalEffect, paginated and subcommands), not the paragraph at unheaded-block-33. The old stored anchor/digest pair was inconsistent; no identity is grafted and no approval is carried. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetUnitDigest": "0b3d8cfa5bd06f2dc735968a1297d8567d8f78a6257cf8aed0b0611067e870a2",
    "targetAncestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Entry Fields And Effect Axes"
    ]
  },
  "after": {
    "claimId": "claim_665eb7f4bfb9bee7ba3f5e58368eaba1",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "sourceUnitDigest": "ba9c9d6e641e3049b46d0596077eabd74593dd83e12391cd7336986f7733d796",
    "disposition": "supersede",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-35",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewStatus": "pending",
    "rationale": "The native predecessor docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-32 at 01fe216b4 is superseded by the complete same-file effect-axis unit. It preserves the field definitions, review/--github rationale where present, every list item and the external dispatch qualifier, adds explicit COMMAND_REGISTRY/15/no-coordination manifest wording, and keeps the valid review/approve/run examples. Whole source and target are shown; no identity graft or approval carry. Corrected binding: the successor is the bullets unit unheaded-block-34 (name, touchesState, externalEffect, paginated and subcommands), not the paragraph at unheaded-block-33. The old stored anchor/digest pair was inconsistent; no identity is grafted and no approval is carried. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. L10-21: content-based rebind from reviewed prior target unheaded-block-34 (e013c5b05d6ff58782aa8231ab4a55967bd5ef853dac4015aec8f16f5fcf9c68) to unheaded-block-35 (e013c5b05d6ff58782aa8231ab4a55967bd5ef853dac4015aec8f16f5fcf9c68); inserted paragraphs shift the anchor, prior target text is unchanged.",
    "targetUnitDigest": "e013c5b05d6ff58782aa8231ab4a55967bd5ef853dac4015aec8f16f5fcf9c68",
    "targetAncestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Entry Fields And Effect Axes"
    ]
  },
  "prior": {
    "claimId": "claim_665eb7f4bfb9bee7ba3f5e58368eaba1",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "sourceUnitDigest": "ba9c9d6e641e3049b46d0596077eabd74593dd83e12391cd7336986f7733d796",
    "disposition": "supersede",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-34",
    "authoredBy": "codex-session:unit-run-1792056203419-9b5bd055@2026-10-15",
    "reviewStatus": "reviewed",
    "rationale": "The native predecessor docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-32 at 01fe216b4 is superseded by the complete same-file effect-axis unit. It preserves the field definitions, review/--github rationale where present, every list item and the external dispatch qualifier, adds explicit COMMAND_REGISTRY/15/no-coordination manifest wording, and keeps the valid review/approve/run examples. Whole source and target are shown; no identity graft or approval carry. Corrected binding: the successor is the bullets unit unheaded-block-34 (name, touchesState, externalEffect, paginated and subcommands), not the paragraph at unheaded-block-33. The old stored anchor/digest pair was inconsistent; no identity is grafted and no approval is carried.",
    "reviewNote": "deep: repointed to unheaded-block-34 (the bullets unit, lines 304-318) with e013c5b0 which recomputes; source block 32 at 977509d5f recomputes to ba9c9d6e; diff shows only reworded effect-axis sentence with COMMAND_REGISTRY/15/no-coordination plus the new subcommands bullet, both named in the rationale; supersede legal as whole unit carried",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-15",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-261015-1625-specs-ui-nine-decision-reworks.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "e013c5b05d6ff58782aa8231ab4a55967bd5ef853dac4015aec8f16f5fcf9c68",
    "targetAncestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Entry Fields And Effect Axes"
    ],
    "reviewReportCommit": "63fa6f15266f45c881f610235e0be8d61ff07120"
  },
  "targetWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-35",
    "githubAnchor": "unheaded-block-35",
    "stableAnchor": "unheaded-block-35",
    "title": "Unheaded block 35",
    "startLine": 322,
    "endLine": 336,
    "textDigest": "e013c5b05d6ff58782aa8231ab4a55967bd5ef853dac4015aec8f16f5fcf9c68",
    "sample": "- `name`, cách gọi, mô tả một dòng, lược đồ tham số, ví dụ, `deprecated`\n  (null hoặc chuỗi hướng dẫn deprecation; CLI renderer cũng chấp nhận metadata\n  cấu trúc để không rò `unde",
    "identityFingerprint": "a2e363fadb4249200e60df2aadad52b9400844e58930f9461c17ddb0feb33e8d",
    "ancestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Entry Fields And Effect Axes"
    ],
    "text": "- `name`, cách gọi, mô tả một dòng, lược đồ tham số, ví dụ, `deprecated`\n  (null hoặc chuỗi hướng dẫn deprecation; CLI renderer cũng chấp nhận metadata\n  cấu trúc để không rò `undefined`/`[object Object]` nếu schema tương lai mở rộng).\n- **`touchesState`** (verb có bao giờ ghi trạng thái fgOS) và\n  **`externalEffect`** (verb có bao giờ gọi dịch vụ ngoài fgOS) — hai trục\n  độc lập thay cho `access` cũ (từng gộp hai câu hỏi vào một giá trị,\n  sai cho `review`: nó khai `mutation` chỉ vì `--github` tạo PR thật, dù\n  bản thân `review` không hề ghi trạng thái). Danh sách hiện hành mang `externalEffect: true` lấy từ manifest\n  `COMMAND_REGISTRY` qua `fgos --help --json`: 15 verb, không có\n  `coordination` (ví dụ `review`, `approve`, `run` — dispatch executor thật\n  tính là effect ngoài `.fgos/`).\n- `paginated` (xem trên) và `multiValueFormat` (dưới) khi áp dụng.\n- `subcommands` cho verb có sub-verb ở vị trí đầu: `{<sub>: {description,\n  parameters, examples}}`, mỗi sub-verb chỉ mang cờ nó thật sự đọc;\n  `parameters` cấp verb khi đó chỉ còn `sub`."
  },
  "relatedClaimId": "claim_665eb7f4bfb9bee7ba3f5e58368eaba1",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_665eb7f4bfb9bee7ba3f5e58368eaba1",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "sourceUnitDigest": "ba9c9d6e641e3049b46d0596077eabd74593dd83e12391cd7336986f7733d796",
    "disposition": "supersede",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-35",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewStatus": "pending",
    "rationale": "The native predecessor docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-32 at 01fe216b4 is superseded by the complete same-file effect-axis unit. It preserves the field definitions, review/--github rationale where present, every list item and the external dispatch qualifier, adds explicit COMMAND_REGISTRY/15/no-coordination manifest wording, and keeps the valid review/approve/run examples. Whole source and target are shown; no identity graft or approval carry. Corrected binding: the successor is the bullets unit unheaded-block-34 (name, touchesState, externalEffect, paginated and subcommands), not the paragraph at unheaded-block-33. The old stored anchor/digest pair was inconsistent; no identity is grafted and no approval is carried. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. L10-21: content-based rebind from reviewed prior target unheaded-block-34 (e013c5b05d6ff58782aa8231ab4a55967bd5ef853dac4015aec8f16f5fcf9c68) to unheaded-block-35 (e013c5b05d6ff58782aa8231ab4a55967bd5ef853dac4015aec8f16f5fcf9c68); inserted paragraphs shift the anchor, prior target text is unchanged.",
    "targetUnitDigest": "e013c5b05d6ff58782aa8231ab4a55967bd5ef853dac4015aec8f16f5fcf9c68",
    "targetAncestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Entry Fields And Effect Axes"
    ]
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-35",
    "githubAnchor": "unheaded-block-35",
    "stableAnchor": "unheaded-block-35",
    "title": "Unheaded block 35",
    "startLine": 322,
    "endLine": 336,
    "textDigest": "e013c5b05d6ff58782aa8231ab4a55967bd5ef853dac4015aec8f16f5fcf9c68",
    "sample": "- `name`, cách gọi, mô tả một dòng, lược đồ tham số, ví dụ, `deprecated`\n  (null hoặc chuỗi hướng dẫn deprecation; CLI renderer cũng chấp nhận metadata\n  cấu trúc để không rò `unde",
    "identityFingerprint": "a2e363fadb4249200e60df2aadad52b9400844e58930f9461c17ddb0feb33e8d",
    "ancestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Entry Fields And Effect Axes"
    ],
    "text": "- `name`, cách gọi, mô tả một dòng, lược đồ tham số, ví dụ, `deprecated`\n  (null hoặc chuỗi hướng dẫn deprecation; CLI renderer cũng chấp nhận metadata\n  cấu trúc để không rò `undefined`/`[object Object]` nếu schema tương lai mở rộng).\n- **`touchesState`** (verb có bao giờ ghi trạng thái fgOS) và\n  **`externalEffect`** (verb có bao giờ gọi dịch vụ ngoài fgOS) — hai trục\n  độc lập thay cho `access` cũ (từng gộp hai câu hỏi vào một giá trị,\n  sai cho `review`: nó khai `mutation` chỉ vì `--github` tạo PR thật, dù\n  bản thân `review` không hề ghi trạng thái). Danh sách hiện hành mang `externalEffect: true` lấy từ manifest\n  `COMMAND_REGISTRY` qua `fgos --help --json`: 15 verb, không có\n  `coordination` (ví dụ `review`, `approve`, `run` — dispatch executor thật\n  tính là effect ngoài `.fgos/`).\n- `paginated` (xem trên) và `multiValueFormat` (dưới) khi áp dụng.\n- `subcommands` cho verb có sub-verb ở vị trí đầu: `{<sub>: {description,\n  parameters, examples}}`, mỗi sub-verb chỉ mang cờ nó thật sự đọc;\n  `parameters` cấp verb khi đó chỉ còn `sub`."
  },
  "oldAnchor": "unheaded-block-34",
  "newAnchor": "unheaded-block-35",
  "oldDigest": "e013c5b05d6ff58782aa8231ab4a55967bd5ef853dac4015aec8f16f5fcf9c68",
  "newDigest": "e013c5b05d6ff58782aa8231ab4a55967bd5ef853dac4015aec8f16f5fcf9c68",
  "deepRequired": true,
  "helper": "scripts/doc-binding-repair.mjs",
  "contentProof": {
    "priorCommit": "ab4d6274a",
    "priorMatchingUnits": [
      {
        "unitKind": "unheaded-block",
        "anchor": "unheaded-block-34",
        "githubAnchor": "unheaded-block-34",
        "stableAnchor": "unheaded-block-34",
        "title": "Unheaded block 34",
        "startLine": 312,
        "endLine": 326,
        "textDigest": "e013c5b05d6ff58782aa8231ab4a55967bd5ef853dac4015aec8f16f5fcf9c68",
        "sample": "- `name`, cách gọi, mô tả một dòng, lược đồ tham số, ví dụ, `deprecated`\n  (null hoặc chuỗi hướng dẫn deprecation; CLI renderer cũng chấp nhận metadata\n  cấu trúc để không rò `unde",
        "identityFingerprint": "a2e363fadb4249200e60df2aadad52b9400844e58930f9461c17ddb0feb33e8d",
        "ancestry": [
          "CLI I/O Contract",
          "7. Machine-Readable Verb Registry",
          "Entry Fields And Effect Axes"
        ],
        "text": "- `name`, cách gọi, mô tả một dòng, lược đồ tham số, ví dụ, `deprecated`\n  (null hoặc chuỗi hướng dẫn deprecation; CLI renderer cũng chấp nhận metadata\n  cấu trúc để không rò `undefined`/`[object Object]` nếu schema tương lai mở rộng).\n- **`touchesState`** (verb có bao giờ ghi trạng thái fgOS) và\n  **`externalEffect`** (verb có bao giờ gọi dịch vụ ngoài fgOS) — hai trục\n  độc lập thay cho `access` cũ (từng gộp hai câu hỏi vào một giá trị,\n  sai cho `review`: nó khai `mutation` chỉ vì `--github` tạo PR thật, dù\n  bản thân `review` không hề ghi trạng thái). Danh sách hiện hành mang `externalEffect: true` lấy từ manifest\n  `COMMAND_REGISTRY` qua `fgos --help --json`: 15 verb, không có\n  `coordination` (ví dụ `review`, `approve`, `run` — dispatch executor thật\n  tính là effect ngoài `.fgos/`).\n- `paginated` (xem trên) và `multiValueFormat` (dưới) khi áp dụng.\n- `subcommands` cho verb có sub-verb ở vị trí đầu: `{<sub>: {description,\n  parameters, examples}}`, mỗi sub-verb chỉ mang cờ nó thật sự đọc;\n  `parameters` cấp verb khi đó chỉ còn `sub`."
      }
    ],
    "currentText": "- `name`, cách gọi, mô tả một dòng, lược đồ tham số, ví dụ, `deprecated`\n  (null hoặc chuỗi hướng dẫn deprecation; CLI renderer cũng chấp nhận metadata\n  cấu trúc để không rò `undefined`/`[object Object]` nếu schema tương lai mở rộng).\n- **`touchesState`** (verb có bao giờ ghi trạng thái fgOS) và\n  **`externalEffect`** (verb có bao giờ gọi dịch vụ ngoài fgOS) — hai trục\n  độc lập thay cho `access` cũ (từng gộp hai câu hỏi vào một giá trị,\n  sai cho `review`: nó khai `mutation` chỉ vì `--github` tạo PR thật, dù\n  bản thân `review` không hề ghi trạng thái). Danh sách hiện hành mang `externalEffect: true` lấy từ manifest\n  `COMMAND_REGISTRY` qua `fgos --help --json`: 15 verb, không có\n  `coordination` (ví dụ `review`, `approve`, `run` — dispatch executor thật\n  tính là effect ngoài `.fgos/`).\n- `paginated` (xem trên) và `multiValueFormat` (dưới) khi áp dụng.\n- `subcommands` cho verb có sub-verb ở vị trí đầu: `{<sub>: {description,\n  parameters, examples}}`, mỗi sub-verb chỉ mang cờ nó thật sự đọc;\n  `parameters` cấp verb khi đó chỉ còn `sub`.",
    "allPriorMatchingTextsEqualCurrent": true,
    "helperReplayed": true
  },
  "reviewScope": "Re-anchor receipt; claim verdict belongs to decisions section.",
  "packagedBy": "codex-session:unit-run-1792094246578-b2fbe39b@2026-10-16",
  "currentContentCommit": "345f15d95663260976200be66d1b9a6c648bcd6d",
  "entryId": "anchors-025"
}
```

## Entry anchors-026

```json
{
  "kind": "content-reanchoring-proof",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s5-root-authorities-sc1-gaps.json",
  "collection": "registryGaps",
  "before": {
    "claimId": "claim_e597b776163803dcf6e4194962ea4f6e",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "sourceUnitDigest": "5bed5c61440ab7ef0a9c595d18e3485c47c1952c78cbd07a0ea354db8ad750c3",
    "disposition": "supersede",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-34",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewStatus": "pending",
    "rationale": "The predecessor block 32 at 9881f8622 already states COMMAND_REGISTRY, 15 externalEffect verbs and no coordination. The successor adds two deltas: the review/approve/run examples and the whole subcommands bullet (three lines), which the source never had. The other source field definitions, paginated/multiValueFormat bullet and dispatch executor qualifier are retained, with line reflow. Corrected binding remains the same-file bullets unit unheaded-block-34 (name, touchesState, externalEffect, paginated and subcommands), digest e013c5b05d6ff58782aa8231ab4a55967bd5ef853dac4015aec8f16f5fcf9c68; paragraph unheaded-block-33 was an inconsistent earlier binding. Native predecessor identity is conserved without graft or approval carry. Pending independent rationale re-review. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetUnitDigest": "0b3d8cfa5bd06f2dc735968a1297d8567d8f78a6257cf8aed0b0611067e870a2",
    "targetAncestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Entry Fields And Effect Axes"
    ]
  },
  "after": {
    "claimId": "claim_e597b776163803dcf6e4194962ea4f6e",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "sourceUnitDigest": "5bed5c61440ab7ef0a9c595d18e3485c47c1952c78cbd07a0ea354db8ad750c3",
    "disposition": "supersede",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-35",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewStatus": "pending",
    "rationale": "The predecessor block 32 at 9881f8622 already states COMMAND_REGISTRY, 15 externalEffect verbs and no coordination. The successor adds two deltas: the review/approve/run examples and the whole subcommands bullet (three lines), which the source never had. The other source field definitions, paginated/multiValueFormat bullet and dispatch executor qualifier are retained, with line reflow. Corrected binding remains the same-file bullets unit unheaded-block-34 (name, touchesState, externalEffect, paginated and subcommands), digest e013c5b05d6ff58782aa8231ab4a55967bd5ef853dac4015aec8f16f5fcf9c68; paragraph unheaded-block-33 was an inconsistent earlier binding. Native predecessor identity is conserved without graft or approval carry. Pending independent rationale re-review. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. L10-21: content-based rebind from reviewed prior target unheaded-block-34 (e013c5b05d6ff58782aa8231ab4a55967bd5ef853dac4015aec8f16f5fcf9c68) to unheaded-block-35 (e013c5b05d6ff58782aa8231ab4a55967bd5ef853dac4015aec8f16f5fcf9c68); inserted paragraphs shift the anchor, prior target text is unchanged.",
    "targetUnitDigest": "e013c5b05d6ff58782aa8231ab4a55967bd5ef853dac4015aec8f16f5fcf9c68",
    "targetAncestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Entry Fields And Effect Axes"
    ]
  },
  "prior": {
    "claimId": "claim_e597b776163803dcf6e4194962ea4f6e",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "sourceUnitDigest": "5bed5c61440ab7ef0a9c595d18e3485c47c1952c78cbd07a0ea354db8ad750c3",
    "disposition": "supersede",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-34",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "reviewStatus": "reviewed",
    "rationale": "The predecessor block 32 at 9881f8622 already states COMMAND_REGISTRY, 15 externalEffect verbs and no coordination. The successor adds two deltas: the review/approve/run examples and the whole subcommands bullet (three lines), which the source never had. The other source field definitions, paginated/multiValueFormat bullet and dispatch executor qualifier are retained, with line reflow. Corrected binding remains the same-file bullets unit unheaded-block-34 (name, touchesState, externalEffect, paginated and subcommands), digest e013c5b05d6ff58782aa8231ab4a55967bd5ef853dac4015aec8f16f5fcf9c68; paragraph unheaded-block-33 was an inconsistent earlier binding. Native predecessor identity is conserved without graft or approval carry. Pending independent rationale re-review.",
    "reviewNote": "deep: the diff of source block 32 against target block 34 has exactly two deltas, the example parenthetical (review, approve, run) added after the coordination clause and the three-line subcommands bullet appended; the rationale now names both and says the subcommands bullet was never in the source, which is true; every other source line is byte-identical apart from the wrapped qualifier line, so the stated reflow is accurate; binding unheaded-block-34 with e013c5b0 and source 5bed5c61 both recompute; status stays pending with no approval or graft carried",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-15",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-261015-1653-specs-ui-last-rationale.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "e013c5b05d6ff58782aa8231ab4a55967bd5ef853dac4015aec8f16f5fcf9c68",
    "targetAncestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Entry Fields And Effect Axes"
    ],
    "reviewReportCommit": "24be6cb1db1b16fd1b1dc244f1c7b46d851a330b"
  },
  "targetWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-35",
    "githubAnchor": "unheaded-block-35",
    "stableAnchor": "unheaded-block-35",
    "title": "Unheaded block 35",
    "startLine": 322,
    "endLine": 336,
    "textDigest": "e013c5b05d6ff58782aa8231ab4a55967bd5ef853dac4015aec8f16f5fcf9c68",
    "sample": "- `name`, cách gọi, mô tả một dòng, lược đồ tham số, ví dụ, `deprecated`\n  (null hoặc chuỗi hướng dẫn deprecation; CLI renderer cũng chấp nhận metadata\n  cấu trúc để không rò `unde",
    "identityFingerprint": "a2e363fadb4249200e60df2aadad52b9400844e58930f9461c17ddb0feb33e8d",
    "ancestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Entry Fields And Effect Axes"
    ],
    "text": "- `name`, cách gọi, mô tả một dòng, lược đồ tham số, ví dụ, `deprecated`\n  (null hoặc chuỗi hướng dẫn deprecation; CLI renderer cũng chấp nhận metadata\n  cấu trúc để không rò `undefined`/`[object Object]` nếu schema tương lai mở rộng).\n- **`touchesState`** (verb có bao giờ ghi trạng thái fgOS) và\n  **`externalEffect`** (verb có bao giờ gọi dịch vụ ngoài fgOS) — hai trục\n  độc lập thay cho `access` cũ (từng gộp hai câu hỏi vào một giá trị,\n  sai cho `review`: nó khai `mutation` chỉ vì `--github` tạo PR thật, dù\n  bản thân `review` không hề ghi trạng thái). Danh sách hiện hành mang `externalEffect: true` lấy từ manifest\n  `COMMAND_REGISTRY` qua `fgos --help --json`: 15 verb, không có\n  `coordination` (ví dụ `review`, `approve`, `run` — dispatch executor thật\n  tính là effect ngoài `.fgos/`).\n- `paginated` (xem trên) và `multiValueFormat` (dưới) khi áp dụng.\n- `subcommands` cho verb có sub-verb ở vị trí đầu: `{<sub>: {description,\n  parameters, examples}}`, mỗi sub-verb chỉ mang cờ nó thật sự đọc;\n  `parameters` cấp verb khi đó chỉ còn `sub`."
  },
  "relatedClaimId": "claim_e597b776163803dcf6e4194962ea4f6e",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_e597b776163803dcf6e4194962ea4f6e",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "sourceUnitDigest": "5bed5c61440ab7ef0a9c595d18e3485c47c1952c78cbd07a0ea354db8ad750c3",
    "disposition": "supersede",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-35",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewStatus": "pending",
    "rationale": "The predecessor block 32 at 9881f8622 already states COMMAND_REGISTRY, 15 externalEffect verbs and no coordination. The successor adds two deltas: the review/approve/run examples and the whole subcommands bullet (three lines), which the source never had. The other source field definitions, paginated/multiValueFormat bullet and dispatch executor qualifier are retained, with line reflow. Corrected binding remains the same-file bullets unit unheaded-block-34 (name, touchesState, externalEffect, paginated and subcommands), digest e013c5b05d6ff58782aa8231ab4a55967bd5ef853dac4015aec8f16f5fcf9c68; paragraph unheaded-block-33 was an inconsistent earlier binding. Native predecessor identity is conserved without graft or approval carry. Pending independent rationale re-review. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. L10-21: content-based rebind from reviewed prior target unheaded-block-34 (e013c5b05d6ff58782aa8231ab4a55967bd5ef853dac4015aec8f16f5fcf9c68) to unheaded-block-35 (e013c5b05d6ff58782aa8231ab4a55967bd5ef853dac4015aec8f16f5fcf9c68); inserted paragraphs shift the anchor, prior target text is unchanged.",
    "targetUnitDigest": "e013c5b05d6ff58782aa8231ab4a55967bd5ef853dac4015aec8f16f5fcf9c68",
    "targetAncestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Entry Fields And Effect Axes"
    ]
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-35",
    "githubAnchor": "unheaded-block-35",
    "stableAnchor": "unheaded-block-35",
    "title": "Unheaded block 35",
    "startLine": 322,
    "endLine": 336,
    "textDigest": "e013c5b05d6ff58782aa8231ab4a55967bd5ef853dac4015aec8f16f5fcf9c68",
    "sample": "- `name`, cách gọi, mô tả một dòng, lược đồ tham số, ví dụ, `deprecated`\n  (null hoặc chuỗi hướng dẫn deprecation; CLI renderer cũng chấp nhận metadata\n  cấu trúc để không rò `unde",
    "identityFingerprint": "a2e363fadb4249200e60df2aadad52b9400844e58930f9461c17ddb0feb33e8d",
    "ancestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Entry Fields And Effect Axes"
    ],
    "text": "- `name`, cách gọi, mô tả một dòng, lược đồ tham số, ví dụ, `deprecated`\n  (null hoặc chuỗi hướng dẫn deprecation; CLI renderer cũng chấp nhận metadata\n  cấu trúc để không rò `undefined`/`[object Object]` nếu schema tương lai mở rộng).\n- **`touchesState`** (verb có bao giờ ghi trạng thái fgOS) và\n  **`externalEffect`** (verb có bao giờ gọi dịch vụ ngoài fgOS) — hai trục\n  độc lập thay cho `access` cũ (từng gộp hai câu hỏi vào một giá trị,\n  sai cho `review`: nó khai `mutation` chỉ vì `--github` tạo PR thật, dù\n  bản thân `review` không hề ghi trạng thái). Danh sách hiện hành mang `externalEffect: true` lấy từ manifest\n  `COMMAND_REGISTRY` qua `fgos --help --json`: 15 verb, không có\n  `coordination` (ví dụ `review`, `approve`, `run` — dispatch executor thật\n  tính là effect ngoài `.fgos/`).\n- `paginated` (xem trên) và `multiValueFormat` (dưới) khi áp dụng.\n- `subcommands` cho verb có sub-verb ở vị trí đầu: `{<sub>: {description,\n  parameters, examples}}`, mỗi sub-verb chỉ mang cờ nó thật sự đọc;\n  `parameters` cấp verb khi đó chỉ còn `sub`."
  },
  "oldAnchor": "unheaded-block-34",
  "newAnchor": "unheaded-block-35",
  "oldDigest": "e013c5b05d6ff58782aa8231ab4a55967bd5ef853dac4015aec8f16f5fcf9c68",
  "newDigest": "e013c5b05d6ff58782aa8231ab4a55967bd5ef853dac4015aec8f16f5fcf9c68",
  "deepRequired": true,
  "helper": "scripts/doc-binding-repair.mjs",
  "contentProof": {
    "priorCommit": "ab4d6274a",
    "priorMatchingUnits": [
      {
        "unitKind": "unheaded-block",
        "anchor": "unheaded-block-34",
        "githubAnchor": "unheaded-block-34",
        "stableAnchor": "unheaded-block-34",
        "title": "Unheaded block 34",
        "startLine": 312,
        "endLine": 326,
        "textDigest": "e013c5b05d6ff58782aa8231ab4a55967bd5ef853dac4015aec8f16f5fcf9c68",
        "sample": "- `name`, cách gọi, mô tả một dòng, lược đồ tham số, ví dụ, `deprecated`\n  (null hoặc chuỗi hướng dẫn deprecation; CLI renderer cũng chấp nhận metadata\n  cấu trúc để không rò `unde",
        "identityFingerprint": "a2e363fadb4249200e60df2aadad52b9400844e58930f9461c17ddb0feb33e8d",
        "ancestry": [
          "CLI I/O Contract",
          "7. Machine-Readable Verb Registry",
          "Entry Fields And Effect Axes"
        ],
        "text": "- `name`, cách gọi, mô tả một dòng, lược đồ tham số, ví dụ, `deprecated`\n  (null hoặc chuỗi hướng dẫn deprecation; CLI renderer cũng chấp nhận metadata\n  cấu trúc để không rò `undefined`/`[object Object]` nếu schema tương lai mở rộng).\n- **`touchesState`** (verb có bao giờ ghi trạng thái fgOS) và\n  **`externalEffect`** (verb có bao giờ gọi dịch vụ ngoài fgOS) — hai trục\n  độc lập thay cho `access` cũ (từng gộp hai câu hỏi vào một giá trị,\n  sai cho `review`: nó khai `mutation` chỉ vì `--github` tạo PR thật, dù\n  bản thân `review` không hề ghi trạng thái). Danh sách hiện hành mang `externalEffect: true` lấy từ manifest\n  `COMMAND_REGISTRY` qua `fgos --help --json`: 15 verb, không có\n  `coordination` (ví dụ `review`, `approve`, `run` — dispatch executor thật\n  tính là effect ngoài `.fgos/`).\n- `paginated` (xem trên) và `multiValueFormat` (dưới) khi áp dụng.\n- `subcommands` cho verb có sub-verb ở vị trí đầu: `{<sub>: {description,\n  parameters, examples}}`, mỗi sub-verb chỉ mang cờ nó thật sự đọc;\n  `parameters` cấp verb khi đó chỉ còn `sub`."
      }
    ],
    "currentText": "- `name`, cách gọi, mô tả một dòng, lược đồ tham số, ví dụ, `deprecated`\n  (null hoặc chuỗi hướng dẫn deprecation; CLI renderer cũng chấp nhận metadata\n  cấu trúc để không rò `undefined`/`[object Object]` nếu schema tương lai mở rộng).\n- **`touchesState`** (verb có bao giờ ghi trạng thái fgOS) và\n  **`externalEffect`** (verb có bao giờ gọi dịch vụ ngoài fgOS) — hai trục\n  độc lập thay cho `access` cũ (từng gộp hai câu hỏi vào một giá trị,\n  sai cho `review`: nó khai `mutation` chỉ vì `--github` tạo PR thật, dù\n  bản thân `review` không hề ghi trạng thái). Danh sách hiện hành mang `externalEffect: true` lấy từ manifest\n  `COMMAND_REGISTRY` qua `fgos --help --json`: 15 verb, không có\n  `coordination` (ví dụ `review`, `approve`, `run` — dispatch executor thật\n  tính là effect ngoài `.fgos/`).\n- `paginated` (xem trên) và `multiValueFormat` (dưới) khi áp dụng.\n- `subcommands` cho verb có sub-verb ở vị trí đầu: `{<sub>: {description,\n  parameters, examples}}`, mỗi sub-verb chỉ mang cờ nó thật sự đọc;\n  `parameters` cấp verb khi đó chỉ còn `sub`.",
    "allPriorMatchingTextsEqualCurrent": true,
    "helperReplayed": true
  },
  "reviewScope": "Re-anchor receipt; claim verdict belongs to decisions section.",
  "packagedBy": "codex-session:unit-run-1792094246578-b2fbe39b@2026-10-16",
  "currentContentCommit": "345f15d95663260976200be66d1b9a6c648bcd6d",
  "entryId": "anchors-026"
}
```

## Entry anchors-027

```json
{
  "kind": "content-reanchoring-proof",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s5-root-boundary-sync.json",
  "collection": "claims",
  "before": {
    "claimId": "claim_cbc7ad17e0764ac8d1d4d386e3b62e74",
    "sourceUnitDigest": "51dd3c8aa026a8f5a15e4c12c522b3bf2ad7c29238c49bf9ba51324806e10e23",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-32",
    "claimKind": "contract",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "rationale": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetUnitDigest": "a5128895b71f07c2e1baa3ecb90cd302f016fdb4191518ef02835a768c8dc156",
    "targetAncestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Manifest Shape"
    ]
  },
  "after": {
    "claimId": "claim_cbc7ad17e0764ac8d1d4d386e3b62e74",
    "sourceUnitDigest": "51dd3c8aa026a8f5a15e4c12c522b3bf2ad7c29238c49bf9ba51324806e10e23",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-33",
    "claimKind": "contract",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "rationale": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. L10-21: content-based rebind from reviewed prior target unheaded-block-32 (51dd3c8aa026a8f5a15e4c12c522b3bf2ad7c29238c49bf9ba51324806e10e23) to unheaded-block-33 (51dd3c8aa026a8f5a15e4c12c522b3bf2ad7c29238c49bf9ba51324806e10e23); inserted paragraphs shift the anchor, prior target text is unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "51dd3c8aa026a8f5a15e4c12c522b3bf2ad7c29238c49bf9ba51324806e10e23",
    "targetAncestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Manifest Shape"
    ]
  },
  "prior": {
    "claimId": "claim_cbc7ad17e0764ac8d1d4d386e3b62e74",
    "sourceUnitDigest": "51dd3c8aa026a8f5a15e4c12c522b3bf2ad7c29238c49bf9ba51324806e10e23",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-32",
    "claimKind": "contract",
    "disposition": "supersede",
    "reviewStatus": "reviewed",
    "rationale": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover.",
    "authoredBy": "codex-session:unit-run-1792052396770-6f1c5957@2026-10-15",
    "reviewNote": "deep: sampled; legacy io-contract block 19 (51dd3c8a, was block 18 before the merge) byte-equal to carrier block 32; before and after digest equal; anchor shift 31 to 32; supersede unchanged; registry holds the claim at legacy anchor 19; ancestry recomputed equal",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-15",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-261015-1526-specs-ui-reworks-main-recarry.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "51dd3c8aa026a8f5a15e4c12c522b3bf2ad7c29238c49bf9ba51324806e10e23",
    "targetAncestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Manifest Shape"
    ],
    "reviewReportCommit": "0e8ce7710ac67ad038927b242b2461876bf8c90d"
  },
  "targetWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-33",
    "githubAnchor": "unheaded-block-33",
    "stableAnchor": "unheaded-block-33",
    "title": "Unheaded block 33",
    "startLine": 299,
    "endLine": 306,
    "textDigest": "51dd3c8aa026a8f5a15e4c12c522b3bf2ad7c29238c49bf9ba51324806e10e23",
    "sample": "`fgos --help --json` trả `{schema_version, commands: […]}` — CLI công bố\ntoàn bộ mặt verb để một listener/giao diện **sinh** khung lệnh từ manifest\nthay vì hard-code từng verb. `sc",
    "identityFingerprint": "49d3e9858947d27fe5eed264949a7b4b22caed396f6bebb112a9eae50fa460fd",
    "ancestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Manifest Shape"
    ],
    "text": "`fgos --help --json` trả `{schema_version, commands: […]}` — CLI công bố\ntoàn bộ mặt verb để một listener/giao diện **sinh** khung lệnh từ manifest\nthay vì hard-code từng verb. `schema_version` hiện `'3.0'` (tăng từ `'2.0'`\nkhi cờ của verb có sub-verb dời vào `subcommands`; `'2.0'` từng tăng từ\n`'1.0'` vì trường `access` bị xoá). `fgos <verb> [<sub>] --help --json` trả\nriêng mục của một verb (thu hẹp về một sub-verb khi có), cùng hình dạng một\nphần tử `commands[]`. Cả hai chạy được qua Rust host ở mọi project và không\nbao giờ chạy verb. Mỗi mục verb mang:"
  },
  "relatedClaimId": "claim_cbc7ad17e0764ac8d1d4d386e3b62e74",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_cbc7ad17e0764ac8d1d4d386e3b62e74",
    "sourceUnitDigest": "51dd3c8aa026a8f5a15e4c12c522b3bf2ad7c29238c49bf9ba51324806e10e23",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-33",
    "claimKind": "contract",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "rationale": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. L10-21: content-based rebind from reviewed prior target unheaded-block-32 (51dd3c8aa026a8f5a15e4c12c522b3bf2ad7c29238c49bf9ba51324806e10e23) to unheaded-block-33 (51dd3c8aa026a8f5a15e4c12c522b3bf2ad7c29238c49bf9ba51324806e10e23); inserted paragraphs shift the anchor, prior target text is unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "51dd3c8aa026a8f5a15e4c12c522b3bf2ad7c29238c49bf9ba51324806e10e23",
    "targetAncestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Manifest Shape"
    ]
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-33",
    "githubAnchor": "unheaded-block-33",
    "stableAnchor": "unheaded-block-33",
    "title": "Unheaded block 33",
    "startLine": 299,
    "endLine": 306,
    "textDigest": "51dd3c8aa026a8f5a15e4c12c522b3bf2ad7c29238c49bf9ba51324806e10e23",
    "sample": "`fgos --help --json` trả `{schema_version, commands: […]}` — CLI công bố\ntoàn bộ mặt verb để một listener/giao diện **sinh** khung lệnh từ manifest\nthay vì hard-code từng verb. `sc",
    "identityFingerprint": "49d3e9858947d27fe5eed264949a7b4b22caed396f6bebb112a9eae50fa460fd",
    "ancestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Manifest Shape"
    ],
    "text": "`fgos --help --json` trả `{schema_version, commands: […]}` — CLI công bố\ntoàn bộ mặt verb để một listener/giao diện **sinh** khung lệnh từ manifest\nthay vì hard-code từng verb. `schema_version` hiện `'3.0'` (tăng từ `'2.0'`\nkhi cờ của verb có sub-verb dời vào `subcommands`; `'2.0'` từng tăng từ\n`'1.0'` vì trường `access` bị xoá). `fgos <verb> [<sub>] --help --json` trả\nriêng mục của một verb (thu hẹp về một sub-verb khi có), cùng hình dạng một\nphần tử `commands[]`. Cả hai chạy được qua Rust host ở mọi project và không\nbao giờ chạy verb. Mỗi mục verb mang:"
  },
  "oldAnchor": "unheaded-block-32",
  "newAnchor": "unheaded-block-33",
  "oldDigest": "51dd3c8aa026a8f5a15e4c12c522b3bf2ad7c29238c49bf9ba51324806e10e23",
  "newDigest": "51dd3c8aa026a8f5a15e4c12c522b3bf2ad7c29238c49bf9ba51324806e10e23",
  "deepRequired": true,
  "helper": "scripts/doc-binding-repair.mjs",
  "contentProof": {
    "priorCommit": "ab4d6274a",
    "priorMatchingUnits": [
      {
        "unitKind": "unheaded-block",
        "anchor": "unheaded-block-32",
        "githubAnchor": "unheaded-block-32",
        "stableAnchor": "unheaded-block-32",
        "title": "Unheaded block 32",
        "startLine": 289,
        "endLine": 296,
        "textDigest": "51dd3c8aa026a8f5a15e4c12c522b3bf2ad7c29238c49bf9ba51324806e10e23",
        "sample": "`fgos --help --json` trả `{schema_version, commands: […]}` — CLI công bố\ntoàn bộ mặt verb để một listener/giao diện **sinh** khung lệnh từ manifest\nthay vì hard-code từng verb. `sc",
        "identityFingerprint": "49d3e9858947d27fe5eed264949a7b4b22caed396f6bebb112a9eae50fa460fd",
        "ancestry": [
          "CLI I/O Contract",
          "7. Machine-Readable Verb Registry",
          "Manifest Shape"
        ],
        "text": "`fgos --help --json` trả `{schema_version, commands: […]}` — CLI công bố\ntoàn bộ mặt verb để một listener/giao diện **sinh** khung lệnh từ manifest\nthay vì hard-code từng verb. `schema_version` hiện `'3.0'` (tăng từ `'2.0'`\nkhi cờ của verb có sub-verb dời vào `subcommands`; `'2.0'` từng tăng từ\n`'1.0'` vì trường `access` bị xoá). `fgos <verb> [<sub>] --help --json` trả\nriêng mục của một verb (thu hẹp về một sub-verb khi có), cùng hình dạng một\nphần tử `commands[]`. Cả hai chạy được qua Rust host ở mọi project và không\nbao giờ chạy verb. Mỗi mục verb mang:"
      }
    ],
    "currentText": "`fgos --help --json` trả `{schema_version, commands: […]}` — CLI công bố\ntoàn bộ mặt verb để một listener/giao diện **sinh** khung lệnh từ manifest\nthay vì hard-code từng verb. `schema_version` hiện `'3.0'` (tăng từ `'2.0'`\nkhi cờ của verb có sub-verb dời vào `subcommands`; `'2.0'` từng tăng từ\n`'1.0'` vì trường `access` bị xoá). `fgos <verb> [<sub>] --help --json` trả\nriêng mục của một verb (thu hẹp về một sub-verb khi có), cùng hình dạng một\nphần tử `commands[]`. Cả hai chạy được qua Rust host ở mọi project và không\nbao giờ chạy verb. Mỗi mục verb mang:",
    "allPriorMatchingTextsEqualCurrent": true,
    "helperReplayed": true
  },
  "reviewScope": "Re-anchor receipt; claim verdict belongs to decisions section.",
  "packagedBy": "codex-session:unit-run-1792094246578-b2fbe39b@2026-10-16",
  "currentContentCommit": "345f15d95663260976200be66d1b9a6c648bcd6d",
  "entryId": "anchors-027"
}
```

## Entry anchors-028

```json
{
  "kind": "content-reanchoring-proof",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s5-root-boundary-sync.json",
  "collection": "claims",
  "before": {
    "claimId": "claim_b8fa7fa2cd614433de754bbb92302140",
    "sourceUnitDigest": "d08ac6f65427df6334f383a722e80ed4640fc93af7693c530ce2265d7262fcb7",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-34",
    "claimKind": "contract",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "rationale": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetUnitDigest": "0b3d8cfa5bd06f2dc735968a1297d8567d8f78a6257cf8aed0b0611067e870a2",
    "targetAncestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Entry Fields And Effect Axes"
    ]
  },
  "after": {
    "claimId": "claim_b8fa7fa2cd614433de754bbb92302140",
    "sourceUnitDigest": "d08ac6f65427df6334f383a722e80ed4640fc93af7693c530ce2265d7262fcb7",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-35",
    "claimKind": "contract",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "rationale": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. L10-21: content-based rebind from reviewed prior target unheaded-block-34 (e013c5b05d6ff58782aa8231ab4a55967bd5ef853dac4015aec8f16f5fcf9c68) to unheaded-block-35 (e013c5b05d6ff58782aa8231ab4a55967bd5ef853dac4015aec8f16f5fcf9c68); inserted paragraphs shift the anchor, prior target text is unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "e013c5b05d6ff58782aa8231ab4a55967bd5ef853dac4015aec8f16f5fcf9c68",
    "targetAncestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Entry Fields And Effect Axes"
    ]
  },
  "prior": {
    "claimId": "claim_b8fa7fa2cd614433de754bbb92302140",
    "sourceUnitDigest": "d08ac6f65427df6334f383a722e80ed4640fc93af7693c530ce2265d7262fcb7",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-34",
    "claimKind": "contract",
    "disposition": "supersede",
    "reviewStatus": "reviewed",
    "rationale": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover.",
    "authoredBy": "codex-session:unit-run-1792052396770-6f1c5957@2026-10-15",
    "reviewNote": "deep: unequal digests d08ac6f6 vs e013c5b0; diff read: carrier keeps the earlier corrected externalEffect sentence (15 verbs from COMMAND_REGISTRY, no coordination) in place of the legacy see-help sentence; unchanged by this merge (target e013c5b0 before and after, anchor 33 to 34); supersede covers the corrected text",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-15",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-261015-1526-specs-ui-reworks-main-recarry.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "e013c5b05d6ff58782aa8231ab4a55967bd5ef853dac4015aec8f16f5fcf9c68",
    "targetAncestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Entry Fields And Effect Axes"
    ],
    "reviewReportCommit": "0e8ce7710ac67ad038927b242b2461876bf8c90d"
  },
  "targetWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-35",
    "githubAnchor": "unheaded-block-35",
    "stableAnchor": "unheaded-block-35",
    "title": "Unheaded block 35",
    "startLine": 322,
    "endLine": 336,
    "textDigest": "e013c5b05d6ff58782aa8231ab4a55967bd5ef853dac4015aec8f16f5fcf9c68",
    "sample": "- `name`, cách gọi, mô tả một dòng, lược đồ tham số, ví dụ, `deprecated`\n  (null hoặc chuỗi hướng dẫn deprecation; CLI renderer cũng chấp nhận metadata\n  cấu trúc để không rò `unde",
    "identityFingerprint": "a2e363fadb4249200e60df2aadad52b9400844e58930f9461c17ddb0feb33e8d",
    "ancestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Entry Fields And Effect Axes"
    ],
    "text": "- `name`, cách gọi, mô tả một dòng, lược đồ tham số, ví dụ, `deprecated`\n  (null hoặc chuỗi hướng dẫn deprecation; CLI renderer cũng chấp nhận metadata\n  cấu trúc để không rò `undefined`/`[object Object]` nếu schema tương lai mở rộng).\n- **`touchesState`** (verb có bao giờ ghi trạng thái fgOS) và\n  **`externalEffect`** (verb có bao giờ gọi dịch vụ ngoài fgOS) — hai trục\n  độc lập thay cho `access` cũ (từng gộp hai câu hỏi vào một giá trị,\n  sai cho `review`: nó khai `mutation` chỉ vì `--github` tạo PR thật, dù\n  bản thân `review` không hề ghi trạng thái). Danh sách hiện hành mang `externalEffect: true` lấy từ manifest\n  `COMMAND_REGISTRY` qua `fgos --help --json`: 15 verb, không có\n  `coordination` (ví dụ `review`, `approve`, `run` — dispatch executor thật\n  tính là effect ngoài `.fgos/`).\n- `paginated` (xem trên) và `multiValueFormat` (dưới) khi áp dụng.\n- `subcommands` cho verb có sub-verb ở vị trí đầu: `{<sub>: {description,\n  parameters, examples}}`, mỗi sub-verb chỉ mang cờ nó thật sự đọc;\n  `parameters` cấp verb khi đó chỉ còn `sub`."
  },
  "relatedClaimId": "claim_b8fa7fa2cd614433de754bbb92302140",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_b8fa7fa2cd614433de754bbb92302140",
    "sourceUnitDigest": "d08ac6f65427df6334f383a722e80ed4640fc93af7693c530ce2265d7262fcb7",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-35",
    "claimKind": "contract",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "rationale": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. L10-21: content-based rebind from reviewed prior target unheaded-block-34 (e013c5b05d6ff58782aa8231ab4a55967bd5ef853dac4015aec8f16f5fcf9c68) to unheaded-block-35 (e013c5b05d6ff58782aa8231ab4a55967bd5ef853dac4015aec8f16f5fcf9c68); inserted paragraphs shift the anchor, prior target text is unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "e013c5b05d6ff58782aa8231ab4a55967bd5ef853dac4015aec8f16f5fcf9c68",
    "targetAncestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Entry Fields And Effect Axes"
    ]
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-35",
    "githubAnchor": "unheaded-block-35",
    "stableAnchor": "unheaded-block-35",
    "title": "Unheaded block 35",
    "startLine": 322,
    "endLine": 336,
    "textDigest": "e013c5b05d6ff58782aa8231ab4a55967bd5ef853dac4015aec8f16f5fcf9c68",
    "sample": "- `name`, cách gọi, mô tả một dòng, lược đồ tham số, ví dụ, `deprecated`\n  (null hoặc chuỗi hướng dẫn deprecation; CLI renderer cũng chấp nhận metadata\n  cấu trúc để không rò `unde",
    "identityFingerprint": "a2e363fadb4249200e60df2aadad52b9400844e58930f9461c17ddb0feb33e8d",
    "ancestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Entry Fields And Effect Axes"
    ],
    "text": "- `name`, cách gọi, mô tả một dòng, lược đồ tham số, ví dụ, `deprecated`\n  (null hoặc chuỗi hướng dẫn deprecation; CLI renderer cũng chấp nhận metadata\n  cấu trúc để không rò `undefined`/`[object Object]` nếu schema tương lai mở rộng).\n- **`touchesState`** (verb có bao giờ ghi trạng thái fgOS) và\n  **`externalEffect`** (verb có bao giờ gọi dịch vụ ngoài fgOS) — hai trục\n  độc lập thay cho `access` cũ (từng gộp hai câu hỏi vào một giá trị,\n  sai cho `review`: nó khai `mutation` chỉ vì `--github` tạo PR thật, dù\n  bản thân `review` không hề ghi trạng thái). Danh sách hiện hành mang `externalEffect: true` lấy từ manifest\n  `COMMAND_REGISTRY` qua `fgos --help --json`: 15 verb, không có\n  `coordination` (ví dụ `review`, `approve`, `run` — dispatch executor thật\n  tính là effect ngoài `.fgos/`).\n- `paginated` (xem trên) và `multiValueFormat` (dưới) khi áp dụng.\n- `subcommands` cho verb có sub-verb ở vị trí đầu: `{<sub>: {description,\n  parameters, examples}}`, mỗi sub-verb chỉ mang cờ nó thật sự đọc;\n  `parameters` cấp verb khi đó chỉ còn `sub`."
  },
  "oldAnchor": "unheaded-block-34",
  "newAnchor": "unheaded-block-35",
  "oldDigest": "e013c5b05d6ff58782aa8231ab4a55967bd5ef853dac4015aec8f16f5fcf9c68",
  "newDigest": "e013c5b05d6ff58782aa8231ab4a55967bd5ef853dac4015aec8f16f5fcf9c68",
  "deepRequired": true,
  "helper": "scripts/doc-binding-repair.mjs",
  "contentProof": {
    "priorCommit": "ab4d6274a",
    "priorMatchingUnits": [
      {
        "unitKind": "unheaded-block",
        "anchor": "unheaded-block-34",
        "githubAnchor": "unheaded-block-34",
        "stableAnchor": "unheaded-block-34",
        "title": "Unheaded block 34",
        "startLine": 312,
        "endLine": 326,
        "textDigest": "e013c5b05d6ff58782aa8231ab4a55967bd5ef853dac4015aec8f16f5fcf9c68",
        "sample": "- `name`, cách gọi, mô tả một dòng, lược đồ tham số, ví dụ, `deprecated`\n  (null hoặc chuỗi hướng dẫn deprecation; CLI renderer cũng chấp nhận metadata\n  cấu trúc để không rò `unde",
        "identityFingerprint": "a2e363fadb4249200e60df2aadad52b9400844e58930f9461c17ddb0feb33e8d",
        "ancestry": [
          "CLI I/O Contract",
          "7. Machine-Readable Verb Registry",
          "Entry Fields And Effect Axes"
        ],
        "text": "- `name`, cách gọi, mô tả một dòng, lược đồ tham số, ví dụ, `deprecated`\n  (null hoặc chuỗi hướng dẫn deprecation; CLI renderer cũng chấp nhận metadata\n  cấu trúc để không rò `undefined`/`[object Object]` nếu schema tương lai mở rộng).\n- **`touchesState`** (verb có bao giờ ghi trạng thái fgOS) và\n  **`externalEffect`** (verb có bao giờ gọi dịch vụ ngoài fgOS) — hai trục\n  độc lập thay cho `access` cũ (từng gộp hai câu hỏi vào một giá trị,\n  sai cho `review`: nó khai `mutation` chỉ vì `--github` tạo PR thật, dù\n  bản thân `review` không hề ghi trạng thái). Danh sách hiện hành mang `externalEffect: true` lấy từ manifest\n  `COMMAND_REGISTRY` qua `fgos --help --json`: 15 verb, không có\n  `coordination` (ví dụ `review`, `approve`, `run` — dispatch executor thật\n  tính là effect ngoài `.fgos/`).\n- `paginated` (xem trên) và `multiValueFormat` (dưới) khi áp dụng.\n- `subcommands` cho verb có sub-verb ở vị trí đầu: `{<sub>: {description,\n  parameters, examples}}`, mỗi sub-verb chỉ mang cờ nó thật sự đọc;\n  `parameters` cấp verb khi đó chỉ còn `sub`."
      }
    ],
    "currentText": "- `name`, cách gọi, mô tả một dòng, lược đồ tham số, ví dụ, `deprecated`\n  (null hoặc chuỗi hướng dẫn deprecation; CLI renderer cũng chấp nhận metadata\n  cấu trúc để không rò `undefined`/`[object Object]` nếu schema tương lai mở rộng).\n- **`touchesState`** (verb có bao giờ ghi trạng thái fgOS) và\n  **`externalEffect`** (verb có bao giờ gọi dịch vụ ngoài fgOS) — hai trục\n  độc lập thay cho `access` cũ (từng gộp hai câu hỏi vào một giá trị,\n  sai cho `review`: nó khai `mutation` chỉ vì `--github` tạo PR thật, dù\n  bản thân `review` không hề ghi trạng thái). Danh sách hiện hành mang `externalEffect: true` lấy từ manifest\n  `COMMAND_REGISTRY` qua `fgos --help --json`: 15 verb, không có\n  `coordination` (ví dụ `review`, `approve`, `run` — dispatch executor thật\n  tính là effect ngoài `.fgos/`).\n- `paginated` (xem trên) và `multiValueFormat` (dưới) khi áp dụng.\n- `subcommands` cho verb có sub-verb ở vị trí đầu: `{<sub>: {description,\n  parameters, examples}}`, mỗi sub-verb chỉ mang cờ nó thật sự đọc;\n  `parameters` cấp verb khi đó chỉ còn `sub`.",
    "allPriorMatchingTextsEqualCurrent": true,
    "helperReplayed": true
  },
  "reviewScope": "Re-anchor receipt; claim verdict belongs to decisions section.",
  "packagedBy": "codex-session:unit-run-1792094246578-b2fbe39b@2026-10-16",
  "currentContentCommit": "345f15d95663260976200be66d1b9a6c648bcd6d",
  "entryId": "anchors-028"
}
```

## Entry anchors-029

```json
{
  "kind": "content-reanchoring-proof",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s5-root-boundary-sync.json",
  "collection": "claims",
  "before": {
    "claimId": "claim_9c7dc2d7af79db454e4d63ffffe3d6f6",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "sourceUnitDigest": "878d708db7a0afb3e23a0829f98be122c83ac562946b51ab1989e73e5e4a8bfe",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-30",
    "claimKind": "contract",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "rationale": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetUnitDigest": "b82a558166f118f339210d9a475214042a603bd09f64a3a2a8795d96fbdf57ce",
    "targetAncestry": [
      "CLI I/O Contract",
      "6. Cursor Pagination"
    ]
  },
  "after": {
    "claimId": "claim_9c7dc2d7af79db454e4d63ffffe3d6f6",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "sourceUnitDigest": "878d708db7a0afb3e23a0829f98be122c83ac562946b51ab1989e73e5e4a8bfe",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-31",
    "claimKind": "contract",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "rationale": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. L10-21: content-based rebind from reviewed prior target unheaded-block-30 (878d708db7a0afb3e23a0829f98be122c83ac562946b51ab1989e73e5e4a8bfe) to unheaded-block-31 (878d708db7a0afb3e23a0829f98be122c83ac562946b51ab1989e73e5e4a8bfe); inserted paragraphs shift the anchor, prior target text is unchanged.",
    "targetUnitDigest": "878d708db7a0afb3e23a0829f98be122c83ac562946b51ab1989e73e5e4a8bfe",
    "targetAncestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Manifest Shape"
    ]
  },
  "prior": {
    "claimId": "claim_9c7dc2d7af79db454e4d63ffffe3d6f6",
    "authoredBy": "codex-session:unit-run-1792052396770-6f1c5957@2026-10-15",
    "sourceUnitDigest": "878d708db7a0afb3e23a0829f98be122c83ac562946b51ab1989e73e5e4a8bfe",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-30",
    "claimKind": "contract",
    "disposition": "supersede",
    "reviewStatus": "reviewed",
    "rationale": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover.",
    "reviewNote": "mechanical: legacy work-state block 66 (878d708d) byte-equal to carrier block 30; digests recompute; anchor shift 29 to 30; supersede unchanged; anchor and ancestry checks pass; pending, no approval fields",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-15",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-261015-1526-specs-ui-reworks-main-recarry.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "878d708db7a0afb3e23a0829f98be122c83ac562946b51ab1989e73e5e4a8bfe",
    "targetAncestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Manifest Shape"
    ],
    "reviewReportCommit": "0e8ce7710ac67ad038927b242b2461876bf8c90d"
  },
  "targetWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-31",
    "githubAnchor": "unheaded-block-31",
    "stableAnchor": "unheaded-block-31",
    "title": "Unheaded block 31",
    "startLine": 269,
    "endLine": 284,
    "textDigest": "878d708db7a0afb3e23a0829f98be122c83ac562946b51ab1989e73e5e4a8bfe",
    "sample": "CLI công bố **toàn bộ mặt verb** dưới dạng một sổ máy-đọc: gọi trợ giúp ở dạng\nmáy-đọc trả `{schema_version, commands: […]}` (`schema_version` hiện hành\n`'3.0'` — tăng từ `'2.0'` k",
    "identityFingerprint": "32c6dad9c72451cefbaa2daad7d5abc2f6a32ee533e487fb41a7ca37f6994400",
    "ancestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Manifest Shape"
    ],
    "text": "CLI công bố **toàn bộ mặt verb** dưới dạng một sổ máy-đọc: gọi trợ giúp ở dạng\nmáy-đọc trả `{schema_version, commands: […]}` (`schema_version` hiện hành\n`'3.0'` — tăng từ `'2.0'` khi cờ của verb có sub-verb dời vào\n`subcommands`, xem ngay dưới; `'2.0'` từng tăng từ `'1.0'` vì một trường bị\nxoá, per str46-io-contract), mỗi mục mô tả một verb — `name`, cách gọi, mô tả một dòng,\nlược đồ tham số (cờ/positional), ví dụ, và ô `deprecated`. Sổ này để một\nlistener/giao diện **sinh** khung lệnh và khung form từ manifest thay vì\nhard-code từng verb. Bản thân sổ verb là **siêu dữ liệu về CLI**, KHÔNG bọc\ntrong phong bì `data` (nó mô tả CLI, không phải kết quả một verb). Dạng trợ\ngiúp thường (không máy-đọc) in cùng thông tin ở dạng chữ cho người đọc. Với\nmột tham số CHỈ nhận qua vị trí trên dòng lệnh (positional — vd `text` của\n`submit`, đọc từ đối số đầu, không bao giờ qua một cờ `--text`), sổ verb\nđánh dấu riêng tham số đó là positional; dạng trợ giúp chữ cho người đọc in\ndòng \"positional: `<tên>`\" cho tham số này, KHÔNG BAO GIỜ in nhầm thành\n\"required: `--<tên>`\" như một cờ thật — một tham số vừa nhận positional vừa\nnhận qua cờ (vd `id` của `discover`/`take`) in cả hai dạng phân biệt (per str77-79-doc-gap-fixes / ea8b9a8d — RUL54 (sổ verb máy-đọc không in nhầm tham số positional thành cờ bắt buộc))."
  },
  "relatedClaimId": "claim_9c7dc2d7af79db454e4d63ffffe3d6f6",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_9c7dc2d7af79db454e4d63ffffe3d6f6",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "sourceUnitDigest": "878d708db7a0afb3e23a0829f98be122c83ac562946b51ab1989e73e5e4a8bfe",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-31",
    "claimKind": "contract",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "rationale": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. L10-21: content-based rebind from reviewed prior target unheaded-block-30 (878d708db7a0afb3e23a0829f98be122c83ac562946b51ab1989e73e5e4a8bfe) to unheaded-block-31 (878d708db7a0afb3e23a0829f98be122c83ac562946b51ab1989e73e5e4a8bfe); inserted paragraphs shift the anchor, prior target text is unchanged.",
    "targetUnitDigest": "878d708db7a0afb3e23a0829f98be122c83ac562946b51ab1989e73e5e4a8bfe",
    "targetAncestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Manifest Shape"
    ]
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-31",
    "githubAnchor": "unheaded-block-31",
    "stableAnchor": "unheaded-block-31",
    "title": "Unheaded block 31",
    "startLine": 269,
    "endLine": 284,
    "textDigest": "878d708db7a0afb3e23a0829f98be122c83ac562946b51ab1989e73e5e4a8bfe",
    "sample": "CLI công bố **toàn bộ mặt verb** dưới dạng một sổ máy-đọc: gọi trợ giúp ở dạng\nmáy-đọc trả `{schema_version, commands: […]}` (`schema_version` hiện hành\n`'3.0'` — tăng từ `'2.0'` k",
    "identityFingerprint": "32c6dad9c72451cefbaa2daad7d5abc2f6a32ee533e487fb41a7ca37f6994400",
    "ancestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Manifest Shape"
    ],
    "text": "CLI công bố **toàn bộ mặt verb** dưới dạng một sổ máy-đọc: gọi trợ giúp ở dạng\nmáy-đọc trả `{schema_version, commands: […]}` (`schema_version` hiện hành\n`'3.0'` — tăng từ `'2.0'` khi cờ của verb có sub-verb dời vào\n`subcommands`, xem ngay dưới; `'2.0'` từng tăng từ `'1.0'` vì một trường bị\nxoá, per str46-io-contract), mỗi mục mô tả một verb — `name`, cách gọi, mô tả một dòng,\nlược đồ tham số (cờ/positional), ví dụ, và ô `deprecated`. Sổ này để một\nlistener/giao diện **sinh** khung lệnh và khung form từ manifest thay vì\nhard-code từng verb. Bản thân sổ verb là **siêu dữ liệu về CLI**, KHÔNG bọc\ntrong phong bì `data` (nó mô tả CLI, không phải kết quả một verb). Dạng trợ\ngiúp thường (không máy-đọc) in cùng thông tin ở dạng chữ cho người đọc. Với\nmột tham số CHỈ nhận qua vị trí trên dòng lệnh (positional — vd `text` của\n`submit`, đọc từ đối số đầu, không bao giờ qua một cờ `--text`), sổ verb\nđánh dấu riêng tham số đó là positional; dạng trợ giúp chữ cho người đọc in\ndòng \"positional: `<tên>`\" cho tham số này, KHÔNG BAO GIỜ in nhầm thành\n\"required: `--<tên>`\" như một cờ thật — một tham số vừa nhận positional vừa\nnhận qua cờ (vd `id` của `discover`/`take`) in cả hai dạng phân biệt (per str77-79-doc-gap-fixes / ea8b9a8d — RUL54 (sổ verb máy-đọc không in nhầm tham số positional thành cờ bắt buộc))."
  },
  "oldAnchor": "unheaded-block-30",
  "newAnchor": "unheaded-block-31",
  "oldDigest": "878d708db7a0afb3e23a0829f98be122c83ac562946b51ab1989e73e5e4a8bfe",
  "newDigest": "878d708db7a0afb3e23a0829f98be122c83ac562946b51ab1989e73e5e4a8bfe",
  "deepRequired": true,
  "helper": "scripts/doc-binding-repair.mjs",
  "contentProof": {
    "priorCommit": "ab4d6274a",
    "priorMatchingUnits": [
      {
        "unitKind": "unheaded-block",
        "anchor": "unheaded-block-30",
        "githubAnchor": "unheaded-block-30",
        "stableAnchor": "unheaded-block-30",
        "title": "Unheaded block 30",
        "startLine": 259,
        "endLine": 274,
        "textDigest": "878d708db7a0afb3e23a0829f98be122c83ac562946b51ab1989e73e5e4a8bfe",
        "sample": "CLI công bố **toàn bộ mặt verb** dưới dạng một sổ máy-đọc: gọi trợ giúp ở dạng\nmáy-đọc trả `{schema_version, commands: […]}` (`schema_version` hiện hành\n`'3.0'` — tăng từ `'2.0'` k",
        "identityFingerprint": "32c6dad9c72451cefbaa2daad7d5abc2f6a32ee533e487fb41a7ca37f6994400",
        "ancestry": [
          "CLI I/O Contract",
          "7. Machine-Readable Verb Registry",
          "Manifest Shape"
        ],
        "text": "CLI công bố **toàn bộ mặt verb** dưới dạng một sổ máy-đọc: gọi trợ giúp ở dạng\nmáy-đọc trả `{schema_version, commands: […]}` (`schema_version` hiện hành\n`'3.0'` — tăng từ `'2.0'` khi cờ của verb có sub-verb dời vào\n`subcommands`, xem ngay dưới; `'2.0'` từng tăng từ `'1.0'` vì một trường bị\nxoá, per str46-io-contract), mỗi mục mô tả một verb — `name`, cách gọi, mô tả một dòng,\nlược đồ tham số (cờ/positional), ví dụ, và ô `deprecated`. Sổ này để một\nlistener/giao diện **sinh** khung lệnh và khung form từ manifest thay vì\nhard-code từng verb. Bản thân sổ verb là **siêu dữ liệu về CLI**, KHÔNG bọc\ntrong phong bì `data` (nó mô tả CLI, không phải kết quả một verb). Dạng trợ\ngiúp thường (không máy-đọc) in cùng thông tin ở dạng chữ cho người đọc. Với\nmột tham số CHỈ nhận qua vị trí trên dòng lệnh (positional — vd `text` của\n`submit`, đọc từ đối số đầu, không bao giờ qua một cờ `--text`), sổ verb\nđánh dấu riêng tham số đó là positional; dạng trợ giúp chữ cho người đọc in\ndòng \"positional: `<tên>`\" cho tham số này, KHÔNG BAO GIỜ in nhầm thành\n\"required: `--<tên>`\" như một cờ thật — một tham số vừa nhận positional vừa\nnhận qua cờ (vd `id` của `discover`/`take`) in cả hai dạng phân biệt (per str77-79-doc-gap-fixes / ea8b9a8d — RUL54 (sổ verb máy-đọc không in nhầm tham số positional thành cờ bắt buộc))."
      }
    ],
    "currentText": "CLI công bố **toàn bộ mặt verb** dưới dạng một sổ máy-đọc: gọi trợ giúp ở dạng\nmáy-đọc trả `{schema_version, commands: […]}` (`schema_version` hiện hành\n`'3.0'` — tăng từ `'2.0'` khi cờ của verb có sub-verb dời vào\n`subcommands`, xem ngay dưới; `'2.0'` từng tăng từ `'1.0'` vì một trường bị\nxoá, per str46-io-contract), mỗi mục mô tả một verb — `name`, cách gọi, mô tả một dòng,\nlược đồ tham số (cờ/positional), ví dụ, và ô `deprecated`. Sổ này để một\nlistener/giao diện **sinh** khung lệnh và khung form từ manifest thay vì\nhard-code từng verb. Bản thân sổ verb là **siêu dữ liệu về CLI**, KHÔNG bọc\ntrong phong bì `data` (nó mô tả CLI, không phải kết quả một verb). Dạng trợ\ngiúp thường (không máy-đọc) in cùng thông tin ở dạng chữ cho người đọc. Với\nmột tham số CHỈ nhận qua vị trí trên dòng lệnh (positional — vd `text` của\n`submit`, đọc từ đối số đầu, không bao giờ qua một cờ `--text`), sổ verb\nđánh dấu riêng tham số đó là positional; dạng trợ giúp chữ cho người đọc in\ndòng \"positional: `<tên>`\" cho tham số này, KHÔNG BAO GIỜ in nhầm thành\n\"required: `--<tên>`\" như một cờ thật — một tham số vừa nhận positional vừa\nnhận qua cờ (vd `id` của `discover`/`take`) in cả hai dạng phân biệt (per str77-79-doc-gap-fixes / ea8b9a8d — RUL54 (sổ verb máy-đọc không in nhầm tham số positional thành cờ bắt buộc)).",
    "allPriorMatchingTextsEqualCurrent": true,
    "helperReplayed": true
  },
  "reviewScope": "Re-anchor receipt; claim verdict belongs to decisions section.",
  "packagedBy": "codex-session:unit-run-1792094246578-b2fbe39b@2026-10-16",
  "currentContentCommit": "345f15d95663260976200be66d1b9a6c648bcd6d",
  "entryId": "anchors-029"
}
```

## Entry anchors-030

```json
{
  "kind": "content-reanchoring-proof",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s5-root-boundary-sync.json",
  "collection": "claims",
  "before": {
    "claimId": "claim_045b588f4d839f90c40b48fbc0fc3f4d",
    "sourceUnitDigest": "a5128895b71f07c2e1baa3ecb90cd302f016fdb4191518ef02835a768c8dc156",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-31",
    "claimKind": "specification",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "rationale": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetUnitDigest": "878d708db7a0afb3e23a0829f98be122c83ac562946b51ab1989e73e5e4a8bfe",
    "targetAncestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Manifest Shape"
    ]
  },
  "after": {
    "claimId": "claim_045b588f4d839f90c40b48fbc0fc3f4d",
    "sourceUnitDigest": "a5128895b71f07c2e1baa3ecb90cd302f016fdb4191518ef02835a768c8dc156",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-32",
    "claimKind": "specification",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "rationale": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. L10-21: content-based rebind from reviewed prior target unheaded-block-31 (a5128895b71f07c2e1baa3ecb90cd302f016fdb4191518ef02835a768c8dc156) to unheaded-block-32 (a5128895b71f07c2e1baa3ecb90cd302f016fdb4191518ef02835a768c8dc156); inserted paragraphs shift the anchor, prior target text is unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "a5128895b71f07c2e1baa3ecb90cd302f016fdb4191518ef02835a768c8dc156",
    "targetAncestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Manifest Shape"
    ]
  },
  "prior": {
    "claimId": "claim_045b588f4d839f90c40b48fbc0fc3f4d",
    "sourceUnitDigest": "a5128895b71f07c2e1baa3ecb90cd302f016fdb4191518ef02835a768c8dc156",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-31",
    "claimKind": "specification",
    "disposition": "supersede",
    "reviewStatus": "reviewed",
    "rationale": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover.",
    "authoredBy": "codex-session:unit-run-1792052396770-6f1c5957@2026-10-15",
    "reviewNote": "mechanical: legacy work-state block 67 (a5128895) byte-equal to carrier block 31; digests recompute; anchor shift 30 to 31; supersede unchanged; pending, no approval fields",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-15",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-261015-1526-specs-ui-reworks-main-recarry.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "a5128895b71f07c2e1baa3ecb90cd302f016fdb4191518ef02835a768c8dc156",
    "targetAncestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Manifest Shape"
    ],
    "reviewReportCommit": "0e8ce7710ac67ad038927b242b2461876bf8c90d"
  },
  "targetWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-32",
    "githubAnchor": "unheaded-block-32",
    "stableAnchor": "unheaded-block-32",
    "title": "Unheaded block 32",
    "startLine": 286,
    "endLine": 297,
    "textDigest": "a5128895b71f07c2e1baa3ecb90cd302f016fdb4191518ef02835a768c8dc156",
    "sample": "**Sub-verb (lane help của plan two-doors-one-rununit, 2026-10-14).** Verb\ncó sub-verb ở vị trí đầu (`dispatch`, `workflow`, `merge`, `session`,\n`gateway`, `goal`, `tool`, `agents`,",
    "identityFingerprint": "c3dddccd9f6b4e83539167b84ac8eac025517acefb8eb3a2ef306bb667383064",
    "ancestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Manifest Shape"
    ],
    "text": "**Sub-verb (lane help của plan two-doors-one-rununit, 2026-10-14).** Verb\ncó sub-verb ở vị trí đầu (`dispatch`, `workflow`, `merge`, `session`,\n`gateway`, `goal`, `tool`, `agents`, và verb chạy ở Rust host `metrics`,\n`friction`, `convention`) mang thêm `subcommands: {<sub>: {description,\nparameters, examples}}` — `parameters` của từng sub-verb chỉ chứa cờ mà\nsub-verb đó thật sự đọc, cùng dạng `{type, properties, required,\npositional?}`. `parameters` cấp verb của các verb này chỉ còn `sub` (enum\nđúng bằng các khoá của `subcommands`, sinh ra từ đó — một nguồn). Schema\ntừng sub-verb khớp cờ handler thật đọc, hai chiều (test\n`test/cli/subcommand-flag-drift.test.mjs`, quét tĩnh mã nguồn; với verb\nRust host thì đối chiếu `AVAILABLE_SUBCOMMANDS` và cờ trong mã Rust của\nsub-verb đó)."
  },
  "relatedClaimId": "claim_045b588f4d839f90c40b48fbc0fc3f4d",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_045b588f4d839f90c40b48fbc0fc3f4d",
    "sourceUnitDigest": "a5128895b71f07c2e1baa3ecb90cd302f016fdb4191518ef02835a768c8dc156",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-32",
    "claimKind": "specification",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "rationale": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. L10-21: content-based rebind from reviewed prior target unheaded-block-31 (a5128895b71f07c2e1baa3ecb90cd302f016fdb4191518ef02835a768c8dc156) to unheaded-block-32 (a5128895b71f07c2e1baa3ecb90cd302f016fdb4191518ef02835a768c8dc156); inserted paragraphs shift the anchor, prior target text is unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "a5128895b71f07c2e1baa3ecb90cd302f016fdb4191518ef02835a768c8dc156",
    "targetAncestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Manifest Shape"
    ]
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-32",
    "githubAnchor": "unheaded-block-32",
    "stableAnchor": "unheaded-block-32",
    "title": "Unheaded block 32",
    "startLine": 286,
    "endLine": 297,
    "textDigest": "a5128895b71f07c2e1baa3ecb90cd302f016fdb4191518ef02835a768c8dc156",
    "sample": "**Sub-verb (lane help của plan two-doors-one-rununit, 2026-10-14).** Verb\ncó sub-verb ở vị trí đầu (`dispatch`, `workflow`, `merge`, `session`,\n`gateway`, `goal`, `tool`, `agents`,",
    "identityFingerprint": "c3dddccd9f6b4e83539167b84ac8eac025517acefb8eb3a2ef306bb667383064",
    "ancestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Manifest Shape"
    ],
    "text": "**Sub-verb (lane help của plan two-doors-one-rununit, 2026-10-14).** Verb\ncó sub-verb ở vị trí đầu (`dispatch`, `workflow`, `merge`, `session`,\n`gateway`, `goal`, `tool`, `agents`, và verb chạy ở Rust host `metrics`,\n`friction`, `convention`) mang thêm `subcommands: {<sub>: {description,\nparameters, examples}}` — `parameters` của từng sub-verb chỉ chứa cờ mà\nsub-verb đó thật sự đọc, cùng dạng `{type, properties, required,\npositional?}`. `parameters` cấp verb của các verb này chỉ còn `sub` (enum\nđúng bằng các khoá của `subcommands`, sinh ra từ đó — một nguồn). Schema\ntừng sub-verb khớp cờ handler thật đọc, hai chiều (test\n`test/cli/subcommand-flag-drift.test.mjs`, quét tĩnh mã nguồn; với verb\nRust host thì đối chiếu `AVAILABLE_SUBCOMMANDS` và cờ trong mã Rust của\nsub-verb đó)."
  },
  "oldAnchor": "unheaded-block-31",
  "newAnchor": "unheaded-block-32",
  "oldDigest": "a5128895b71f07c2e1baa3ecb90cd302f016fdb4191518ef02835a768c8dc156",
  "newDigest": "a5128895b71f07c2e1baa3ecb90cd302f016fdb4191518ef02835a768c8dc156",
  "deepRequired": true,
  "helper": "scripts/doc-binding-repair.mjs",
  "contentProof": {
    "priorCommit": "ab4d6274a",
    "priorMatchingUnits": [
      {
        "unitKind": "unheaded-block",
        "anchor": "unheaded-block-31",
        "githubAnchor": "unheaded-block-31",
        "stableAnchor": "unheaded-block-31",
        "title": "Unheaded block 31",
        "startLine": 276,
        "endLine": 287,
        "textDigest": "a5128895b71f07c2e1baa3ecb90cd302f016fdb4191518ef02835a768c8dc156",
        "sample": "**Sub-verb (lane help của plan two-doors-one-rununit, 2026-10-14).** Verb\ncó sub-verb ở vị trí đầu (`dispatch`, `workflow`, `merge`, `session`,\n`gateway`, `goal`, `tool`, `agents`,",
        "identityFingerprint": "c3dddccd9f6b4e83539167b84ac8eac025517acefb8eb3a2ef306bb667383064",
        "ancestry": [
          "CLI I/O Contract",
          "7. Machine-Readable Verb Registry",
          "Manifest Shape"
        ],
        "text": "**Sub-verb (lane help của plan two-doors-one-rununit, 2026-10-14).** Verb\ncó sub-verb ở vị trí đầu (`dispatch`, `workflow`, `merge`, `session`,\n`gateway`, `goal`, `tool`, `agents`, và verb chạy ở Rust host `metrics`,\n`friction`, `convention`) mang thêm `subcommands: {<sub>: {description,\nparameters, examples}}` — `parameters` của từng sub-verb chỉ chứa cờ mà\nsub-verb đó thật sự đọc, cùng dạng `{type, properties, required,\npositional?}`. `parameters` cấp verb của các verb này chỉ còn `sub` (enum\nđúng bằng các khoá của `subcommands`, sinh ra từ đó — một nguồn). Schema\ntừng sub-verb khớp cờ handler thật đọc, hai chiều (test\n`test/cli/subcommand-flag-drift.test.mjs`, quét tĩnh mã nguồn; với verb\nRust host thì đối chiếu `AVAILABLE_SUBCOMMANDS` và cờ trong mã Rust của\nsub-verb đó)."
      }
    ],
    "currentText": "**Sub-verb (lane help của plan two-doors-one-rununit, 2026-10-14).** Verb\ncó sub-verb ở vị trí đầu (`dispatch`, `workflow`, `merge`, `session`,\n`gateway`, `goal`, `tool`, `agents`, và verb chạy ở Rust host `metrics`,\n`friction`, `convention`) mang thêm `subcommands: {<sub>: {description,\nparameters, examples}}` — `parameters` của từng sub-verb chỉ chứa cờ mà\nsub-verb đó thật sự đọc, cùng dạng `{type, properties, required,\npositional?}`. `parameters` cấp verb của các verb này chỉ còn `sub` (enum\nđúng bằng các khoá của `subcommands`, sinh ra từ đó — một nguồn). Schema\ntừng sub-verb khớp cờ handler thật đọc, hai chiều (test\n`test/cli/subcommand-flag-drift.test.mjs`, quét tĩnh mã nguồn; với verb\nRust host thì đối chiếu `AVAILABLE_SUBCOMMANDS` và cờ trong mã Rust của\nsub-verb đó).",
    "allPriorMatchingTextsEqualCurrent": true,
    "helperReplayed": true
  },
  "reviewScope": "Re-anchor receipt; claim verdict belongs to decisions section.",
  "packagedBy": "codex-session:unit-run-1792094246578-b2fbe39b@2026-10-16",
  "currentContentCommit": "345f15d95663260976200be66d1b9a6c648bcd6d",
  "entryId": "anchors-030"
}
```

## Entry anchors-031

```json
{
  "kind": "content-reanchoring-proof",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s5-root-boundary-sync.json",
  "collection": "claims",
  "before": {
    "claimId": "claim_e8c37a28267ca355475a2286b90ba453",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "sourceUnitDigest": "7cb2dbfd3b698c923c15d17222daf08e96f5fcbf54aa79afd3e1248fdd8d9b2e",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-38",
    "claimKind": "contract",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "rationale": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetUnitDigest": "a8eaefe3669a194a9fa84ca8fa92d4d58a5f7c8405e4d7c970fac1ce183148a5",
    "targetAncestry": [
      "CLI I/O Contract",
      "8. Multi-Value Flag Convention"
    ]
  },
  "after": {
    "claimId": "claim_e8c37a28267ca355475a2286b90ba453",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "sourceUnitDigest": "7cb2dbfd3b698c923c15d17222daf08e96f5fcbf54aa79afd3e1248fdd8d9b2e",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-39",
    "claimKind": "contract",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "rationale": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. L10-21: content-based rebind from reviewed prior target unheaded-block-38 (7cb2dbfd3b698c923c15d17222daf08e96f5fcbf54aa79afd3e1248fdd8d9b2e) to unheaded-block-39 (7cb2dbfd3b698c923c15d17222daf08e96f5fcbf54aa79afd3e1248fdd8d9b2e); inserted paragraphs shift the anchor, prior target text is unchanged.",
    "targetUnitDigest": "7cb2dbfd3b698c923c15d17222daf08e96f5fcbf54aa79afd3e1248fdd8d9b2e",
    "targetAncestry": [
      "CLI I/O Contract",
      "9. Per-Verb Help"
    ]
  },
  "prior": {
    "claimId": "claim_e8c37a28267ca355475a2286b90ba453",
    "authoredBy": "codex-session:unit-run-1792052396770-6f1c5957@2026-10-15",
    "sourceUnitDigest": "7cb2dbfd3b698c923c15d17222daf08e96f5fcbf54aa79afd3e1248fdd8d9b2e",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-38",
    "claimKind": "contract",
    "disposition": "supersede",
    "reviewStatus": "reviewed",
    "rationale": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover.",
    "reviewNote": "mechanical: legacy work-state block 71 (7cb2dbfd) byte-equal to carrier block 38; digests recompute; anchor shift 37 to 38; supersede unchanged; pending, no approval fields",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-15",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-261015-1526-specs-ui-reworks-main-recarry.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "7cb2dbfd3b698c923c15d17222daf08e96f5fcbf54aa79afd3e1248fdd8d9b2e",
    "targetAncestry": [
      "CLI I/O Contract",
      "9. Per-Verb Help"
    ],
    "reviewReportCommit": "0e8ce7710ac67ad038927b242b2461876bf8c90d"
  },
  "targetWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-39",
    "githubAnchor": "unheaded-block-39",
    "stableAnchor": "unheaded-block-39",
    "title": "Unheaded block 39",
    "startLine": 360,
    "endLine": 365,
    "textDigest": "7cb2dbfd3b698c923c15d17222daf08e96f5fcbf54aa79afd3e1248fdd8d9b2e",
    "sample": "Gọi `--help` (hoặc `-h`) SAU tên một verb cụ thể (vd `fgos submit\n--help`) in đúng mục trợ giúp của RIÊNG verb đó (cách gọi, mô tả, tham số,\nví dụ) — không phải toàn bộ sổ verb. Áp",
    "identityFingerprint": "77aa7806dddff77fc090234e473475a502ada0a2a61fcd16e9115f59463f4562",
    "ancestry": [
      "CLI I/O Contract",
      "9. Per-Verb Help"
    ],
    "text": "Gọi `--help` (hoặc `-h`) SAU tên một verb cụ thể (vd `fgos submit\n--help`) in đúng mục trợ giúp của RIÊNG verb đó (cách gọi, mô tả, tham số,\nví dụ) — không phải toàn bộ sổ verb. Áp dụng ĐỒNG NHẤT cho mọi verb, kể cả\n`init` và verb chạy ở Rust host (`version`, `metrics`, `friction`,\n`convention`, `gate-bypass`): Rust host giao mọi lời gọi có token help cho\npayload Node, nơi giữ sổ verb, thay vì chạy verb."
  },
  "relatedClaimId": "claim_e8c37a28267ca355475a2286b90ba453",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_e8c37a28267ca355475a2286b90ba453",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "sourceUnitDigest": "7cb2dbfd3b698c923c15d17222daf08e96f5fcbf54aa79afd3e1248fdd8d9b2e",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-39",
    "claimKind": "contract",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "rationale": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. L10-21: content-based rebind from reviewed prior target unheaded-block-38 (7cb2dbfd3b698c923c15d17222daf08e96f5fcbf54aa79afd3e1248fdd8d9b2e) to unheaded-block-39 (7cb2dbfd3b698c923c15d17222daf08e96f5fcbf54aa79afd3e1248fdd8d9b2e); inserted paragraphs shift the anchor, prior target text is unchanged.",
    "targetUnitDigest": "7cb2dbfd3b698c923c15d17222daf08e96f5fcbf54aa79afd3e1248fdd8d9b2e",
    "targetAncestry": [
      "CLI I/O Contract",
      "9. Per-Verb Help"
    ]
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-39",
    "githubAnchor": "unheaded-block-39",
    "stableAnchor": "unheaded-block-39",
    "title": "Unheaded block 39",
    "startLine": 360,
    "endLine": 365,
    "textDigest": "7cb2dbfd3b698c923c15d17222daf08e96f5fcbf54aa79afd3e1248fdd8d9b2e",
    "sample": "Gọi `--help` (hoặc `-h`) SAU tên một verb cụ thể (vd `fgos submit\n--help`) in đúng mục trợ giúp của RIÊNG verb đó (cách gọi, mô tả, tham số,\nví dụ) — không phải toàn bộ sổ verb. Áp",
    "identityFingerprint": "77aa7806dddff77fc090234e473475a502ada0a2a61fcd16e9115f59463f4562",
    "ancestry": [
      "CLI I/O Contract",
      "9. Per-Verb Help"
    ],
    "text": "Gọi `--help` (hoặc `-h`) SAU tên một verb cụ thể (vd `fgos submit\n--help`) in đúng mục trợ giúp của RIÊNG verb đó (cách gọi, mô tả, tham số,\nví dụ) — không phải toàn bộ sổ verb. Áp dụng ĐỒNG NHẤT cho mọi verb, kể cả\n`init` và verb chạy ở Rust host (`version`, `metrics`, `friction`,\n`convention`, `gate-bypass`): Rust host giao mọi lời gọi có token help cho\npayload Node, nơi giữ sổ verb, thay vì chạy verb."
  },
  "oldAnchor": "unheaded-block-38",
  "newAnchor": "unheaded-block-39",
  "oldDigest": "7cb2dbfd3b698c923c15d17222daf08e96f5fcbf54aa79afd3e1248fdd8d9b2e",
  "newDigest": "7cb2dbfd3b698c923c15d17222daf08e96f5fcbf54aa79afd3e1248fdd8d9b2e",
  "deepRequired": true,
  "helper": "scripts/doc-binding-repair.mjs",
  "contentProof": {
    "priorCommit": "ab4d6274a",
    "priorMatchingUnits": [
      {
        "unitKind": "unheaded-block",
        "anchor": "unheaded-block-38",
        "githubAnchor": "unheaded-block-38",
        "stableAnchor": "unheaded-block-38",
        "title": "Unheaded block 38",
        "startLine": 350,
        "endLine": 355,
        "textDigest": "7cb2dbfd3b698c923c15d17222daf08e96f5fcbf54aa79afd3e1248fdd8d9b2e",
        "sample": "Gọi `--help` (hoặc `-h`) SAU tên một verb cụ thể (vd `fgos submit\n--help`) in đúng mục trợ giúp của RIÊNG verb đó (cách gọi, mô tả, tham số,\nví dụ) — không phải toàn bộ sổ verb. Áp",
        "identityFingerprint": "77aa7806dddff77fc090234e473475a502ada0a2a61fcd16e9115f59463f4562",
        "ancestry": [
          "CLI I/O Contract",
          "9. Per-Verb Help"
        ],
        "text": "Gọi `--help` (hoặc `-h`) SAU tên một verb cụ thể (vd `fgos submit\n--help`) in đúng mục trợ giúp của RIÊNG verb đó (cách gọi, mô tả, tham số,\nví dụ) — không phải toàn bộ sổ verb. Áp dụng ĐỒNG NHẤT cho mọi verb, kể cả\n`init` và verb chạy ở Rust host (`version`, `metrics`, `friction`,\n`convention`, `gate-bypass`): Rust host giao mọi lời gọi có token help cho\npayload Node, nơi giữ sổ verb, thay vì chạy verb."
      }
    ],
    "currentText": "Gọi `--help` (hoặc `-h`) SAU tên một verb cụ thể (vd `fgos submit\n--help`) in đúng mục trợ giúp của RIÊNG verb đó (cách gọi, mô tả, tham số,\nví dụ) — không phải toàn bộ sổ verb. Áp dụng ĐỒNG NHẤT cho mọi verb, kể cả\n`init` và verb chạy ở Rust host (`version`, `metrics`, `friction`,\n`convention`, `gate-bypass`): Rust host giao mọi lời gọi có token help cho\npayload Node, nơi giữ sổ verb, thay vì chạy verb.",
    "allPriorMatchingTextsEqualCurrent": true,
    "helperReplayed": true
  },
  "reviewScope": "Re-anchor receipt; claim verdict belongs to decisions section.",
  "packagedBy": "codex-session:unit-run-1792094246578-b2fbe39b@2026-10-16",
  "currentContentCommit": "345f15d95663260976200be66d1b9a6c648bcd6d",
  "entryId": "anchors-031"
}
```

## Entry anchors-032

```json
{
  "kind": "content-reanchoring-proof",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s5-root-boundary-sync.json",
  "collection": "claims",
  "before": {
    "claimId": "claim_b69096018a7da1d3dc629b5d37f6fdac",
    "sourceUnitDigest": "9b711cb5a088ede56ad00207289f1fed2ccc05887597169bbc41eb2e55429db3",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-39",
    "claimKind": "specification",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "rationale": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetUnitDigest": "7cb2dbfd3b698c923c15d17222daf08e96f5fcbf54aa79afd3e1248fdd8d9b2e",
    "targetAncestry": [
      "CLI I/O Contract",
      "9. Per-Verb Help"
    ]
  },
  "after": {
    "claimId": "claim_b69096018a7da1d3dc629b5d37f6fdac",
    "sourceUnitDigest": "9b711cb5a088ede56ad00207289f1fed2ccc05887597169bbc41eb2e55429db3",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-40",
    "claimKind": "specification",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "rationale": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. L10-21: content-based rebind from reviewed prior target unheaded-block-39 (9b711cb5a088ede56ad00207289f1fed2ccc05887597169bbc41eb2e55429db3) to unheaded-block-40 (9b711cb5a088ede56ad00207289f1fed2ccc05887597169bbc41eb2e55429db3); inserted paragraphs shift the anchor, prior target text is unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "9b711cb5a088ede56ad00207289f1fed2ccc05887597169bbc41eb2e55429db3",
    "targetAncestry": [
      "CLI I/O Contract",
      "9. Per-Verb Help"
    ]
  },
  "prior": {
    "claimId": "claim_b69096018a7da1d3dc629b5d37f6fdac",
    "sourceUnitDigest": "9b711cb5a088ede56ad00207289f1fed2ccc05887597169bbc41eb2e55429db3",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-39",
    "claimKind": "specification",
    "disposition": "supersede",
    "reviewStatus": "reviewed",
    "rationale": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover.",
    "authoredBy": "codex-session:unit-run-1792052396770-6f1c5957@2026-10-15",
    "reviewNote": "deep: sampled; legacy work-state block 72 (9b711cb5) byte-equal to carrier block 39 (machine-readable help bullet read); anchor shift 38 to 39; supersede unchanged; digests, anchor and ancestry recompute; pending",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-15",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-261015-1526-specs-ui-reworks-main-recarry.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "9b711cb5a088ede56ad00207289f1fed2ccc05887597169bbc41eb2e55429db3",
    "targetAncestry": [
      "CLI I/O Contract",
      "9. Per-Verb Help"
    ],
    "reviewReportCommit": "0e8ce7710ac67ad038927b242b2461876bf8c90d"
  },
  "targetWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-40",
    "githubAnchor": "unheaded-block-40",
    "stableAnchor": "unheaded-block-40",
    "title": "Unheaded block 40",
    "startLine": 367,
    "endLine": 380,
    "textDigest": "9b711cb5a088ede56ad00207289f1fed2ccc05887597169bbc41eb2e55429db3",
    "sample": "- **Dạng máy-đọc:** kèm `--json` thì in đúng object của verb đó như trong\n  `commands[]` của sổ verb, không bọc phong bì. Với verb có sub-verb, đối\n  số vị trí đầu tiên thu hẹp mục",
    "identityFingerprint": "cc33e86f1358175bdfc8be1ff1815c56c51c055eeae3cdf43fdf3ff47c7b14f0",
    "ancestry": [
      "CLI I/O Contract",
      "9. Per-Verb Help"
    ],
    "text": "- **Dạng máy-đọc:** kèm `--json` thì in đúng object của verb đó như trong\n  `commands[]` của sổ verb, không bọc phong bì. Với verb có sub-verb, đối\n  số vị trí đầu tiên thu hẹp mục về một sub-verb (`subcommands` chỉ còn\n  sub-verb đó); sub-verb không có trong sổ → thoát mã 4, stdout rỗng. Với\n  verb không có sub-verb, đối số vị trí là đối số của verb (vd prompt của\n  `run`) và bị bỏ qua.\n- **Token help:** `--help`/`-h` đứng riêng ở BẤT KỲ vị trí nào là yêu cầu\n  trợ giúp — kể cả khi đứng sau một cờ nhận giá trị (`fgos init --dir -h`)\n  — ở cả Rust host lẫn payload Node, nên trợ giúp không bao giờ lỡ tay\n  chạy verb.\n- **Dạng đầu dòng:** `fgos --help|-h [<verb> [<sub>]] [--json] [--dir\n  <x>]` in toàn bộ sổ verb, hoặc mục của một verb/sub-verb. `--dir` (cờ hàm\n  shell `fgos` tự gắn vào mọi lời gọi) được nhận và không dùng; verb lạ,\n  sub-verb lạ, từ thừa hay option khác → thoát mã 4, stdout rỗng."
  },
  "relatedClaimId": "claim_b69096018a7da1d3dc629b5d37f6fdac",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_b69096018a7da1d3dc629b5d37f6fdac",
    "sourceUnitDigest": "9b711cb5a088ede56ad00207289f1fed2ccc05887597169bbc41eb2e55429db3",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-40",
    "claimKind": "specification",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "rationale": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. L10-21: content-based rebind from reviewed prior target unheaded-block-39 (9b711cb5a088ede56ad00207289f1fed2ccc05887597169bbc41eb2e55429db3) to unheaded-block-40 (9b711cb5a088ede56ad00207289f1fed2ccc05887597169bbc41eb2e55429db3); inserted paragraphs shift the anchor, prior target text is unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "9b711cb5a088ede56ad00207289f1fed2ccc05887597169bbc41eb2e55429db3",
    "targetAncestry": [
      "CLI I/O Contract",
      "9. Per-Verb Help"
    ]
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-40",
    "githubAnchor": "unheaded-block-40",
    "stableAnchor": "unheaded-block-40",
    "title": "Unheaded block 40",
    "startLine": 367,
    "endLine": 380,
    "textDigest": "9b711cb5a088ede56ad00207289f1fed2ccc05887597169bbc41eb2e55429db3",
    "sample": "- **Dạng máy-đọc:** kèm `--json` thì in đúng object của verb đó như trong\n  `commands[]` của sổ verb, không bọc phong bì. Với verb có sub-verb, đối\n  số vị trí đầu tiên thu hẹp mục",
    "identityFingerprint": "cc33e86f1358175bdfc8be1ff1815c56c51c055eeae3cdf43fdf3ff47c7b14f0",
    "ancestry": [
      "CLI I/O Contract",
      "9. Per-Verb Help"
    ],
    "text": "- **Dạng máy-đọc:** kèm `--json` thì in đúng object của verb đó như trong\n  `commands[]` của sổ verb, không bọc phong bì. Với verb có sub-verb, đối\n  số vị trí đầu tiên thu hẹp mục về một sub-verb (`subcommands` chỉ còn\n  sub-verb đó); sub-verb không có trong sổ → thoát mã 4, stdout rỗng. Với\n  verb không có sub-verb, đối số vị trí là đối số của verb (vd prompt của\n  `run`) và bị bỏ qua.\n- **Token help:** `--help`/`-h` đứng riêng ở BẤT KỲ vị trí nào là yêu cầu\n  trợ giúp — kể cả khi đứng sau một cờ nhận giá trị (`fgos init --dir -h`)\n  — ở cả Rust host lẫn payload Node, nên trợ giúp không bao giờ lỡ tay\n  chạy verb.\n- **Dạng đầu dòng:** `fgos --help|-h [<verb> [<sub>]] [--json] [--dir\n  <x>]` in toàn bộ sổ verb, hoặc mục của một verb/sub-verb. `--dir` (cờ hàm\n  shell `fgos` tự gắn vào mọi lời gọi) được nhận và không dùng; verb lạ,\n  sub-verb lạ, từ thừa hay option khác → thoát mã 4, stdout rỗng."
  },
  "oldAnchor": "unheaded-block-39",
  "newAnchor": "unheaded-block-40",
  "oldDigest": "9b711cb5a088ede56ad00207289f1fed2ccc05887597169bbc41eb2e55429db3",
  "newDigest": "9b711cb5a088ede56ad00207289f1fed2ccc05887597169bbc41eb2e55429db3",
  "deepRequired": true,
  "helper": "scripts/doc-binding-repair.mjs",
  "contentProof": {
    "priorCommit": "ab4d6274a",
    "priorMatchingUnits": [
      {
        "unitKind": "unheaded-block",
        "anchor": "unheaded-block-39",
        "githubAnchor": "unheaded-block-39",
        "stableAnchor": "unheaded-block-39",
        "title": "Unheaded block 39",
        "startLine": 357,
        "endLine": 370,
        "textDigest": "9b711cb5a088ede56ad00207289f1fed2ccc05887597169bbc41eb2e55429db3",
        "sample": "- **Dạng máy-đọc:** kèm `--json` thì in đúng object của verb đó như trong\n  `commands[]` của sổ verb, không bọc phong bì. Với verb có sub-verb, đối\n  số vị trí đầu tiên thu hẹp mục",
        "identityFingerprint": "cc33e86f1358175bdfc8be1ff1815c56c51c055eeae3cdf43fdf3ff47c7b14f0",
        "ancestry": [
          "CLI I/O Contract",
          "9. Per-Verb Help"
        ],
        "text": "- **Dạng máy-đọc:** kèm `--json` thì in đúng object của verb đó như trong\n  `commands[]` của sổ verb, không bọc phong bì. Với verb có sub-verb, đối\n  số vị trí đầu tiên thu hẹp mục về một sub-verb (`subcommands` chỉ còn\n  sub-verb đó); sub-verb không có trong sổ → thoát mã 4, stdout rỗng. Với\n  verb không có sub-verb, đối số vị trí là đối số của verb (vd prompt của\n  `run`) và bị bỏ qua.\n- **Token help:** `--help`/`-h` đứng riêng ở BẤT KỲ vị trí nào là yêu cầu\n  trợ giúp — kể cả khi đứng sau một cờ nhận giá trị (`fgos init --dir -h`)\n  — ở cả Rust host lẫn payload Node, nên trợ giúp không bao giờ lỡ tay\n  chạy verb.\n- **Dạng đầu dòng:** `fgos --help|-h [<verb> [<sub>]] [--json] [--dir\n  <x>]` in toàn bộ sổ verb, hoặc mục của một verb/sub-verb. `--dir` (cờ hàm\n  shell `fgos` tự gắn vào mọi lời gọi) được nhận và không dùng; verb lạ,\n  sub-verb lạ, từ thừa hay option khác → thoát mã 4, stdout rỗng."
      }
    ],
    "currentText": "- **Dạng máy-đọc:** kèm `--json` thì in đúng object của verb đó như trong\n  `commands[]` của sổ verb, không bọc phong bì. Với verb có sub-verb, đối\n  số vị trí đầu tiên thu hẹp mục về một sub-verb (`subcommands` chỉ còn\n  sub-verb đó); sub-verb không có trong sổ → thoát mã 4, stdout rỗng. Với\n  verb không có sub-verb, đối số vị trí là đối số của verb (vd prompt của\n  `run`) và bị bỏ qua.\n- **Token help:** `--help`/`-h` đứng riêng ở BẤT KỲ vị trí nào là yêu cầu\n  trợ giúp — kể cả khi đứng sau một cờ nhận giá trị (`fgos init --dir -h`)\n  — ở cả Rust host lẫn payload Node, nên trợ giúp không bao giờ lỡ tay\n  chạy verb.\n- **Dạng đầu dòng:** `fgos --help|-h [<verb> [<sub>]] [--json] [--dir\n  <x>]` in toàn bộ sổ verb, hoặc mục của một verb/sub-verb. `--dir` (cờ hàm\n  shell `fgos` tự gắn vào mọi lời gọi) được nhận và không dùng; verb lạ,\n  sub-verb lạ, từ thừa hay option khác → thoát mã 4, stdout rỗng.",
    "allPriorMatchingTextsEqualCurrent": true,
    "helperReplayed": true
  },
  "reviewScope": "Re-anchor receipt; claim verdict belongs to decisions section.",
  "packagedBy": "codex-session:unit-run-1792094246578-b2fbe39b@2026-10-16",
  "currentContentCommit": "345f15d95663260976200be66d1b9a6c648bcd6d",
  "entryId": "anchors-032"
}
```

## Entry anchors-033

```json
{
  "kind": "content-reanchoring-proof",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s5-root-boundary-sync.json",
  "collection": "registryGaps",
  "before": {
    "claimId": "claim_4217ac86de0ba075ca046202b2ce4284",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "sourceAnchor": "unheaded-block-24",
    "sourceUnitDigest": "4a338e4d813b275ce1c923da4f814881eaab30a4bdca231382fd7df5c5fe9b4a",
    "disposition": "supersede",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-25",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetUnitDigest": "cb6381a3b69f2fdd99ff81b06cafbce1f45add19c7076005c59ad0e093d49be8",
    "targetAncestry": [
      "CLI I/O Contract",
      "5. Reasoned Envelope Exceptions"
    ]
  },
  "after": {
    "claimId": "claim_4217ac86de0ba075ca046202b2ce4284",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "sourceAnchor": "unheaded-block-24",
    "sourceUnitDigest": "4a338e4d813b275ce1c923da4f814881eaab30a4bdca231382fd7df5c5fe9b4a",
    "disposition": "supersede",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-26",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "rationale": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. L10-21: content-based rebind from reviewed prior target unheaded-block-25 (f58253403717e416cd5aa169d971bc332b43ab40f16ab6845c90d959d4283221) to unheaded-block-26 (f58253403717e416cd5aa169d971bc332b43ab40f16ab6845c90d959d4283221); inserted paragraphs shift the anchor, prior target text is unchanged.",
    "targetUnitDigest": "f58253403717e416cd5aa169d971bc332b43ab40f16ab6845c90d959d4283221",
    "targetAncestry": [
      "CLI I/O Contract",
      "5. Reasoned Envelope Exceptions"
    ]
  },
  "prior": {
    "claimId": "claim_4217ac86de0ba075ca046202b2ce4284",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "sourceAnchor": "unheaded-block-24",
    "sourceUnitDigest": "4a338e4d813b275ce1c923da4f814881eaab30a4bdca231382fd7df5c5fe9b4a",
    "disposition": "supersede",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-25",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792052396770-6f1c5957@2026-10-15",
    "rationale": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover.",
    "reviewNote": "deep: gap row; old digest 4a338e4d found at c8b2d948d block 24 (exceptions list, four-item generation); successor block 25 f5825340 unchanged, anchor shift 24 to 25; word diff read: help-flag wording only; supersede unchanged",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-15",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-261015-1526-specs-ui-reworks-main-recarry.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "f58253403717e416cd5aa169d971bc332b43ab40f16ab6845c90d959d4283221",
    "targetAncestry": [
      "CLI I/O Contract",
      "5. Reasoned Envelope Exceptions"
    ],
    "reviewReportCommit": "0e8ce7710ac67ad038927b242b2461876bf8c90d"
  },
  "targetWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-26",
    "githubAnchor": "unheaded-block-26",
    "stableAnchor": "unheaded-block-26",
    "title": "Unheaded block 26",
    "startLine": 203,
    "endLine": 217,
    "textDigest": "f58253403717e416cd5aa169d971bc332b43ab40f16ab6845c90d959d4283221",
    "sample": "1. **Sổ verb máy-đọc** (`--help`/`-h`, có hoặc không `--json`, kể cả\n   `<verb> [<sub>] --help`) — siêu dữ liệu về CLI, không phải payload của\n   một verb.\n2. **`setup`/`doctor --p",
    "identityFingerprint": "4dd427bdfd5fe7ca215b47e3ecfeb8ce37ad0ed58c683df6934f67d32c373e3e",
    "ancestry": [
      "CLI I/O Contract",
      "5. Reasoned Envelope Exceptions"
    ],
    "text": "1. **Sổ verb máy-đọc** (`--help`/`-h`, có hoặc không `--json`, kể cả\n   `<verb> [<sub>] --help`) — siêu dữ liệu về CLI, không phải payload của\n   một verb.\n2. **`setup`/`doctor --pretty`** — lối thoát hiển-thị-cho-người tường minh\n   qua cờ `--pretty`, không phải payload mặc định.\n3. **Log worker** (`.fgos/logs/<id>.log`) — text trần CỐ Ý, để `tail -f`\n   thấy được ngay; bọc phong bì sẽ phá đúng công dụng đó.\n4. **Luồng progress-trace của `fgos-runner`** (gặt-lại, nhận việc, phán\n   làm-rõ/chia-việc, đuôi kết quả proof, thử lại, dừng — cộng dòng lifecycle\n   \"watch mode stopped\" khi nhận tín hiệu dừng) — in console y nguyên như\n   trước, một tính năng KHÁC (đã khoá) với hợp đồng này, không đụng.\n5. **Cửa hook thực thi agent** (`fgos hook <dispatch-decide|decision-question>`) —\n   bypass phong bì CLI và kiểm tra store admission để giữ nguyên vẹn luồng `stdin`,\n   `stdout`, `stderr` và exit code `0`/`2` cho các công cụ như Claude Code và Codex,\n   hoặc xuất JSON stdout trực tiếp cho AGY. Bọc phong bì sẽ phá vỡ giao thức chặn công cụ của agent host."
  },
  "relatedClaimId": "claim_4217ac86de0ba075ca046202b2ce4284",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_4217ac86de0ba075ca046202b2ce4284",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "sourceAnchor": "unheaded-block-24",
    "sourceUnitDigest": "4a338e4d813b275ce1c923da4f814881eaab30a4bdca231382fd7df5c5fe9b4a",
    "disposition": "supersede",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-26",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "rationale": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. L10-21: content-based rebind from reviewed prior target unheaded-block-25 (f58253403717e416cd5aa169d971bc332b43ab40f16ab6845c90d959d4283221) to unheaded-block-26 (f58253403717e416cd5aa169d971bc332b43ab40f16ab6845c90d959d4283221); inserted paragraphs shift the anchor, prior target text is unchanged.",
    "targetUnitDigest": "f58253403717e416cd5aa169d971bc332b43ab40f16ab6845c90d959d4283221",
    "targetAncestry": [
      "CLI I/O Contract",
      "5. Reasoned Envelope Exceptions"
    ]
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-26",
    "githubAnchor": "unheaded-block-26",
    "stableAnchor": "unheaded-block-26",
    "title": "Unheaded block 26",
    "startLine": 203,
    "endLine": 217,
    "textDigest": "f58253403717e416cd5aa169d971bc332b43ab40f16ab6845c90d959d4283221",
    "sample": "1. **Sổ verb máy-đọc** (`--help`/`-h`, có hoặc không `--json`, kể cả\n   `<verb> [<sub>] --help`) — siêu dữ liệu về CLI, không phải payload của\n   một verb.\n2. **`setup`/`doctor --p",
    "identityFingerprint": "4dd427bdfd5fe7ca215b47e3ecfeb8ce37ad0ed58c683df6934f67d32c373e3e",
    "ancestry": [
      "CLI I/O Contract",
      "5. Reasoned Envelope Exceptions"
    ],
    "text": "1. **Sổ verb máy-đọc** (`--help`/`-h`, có hoặc không `--json`, kể cả\n   `<verb> [<sub>] --help`) — siêu dữ liệu về CLI, không phải payload của\n   một verb.\n2. **`setup`/`doctor --pretty`** — lối thoát hiển-thị-cho-người tường minh\n   qua cờ `--pretty`, không phải payload mặc định.\n3. **Log worker** (`.fgos/logs/<id>.log`) — text trần CỐ Ý, để `tail -f`\n   thấy được ngay; bọc phong bì sẽ phá đúng công dụng đó.\n4. **Luồng progress-trace của `fgos-runner`** (gặt-lại, nhận việc, phán\n   làm-rõ/chia-việc, đuôi kết quả proof, thử lại, dừng — cộng dòng lifecycle\n   \"watch mode stopped\" khi nhận tín hiệu dừng) — in console y nguyên như\n   trước, một tính năng KHÁC (đã khoá) với hợp đồng này, không đụng.\n5. **Cửa hook thực thi agent** (`fgos hook <dispatch-decide|decision-question>`) —\n   bypass phong bì CLI và kiểm tra store admission để giữ nguyên vẹn luồng `stdin`,\n   `stdout`, `stderr` và exit code `0`/`2` cho các công cụ như Claude Code và Codex,\n   hoặc xuất JSON stdout trực tiếp cho AGY. Bọc phong bì sẽ phá vỡ giao thức chặn công cụ của agent host."
  },
  "oldAnchor": "unheaded-block-25",
  "newAnchor": "unheaded-block-26",
  "oldDigest": "f58253403717e416cd5aa169d971bc332b43ab40f16ab6845c90d959d4283221",
  "newDigest": "f58253403717e416cd5aa169d971bc332b43ab40f16ab6845c90d959d4283221",
  "deepRequired": true,
  "helper": "scripts/doc-binding-repair.mjs",
  "contentProof": {
    "priorCommit": "ab4d6274a",
    "priorMatchingUnits": [
      {
        "unitKind": "unheaded-block",
        "anchor": "unheaded-block-25",
        "githubAnchor": "unheaded-block-25",
        "stableAnchor": "unheaded-block-25",
        "title": "Unheaded block 25",
        "startLine": 193,
        "endLine": 207,
        "textDigest": "f58253403717e416cd5aa169d971bc332b43ab40f16ab6845c90d959d4283221",
        "sample": "1. **Sổ verb máy-đọc** (`--help`/`-h`, có hoặc không `--json`, kể cả\n   `<verb> [<sub>] --help`) — siêu dữ liệu về CLI, không phải payload của\n   một verb.\n2. **`setup`/`doctor --p",
        "identityFingerprint": "4dd427bdfd5fe7ca215b47e3ecfeb8ce37ad0ed58c683df6934f67d32c373e3e",
        "ancestry": [
          "CLI I/O Contract",
          "5. Reasoned Envelope Exceptions"
        ],
        "text": "1. **Sổ verb máy-đọc** (`--help`/`-h`, có hoặc không `--json`, kể cả\n   `<verb> [<sub>] --help`) — siêu dữ liệu về CLI, không phải payload của\n   một verb.\n2. **`setup`/`doctor --pretty`** — lối thoát hiển-thị-cho-người tường minh\n   qua cờ `--pretty`, không phải payload mặc định.\n3. **Log worker** (`.fgos/logs/<id>.log`) — text trần CỐ Ý, để `tail -f`\n   thấy được ngay; bọc phong bì sẽ phá đúng công dụng đó.\n4. **Luồng progress-trace của `fgos-runner`** (gặt-lại, nhận việc, phán\n   làm-rõ/chia-việc, đuôi kết quả proof, thử lại, dừng — cộng dòng lifecycle\n   \"watch mode stopped\" khi nhận tín hiệu dừng) — in console y nguyên như\n   trước, một tính năng KHÁC (đã khoá) với hợp đồng này, không đụng.\n5. **Cửa hook thực thi agent** (`fgos hook <dispatch-decide|decision-question>`) —\n   bypass phong bì CLI và kiểm tra store admission để giữ nguyên vẹn luồng `stdin`,\n   `stdout`, `stderr` và exit code `0`/`2` cho các công cụ như Claude Code và Codex,\n   hoặc xuất JSON stdout trực tiếp cho AGY. Bọc phong bì sẽ phá vỡ giao thức chặn công cụ của agent host."
      }
    ],
    "currentText": "1. **Sổ verb máy-đọc** (`--help`/`-h`, có hoặc không `--json`, kể cả\n   `<verb> [<sub>] --help`) — siêu dữ liệu về CLI, không phải payload của\n   một verb.\n2. **`setup`/`doctor --pretty`** — lối thoát hiển-thị-cho-người tường minh\n   qua cờ `--pretty`, không phải payload mặc định.\n3. **Log worker** (`.fgos/logs/<id>.log`) — text trần CỐ Ý, để `tail -f`\n   thấy được ngay; bọc phong bì sẽ phá đúng công dụng đó.\n4. **Luồng progress-trace của `fgos-runner`** (gặt-lại, nhận việc, phán\n   làm-rõ/chia-việc, đuôi kết quả proof, thử lại, dừng — cộng dòng lifecycle\n   \"watch mode stopped\" khi nhận tín hiệu dừng) — in console y nguyên như\n   trước, một tính năng KHÁC (đã khoá) với hợp đồng này, không đụng.\n5. **Cửa hook thực thi agent** (`fgos hook <dispatch-decide|decision-question>`) —\n   bypass phong bì CLI và kiểm tra store admission để giữ nguyên vẹn luồng `stdin`,\n   `stdout`, `stderr` và exit code `0`/`2` cho các công cụ như Claude Code và Codex,\n   hoặc xuất JSON stdout trực tiếp cho AGY. Bọc phong bì sẽ phá vỡ giao thức chặn công cụ của agent host.",
    "allPriorMatchingTextsEqualCurrent": true,
    "helperReplayed": true
  },
  "reviewScope": "Re-anchor receipt; claim verdict belongs to decisions section.",
  "packagedBy": "codex-session:unit-run-1792094246578-b2fbe39b@2026-10-16",
  "currentContentCommit": "345f15d95663260976200be66d1b9a6c648bcd6d",
  "entryId": "anchors-033"
}
```

## Entry anchors-034

```json
{
  "kind": "content-reanchoring-proof",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s5-root-boundary-sync.json",
  "collection": "registryGaps",
  "before": {
    "claimId": "claim_0bf4d10d1c0f4cda16abe6091d639b64",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "sourceAnchor": "unheaded-block-29",
    "sourceUnitDigest": "a2e6a5ffa58ec1f13d1321cf4b14d70b2a261fba6ce0f15c0bda50975cf8de04",
    "disposition": "supersede",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-30",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetUnitDigest": "b82a558166f118f339210d9a475214042a603bd09f64a3a2a8795d96fbdf57ce",
    "targetAncestry": [
      "CLI I/O Contract",
      "6. Cursor Pagination"
    ]
  },
  "after": {
    "claimId": "claim_0bf4d10d1c0f4cda16abe6091d639b64",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "sourceAnchor": "unheaded-block-29",
    "sourceUnitDigest": "a2e6a5ffa58ec1f13d1321cf4b14d70b2a261fba6ce0f15c0bda50975cf8de04",
    "disposition": "supersede",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-31",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "rationale": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. L10-21: content-based rebind from reviewed prior target unheaded-block-30 (878d708db7a0afb3e23a0829f98be122c83ac562946b51ab1989e73e5e4a8bfe) to unheaded-block-31 (878d708db7a0afb3e23a0829f98be122c83ac562946b51ab1989e73e5e4a8bfe); inserted paragraphs shift the anchor, prior target text is unchanged.",
    "targetUnitDigest": "878d708db7a0afb3e23a0829f98be122c83ac562946b51ab1989e73e5e4a8bfe",
    "targetAncestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Manifest Shape"
    ]
  },
  "prior": {
    "claimId": "claim_0bf4d10d1c0f4cda16abe6091d639b64",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "sourceAnchor": "unheaded-block-29",
    "sourceUnitDigest": "a2e6a5ffa58ec1f13d1321cf4b14d70b2a261fba6ce0f15c0bda50975cf8de04",
    "disposition": "supersede",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-30",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792052396770-6f1c5957@2026-10-15",
    "rationale": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover.",
    "reviewNote": "deep: gap row; old digest a2e6a5ff found at c8b2d948d block 29 (manifest paragraph with schema 2.0); successor block 30 878d708d unchanged, shift only; word diff read: 2.0 to 3.0 wording; supersede unchanged",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-15",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-261015-1526-specs-ui-reworks-main-recarry.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "878d708db7a0afb3e23a0829f98be122c83ac562946b51ab1989e73e5e4a8bfe",
    "targetAncestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Manifest Shape"
    ],
    "reviewReportCommit": "0e8ce7710ac67ad038927b242b2461876bf8c90d"
  },
  "targetWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-31",
    "githubAnchor": "unheaded-block-31",
    "stableAnchor": "unheaded-block-31",
    "title": "Unheaded block 31",
    "startLine": 269,
    "endLine": 284,
    "textDigest": "878d708db7a0afb3e23a0829f98be122c83ac562946b51ab1989e73e5e4a8bfe",
    "sample": "CLI công bố **toàn bộ mặt verb** dưới dạng một sổ máy-đọc: gọi trợ giúp ở dạng\nmáy-đọc trả `{schema_version, commands: […]}` (`schema_version` hiện hành\n`'3.0'` — tăng từ `'2.0'` k",
    "identityFingerprint": "32c6dad9c72451cefbaa2daad7d5abc2f6a32ee533e487fb41a7ca37f6994400",
    "ancestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Manifest Shape"
    ],
    "text": "CLI công bố **toàn bộ mặt verb** dưới dạng một sổ máy-đọc: gọi trợ giúp ở dạng\nmáy-đọc trả `{schema_version, commands: […]}` (`schema_version` hiện hành\n`'3.0'` — tăng từ `'2.0'` khi cờ của verb có sub-verb dời vào\n`subcommands`, xem ngay dưới; `'2.0'` từng tăng từ `'1.0'` vì một trường bị\nxoá, per str46-io-contract), mỗi mục mô tả một verb — `name`, cách gọi, mô tả một dòng,\nlược đồ tham số (cờ/positional), ví dụ, và ô `deprecated`. Sổ này để một\nlistener/giao diện **sinh** khung lệnh và khung form từ manifest thay vì\nhard-code từng verb. Bản thân sổ verb là **siêu dữ liệu về CLI**, KHÔNG bọc\ntrong phong bì `data` (nó mô tả CLI, không phải kết quả một verb). Dạng trợ\ngiúp thường (không máy-đọc) in cùng thông tin ở dạng chữ cho người đọc. Với\nmột tham số CHỈ nhận qua vị trí trên dòng lệnh (positional — vd `text` của\n`submit`, đọc từ đối số đầu, không bao giờ qua một cờ `--text`), sổ verb\nđánh dấu riêng tham số đó là positional; dạng trợ giúp chữ cho người đọc in\ndòng \"positional: `<tên>`\" cho tham số này, KHÔNG BAO GIỜ in nhầm thành\n\"required: `--<tên>`\" như một cờ thật — một tham số vừa nhận positional vừa\nnhận qua cờ (vd `id` của `discover`/`take`) in cả hai dạng phân biệt (per str77-79-doc-gap-fixes / ea8b9a8d — RUL54 (sổ verb máy-đọc không in nhầm tham số positional thành cờ bắt buộc))."
  },
  "relatedClaimId": "claim_0bf4d10d1c0f4cda16abe6091d639b64",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_0bf4d10d1c0f4cda16abe6091d639b64",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "sourceAnchor": "unheaded-block-29",
    "sourceUnitDigest": "a2e6a5ffa58ec1f13d1321cf4b14d70b2a261fba6ce0f15c0bda50975cf8de04",
    "disposition": "supersede",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-31",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "rationale": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. L10-21: content-based rebind from reviewed prior target unheaded-block-30 (878d708db7a0afb3e23a0829f98be122c83ac562946b51ab1989e73e5e4a8bfe) to unheaded-block-31 (878d708db7a0afb3e23a0829f98be122c83ac562946b51ab1989e73e5e4a8bfe); inserted paragraphs shift the anchor, prior target text is unchanged.",
    "targetUnitDigest": "878d708db7a0afb3e23a0829f98be122c83ac562946b51ab1989e73e5e4a8bfe",
    "targetAncestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Manifest Shape"
    ]
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-31",
    "githubAnchor": "unheaded-block-31",
    "stableAnchor": "unheaded-block-31",
    "title": "Unheaded block 31",
    "startLine": 269,
    "endLine": 284,
    "textDigest": "878d708db7a0afb3e23a0829f98be122c83ac562946b51ab1989e73e5e4a8bfe",
    "sample": "CLI công bố **toàn bộ mặt verb** dưới dạng một sổ máy-đọc: gọi trợ giúp ở dạng\nmáy-đọc trả `{schema_version, commands: […]}` (`schema_version` hiện hành\n`'3.0'` — tăng từ `'2.0'` k",
    "identityFingerprint": "32c6dad9c72451cefbaa2daad7d5abc2f6a32ee533e487fb41a7ca37f6994400",
    "ancestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Manifest Shape"
    ],
    "text": "CLI công bố **toàn bộ mặt verb** dưới dạng một sổ máy-đọc: gọi trợ giúp ở dạng\nmáy-đọc trả `{schema_version, commands: […]}` (`schema_version` hiện hành\n`'3.0'` — tăng từ `'2.0'` khi cờ của verb có sub-verb dời vào\n`subcommands`, xem ngay dưới; `'2.0'` từng tăng từ `'1.0'` vì một trường bị\nxoá, per str46-io-contract), mỗi mục mô tả một verb — `name`, cách gọi, mô tả một dòng,\nlược đồ tham số (cờ/positional), ví dụ, và ô `deprecated`. Sổ này để một\nlistener/giao diện **sinh** khung lệnh và khung form từ manifest thay vì\nhard-code từng verb. Bản thân sổ verb là **siêu dữ liệu về CLI**, KHÔNG bọc\ntrong phong bì `data` (nó mô tả CLI, không phải kết quả một verb). Dạng trợ\ngiúp thường (không máy-đọc) in cùng thông tin ở dạng chữ cho người đọc. Với\nmột tham số CHỈ nhận qua vị trí trên dòng lệnh (positional — vd `text` của\n`submit`, đọc từ đối số đầu, không bao giờ qua một cờ `--text`), sổ verb\nđánh dấu riêng tham số đó là positional; dạng trợ giúp chữ cho người đọc in\ndòng \"positional: `<tên>`\" cho tham số này, KHÔNG BAO GIỜ in nhầm thành\n\"required: `--<tên>`\" như một cờ thật — một tham số vừa nhận positional vừa\nnhận qua cờ (vd `id` của `discover`/`take`) in cả hai dạng phân biệt (per str77-79-doc-gap-fixes / ea8b9a8d — RUL54 (sổ verb máy-đọc không in nhầm tham số positional thành cờ bắt buộc))."
  },
  "oldAnchor": "unheaded-block-30",
  "newAnchor": "unheaded-block-31",
  "oldDigest": "878d708db7a0afb3e23a0829f98be122c83ac562946b51ab1989e73e5e4a8bfe",
  "newDigest": "878d708db7a0afb3e23a0829f98be122c83ac562946b51ab1989e73e5e4a8bfe",
  "deepRequired": true,
  "helper": "scripts/doc-binding-repair.mjs",
  "contentProof": {
    "priorCommit": "ab4d6274a",
    "priorMatchingUnits": [
      {
        "unitKind": "unheaded-block",
        "anchor": "unheaded-block-30",
        "githubAnchor": "unheaded-block-30",
        "stableAnchor": "unheaded-block-30",
        "title": "Unheaded block 30",
        "startLine": 259,
        "endLine": 274,
        "textDigest": "878d708db7a0afb3e23a0829f98be122c83ac562946b51ab1989e73e5e4a8bfe",
        "sample": "CLI công bố **toàn bộ mặt verb** dưới dạng một sổ máy-đọc: gọi trợ giúp ở dạng\nmáy-đọc trả `{schema_version, commands: […]}` (`schema_version` hiện hành\n`'3.0'` — tăng từ `'2.0'` k",
        "identityFingerprint": "32c6dad9c72451cefbaa2daad7d5abc2f6a32ee533e487fb41a7ca37f6994400",
        "ancestry": [
          "CLI I/O Contract",
          "7. Machine-Readable Verb Registry",
          "Manifest Shape"
        ],
        "text": "CLI công bố **toàn bộ mặt verb** dưới dạng một sổ máy-đọc: gọi trợ giúp ở dạng\nmáy-đọc trả `{schema_version, commands: […]}` (`schema_version` hiện hành\n`'3.0'` — tăng từ `'2.0'` khi cờ của verb có sub-verb dời vào\n`subcommands`, xem ngay dưới; `'2.0'` từng tăng từ `'1.0'` vì một trường bị\nxoá, per str46-io-contract), mỗi mục mô tả một verb — `name`, cách gọi, mô tả một dòng,\nlược đồ tham số (cờ/positional), ví dụ, và ô `deprecated`. Sổ này để một\nlistener/giao diện **sinh** khung lệnh và khung form từ manifest thay vì\nhard-code từng verb. Bản thân sổ verb là **siêu dữ liệu về CLI**, KHÔNG bọc\ntrong phong bì `data` (nó mô tả CLI, không phải kết quả một verb). Dạng trợ\ngiúp thường (không máy-đọc) in cùng thông tin ở dạng chữ cho người đọc. Với\nmột tham số CHỈ nhận qua vị trí trên dòng lệnh (positional — vd `text` của\n`submit`, đọc từ đối số đầu, không bao giờ qua một cờ `--text`), sổ verb\nđánh dấu riêng tham số đó là positional; dạng trợ giúp chữ cho người đọc in\ndòng \"positional: `<tên>`\" cho tham số này, KHÔNG BAO GIỜ in nhầm thành\n\"required: `--<tên>`\" như một cờ thật — một tham số vừa nhận positional vừa\nnhận qua cờ (vd `id` của `discover`/`take`) in cả hai dạng phân biệt (per str77-79-doc-gap-fixes / ea8b9a8d — RUL54 (sổ verb máy-đọc không in nhầm tham số positional thành cờ bắt buộc))."
      }
    ],
    "currentText": "CLI công bố **toàn bộ mặt verb** dưới dạng một sổ máy-đọc: gọi trợ giúp ở dạng\nmáy-đọc trả `{schema_version, commands: […]}` (`schema_version` hiện hành\n`'3.0'` — tăng từ `'2.0'` khi cờ của verb có sub-verb dời vào\n`subcommands`, xem ngay dưới; `'2.0'` từng tăng từ `'1.0'` vì một trường bị\nxoá, per str46-io-contract), mỗi mục mô tả một verb — `name`, cách gọi, mô tả một dòng,\nlược đồ tham số (cờ/positional), ví dụ, và ô `deprecated`. Sổ này để một\nlistener/giao diện **sinh** khung lệnh và khung form từ manifest thay vì\nhard-code từng verb. Bản thân sổ verb là **siêu dữ liệu về CLI**, KHÔNG bọc\ntrong phong bì `data` (nó mô tả CLI, không phải kết quả một verb). Dạng trợ\ngiúp thường (không máy-đọc) in cùng thông tin ở dạng chữ cho người đọc. Với\nmột tham số CHỈ nhận qua vị trí trên dòng lệnh (positional — vd `text` của\n`submit`, đọc từ đối số đầu, không bao giờ qua một cờ `--text`), sổ verb\nđánh dấu riêng tham số đó là positional; dạng trợ giúp chữ cho người đọc in\ndòng \"positional: `<tên>`\" cho tham số này, KHÔNG BAO GIỜ in nhầm thành\n\"required: `--<tên>`\" như một cờ thật — một tham số vừa nhận positional vừa\nnhận qua cờ (vd `id` của `discover`/`take`) in cả hai dạng phân biệt (per str77-79-doc-gap-fixes / ea8b9a8d — RUL54 (sổ verb máy-đọc không in nhầm tham số positional thành cờ bắt buộc)).",
    "allPriorMatchingTextsEqualCurrent": true,
    "helperReplayed": true
  },
  "reviewScope": "Re-anchor receipt; claim verdict belongs to decisions section.",
  "packagedBy": "codex-session:unit-run-1792094246578-b2fbe39b@2026-10-16",
  "currentContentCommit": "345f15d95663260976200be66d1b9a6c648bcd6d",
  "entryId": "anchors-034"
}
```

## Entry anchors-035

```json
{
  "kind": "content-reanchoring-proof",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s5-root-boundary-sync.json",
  "collection": "registryGaps",
  "before": {
    "claimId": "claim_bc055098a9e2bedf2ed30ab0dfcacf79",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "sourceAnchor": "unheaded-block-30",
    "sourceUnitDigest": "83773dda67db8d5f71205bb8c7106186023672125b08cbe4f33b09b0578163ca",
    "disposition": "supersede",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-32",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetUnitDigest": "a5128895b71f07c2e1baa3ecb90cd302f016fdb4191518ef02835a768c8dc156",
    "targetAncestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Manifest Shape"
    ]
  },
  "after": {
    "claimId": "claim_bc055098a9e2bedf2ed30ab0dfcacf79",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "sourceAnchor": "unheaded-block-30",
    "sourceUnitDigest": "83773dda67db8d5f71205bb8c7106186023672125b08cbe4f33b09b0578163ca",
    "disposition": "supersede",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-33",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "rationale": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. L10-21: content-based rebind from reviewed prior target unheaded-block-32 (51dd3c8aa026a8f5a15e4c12c522b3bf2ad7c29238c49bf9ba51324806e10e23) to unheaded-block-33 (51dd3c8aa026a8f5a15e4c12c522b3bf2ad7c29238c49bf9ba51324806e10e23); inserted paragraphs shift the anchor, prior target text is unchanged.",
    "targetUnitDigest": "51dd3c8aa026a8f5a15e4c12c522b3bf2ad7c29238c49bf9ba51324806e10e23",
    "targetAncestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Manifest Shape"
    ]
  },
  "prior": {
    "claimId": "claim_bc055098a9e2bedf2ed30ab0dfcacf79",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "sourceAnchor": "unheaded-block-30",
    "sourceUnitDigest": "83773dda67db8d5f71205bb8c7106186023672125b08cbe4f33b09b0578163ca",
    "disposition": "supersede",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-32",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792052396770-6f1c5957@2026-10-15",
    "rationale": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover.",
    "reviewNote": "deep: gap row; old digest 83773dda found at c8b2d948d block 30; successor block 32 51dd3c8a unchanged, shift only; word diff read: 2.0 to 3.0 and the verb-entry sentences; supersede unchanged",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-15",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-261015-1526-specs-ui-reworks-main-recarry.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "51dd3c8aa026a8f5a15e4c12c522b3bf2ad7c29238c49bf9ba51324806e10e23",
    "targetAncestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Manifest Shape"
    ],
    "reviewReportCommit": "0e8ce7710ac67ad038927b242b2461876bf8c90d"
  },
  "targetWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-33",
    "githubAnchor": "unheaded-block-33",
    "stableAnchor": "unheaded-block-33",
    "title": "Unheaded block 33",
    "startLine": 299,
    "endLine": 306,
    "textDigest": "51dd3c8aa026a8f5a15e4c12c522b3bf2ad7c29238c49bf9ba51324806e10e23",
    "sample": "`fgos --help --json` trả `{schema_version, commands: […]}` — CLI công bố\ntoàn bộ mặt verb để một listener/giao diện **sinh** khung lệnh từ manifest\nthay vì hard-code từng verb. `sc",
    "identityFingerprint": "49d3e9858947d27fe5eed264949a7b4b22caed396f6bebb112a9eae50fa460fd",
    "ancestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Manifest Shape"
    ],
    "text": "`fgos --help --json` trả `{schema_version, commands: […]}` — CLI công bố\ntoàn bộ mặt verb để một listener/giao diện **sinh** khung lệnh từ manifest\nthay vì hard-code từng verb. `schema_version` hiện `'3.0'` (tăng từ `'2.0'`\nkhi cờ của verb có sub-verb dời vào `subcommands`; `'2.0'` từng tăng từ\n`'1.0'` vì trường `access` bị xoá). `fgos <verb> [<sub>] --help --json` trả\nriêng mục của một verb (thu hẹp về một sub-verb khi có), cùng hình dạng một\nphần tử `commands[]`. Cả hai chạy được qua Rust host ở mọi project và không\nbao giờ chạy verb. Mỗi mục verb mang:"
  },
  "relatedClaimId": "claim_bc055098a9e2bedf2ed30ab0dfcacf79",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_bc055098a9e2bedf2ed30ab0dfcacf79",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "sourceAnchor": "unheaded-block-30",
    "sourceUnitDigest": "83773dda67db8d5f71205bb8c7106186023672125b08cbe4f33b09b0578163ca",
    "disposition": "supersede",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-33",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "rationale": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. L10-21: content-based rebind from reviewed prior target unheaded-block-32 (51dd3c8aa026a8f5a15e4c12c522b3bf2ad7c29238c49bf9ba51324806e10e23) to unheaded-block-33 (51dd3c8aa026a8f5a15e4c12c522b3bf2ad7c29238c49bf9ba51324806e10e23); inserted paragraphs shift the anchor, prior target text is unchanged.",
    "targetUnitDigest": "51dd3c8aa026a8f5a15e4c12c522b3bf2ad7c29238c49bf9ba51324806e10e23",
    "targetAncestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Manifest Shape"
    ]
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-33",
    "githubAnchor": "unheaded-block-33",
    "stableAnchor": "unheaded-block-33",
    "title": "Unheaded block 33",
    "startLine": 299,
    "endLine": 306,
    "textDigest": "51dd3c8aa026a8f5a15e4c12c522b3bf2ad7c29238c49bf9ba51324806e10e23",
    "sample": "`fgos --help --json` trả `{schema_version, commands: […]}` — CLI công bố\ntoàn bộ mặt verb để một listener/giao diện **sinh** khung lệnh từ manifest\nthay vì hard-code từng verb. `sc",
    "identityFingerprint": "49d3e9858947d27fe5eed264949a7b4b22caed396f6bebb112a9eae50fa460fd",
    "ancestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Manifest Shape"
    ],
    "text": "`fgos --help --json` trả `{schema_version, commands: […]}` — CLI công bố\ntoàn bộ mặt verb để một listener/giao diện **sinh** khung lệnh từ manifest\nthay vì hard-code từng verb. `schema_version` hiện `'3.0'` (tăng từ `'2.0'`\nkhi cờ của verb có sub-verb dời vào `subcommands`; `'2.0'` từng tăng từ\n`'1.0'` vì trường `access` bị xoá). `fgos <verb> [<sub>] --help --json` trả\nriêng mục của một verb (thu hẹp về một sub-verb khi có), cùng hình dạng một\nphần tử `commands[]`. Cả hai chạy được qua Rust host ở mọi project và không\nbao giờ chạy verb. Mỗi mục verb mang:"
  },
  "oldAnchor": "unheaded-block-32",
  "newAnchor": "unheaded-block-33",
  "oldDigest": "51dd3c8aa026a8f5a15e4c12c522b3bf2ad7c29238c49bf9ba51324806e10e23",
  "newDigest": "51dd3c8aa026a8f5a15e4c12c522b3bf2ad7c29238c49bf9ba51324806e10e23",
  "deepRequired": true,
  "helper": "scripts/doc-binding-repair.mjs",
  "contentProof": {
    "priorCommit": "ab4d6274a",
    "priorMatchingUnits": [
      {
        "unitKind": "unheaded-block",
        "anchor": "unheaded-block-32",
        "githubAnchor": "unheaded-block-32",
        "stableAnchor": "unheaded-block-32",
        "title": "Unheaded block 32",
        "startLine": 289,
        "endLine": 296,
        "textDigest": "51dd3c8aa026a8f5a15e4c12c522b3bf2ad7c29238c49bf9ba51324806e10e23",
        "sample": "`fgos --help --json` trả `{schema_version, commands: […]}` — CLI công bố\ntoàn bộ mặt verb để một listener/giao diện **sinh** khung lệnh từ manifest\nthay vì hard-code từng verb. `sc",
        "identityFingerprint": "49d3e9858947d27fe5eed264949a7b4b22caed396f6bebb112a9eae50fa460fd",
        "ancestry": [
          "CLI I/O Contract",
          "7. Machine-Readable Verb Registry",
          "Manifest Shape"
        ],
        "text": "`fgos --help --json` trả `{schema_version, commands: […]}` — CLI công bố\ntoàn bộ mặt verb để một listener/giao diện **sinh** khung lệnh từ manifest\nthay vì hard-code từng verb. `schema_version` hiện `'3.0'` (tăng từ `'2.0'`\nkhi cờ của verb có sub-verb dời vào `subcommands`; `'2.0'` từng tăng từ\n`'1.0'` vì trường `access` bị xoá). `fgos <verb> [<sub>] --help --json` trả\nriêng mục của một verb (thu hẹp về một sub-verb khi có), cùng hình dạng một\nphần tử `commands[]`. Cả hai chạy được qua Rust host ở mọi project và không\nbao giờ chạy verb. Mỗi mục verb mang:"
      }
    ],
    "currentText": "`fgos --help --json` trả `{schema_version, commands: […]}` — CLI công bố\ntoàn bộ mặt verb để một listener/giao diện **sinh** khung lệnh từ manifest\nthay vì hard-code từng verb. `schema_version` hiện `'3.0'` (tăng từ `'2.0'`\nkhi cờ của verb có sub-verb dời vào `subcommands`; `'2.0'` từng tăng từ\n`'1.0'` vì trường `access` bị xoá). `fgos <verb> [<sub>] --help --json` trả\nriêng mục của một verb (thu hẹp về một sub-verb khi có), cùng hình dạng một\nphần tử `commands[]`. Cả hai chạy được qua Rust host ở mọi project và không\nbao giờ chạy verb. Mỗi mục verb mang:",
    "allPriorMatchingTextsEqualCurrent": true,
    "helperReplayed": true
  },
  "reviewScope": "Re-anchor receipt; claim verdict belongs to decisions section.",
  "packagedBy": "codex-session:unit-run-1792094246578-b2fbe39b@2026-10-16",
  "currentContentCommit": "345f15d95663260976200be66d1b9a6c648bcd6d",
  "entryId": "anchors-035"
}
```

## Entry anchors-036

```json
{
  "kind": "content-reanchoring-proof",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s5-root-historical-gaps.json",
  "collection": "registryGaps",
  "before": {
    "claimId": "claim_b92ac199356ff830e5554647ab143a90",
    "sourcePath": "docs/io-contract.md",
    "sourceAnchor": "unheaded-block-14",
    "sourceUnitDigest": "e24cc26161b017265526e8e287d7ddb0777cabce83f1effd56099a3ea79814e5",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-24",
    "rationale": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetUnitDigest": "131cc0704d753f35dcbec3ebba7be49a0d103732b6f4ee8c5ecc175d5c46167e",
    "targetAncestry": [
      "CLI I/O Contract",
      "4. Exit Codes"
    ]
  },
  "after": {
    "claimId": "claim_b92ac199356ff830e5554647ab143a90",
    "sourcePath": "docs/io-contract.md",
    "sourceAnchor": "unheaded-block-14",
    "sourceUnitDigest": "e24cc26161b017265526e8e287d7ddb0777cabce83f1effd56099a3ea79814e5",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-25",
    "rationale": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. L10-21: content-based rebind from reviewed prior target unheaded-block-24 (cb6381a3b69f2fdd99ff81b06cafbce1f45add19c7076005c59ad0e093d49be8) to unheaded-block-25 (cb6381a3b69f2fdd99ff81b06cafbce1f45add19c7076005c59ad0e093d49be8); inserted paragraphs shift the anchor, prior target text is unchanged.",
    "targetUnitDigest": "cb6381a3b69f2fdd99ff81b06cafbce1f45add19c7076005c59ad0e093d49be8",
    "targetAncestry": [
      "CLI I/O Contract",
      "5. Reasoned Envelope Exceptions"
    ]
  },
  "prior": {
    "claimId": "claim_b92ac199356ff830e5554647ab143a90",
    "sourcePath": "docs/io-contract.md",
    "sourceAnchor": "unheaded-block-14",
    "sourceUnitDigest": "e24cc26161b017265526e8e287d7ddb0777cabce83f1effd56099a3ea79814e5",
    "disposition": "supersede",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792052396770-6f1c5957@2026-10-15",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-24",
    "rationale": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover.",
    "reviewNote": "deep: gap row; old digest e24cc261 found at 05d6fc7ca io-contract block 14 (four-stream sentence); successor block 24 cb6381a3 unchanged, shift 23 to 24; word diff read: Four to Five streams only; supersede unchanged",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-15",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-261015-1526-specs-ui-reworks-main-recarry.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "cb6381a3b69f2fdd99ff81b06cafbce1f45add19c7076005c59ad0e093d49be8",
    "targetAncestry": [
      "CLI I/O Contract",
      "5. Reasoned Envelope Exceptions"
    ],
    "reviewReportCommit": "0e8ce7710ac67ad038927b242b2461876bf8c90d"
  },
  "targetWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-25",
    "githubAnchor": "unheaded-block-25",
    "stableAnchor": "unheaded-block-25",
    "title": "Unheaded block 25",
    "startLine": 200,
    "endLine": 201,
    "textDigest": "cb6381a3b69f2fdd99ff81b06cafbce1f45add19c7076005c59ad0e093d49be8",
    "sample": "Năm luồng KHÔNG bọc phong bì, mỗi luồng mang một lý do riêng — dùng chung\nđúng một chữ, \"ngoại lệ có lý do\", không gọi tuỳ hứng theo từng chỗ:",
    "identityFingerprint": "a329378df55a88a211d803b53fce8d8b4b954eb4cacd1f78dfc353e97b20d783",
    "ancestry": [
      "CLI I/O Contract",
      "5. Reasoned Envelope Exceptions"
    ],
    "text": "Năm luồng KHÔNG bọc phong bì, mỗi luồng mang một lý do riêng — dùng chung\nđúng một chữ, \"ngoại lệ có lý do\", không gọi tuỳ hứng theo từng chỗ:"
  },
  "relatedClaimId": "claim_b92ac199356ff830e5554647ab143a90",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_b92ac199356ff830e5554647ab143a90",
    "sourcePath": "docs/io-contract.md",
    "sourceAnchor": "unheaded-block-14",
    "sourceUnitDigest": "e24cc26161b017265526e8e287d7ddb0777cabce83f1effd56099a3ea79814e5",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-25",
    "rationale": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. L10-21: content-based rebind from reviewed prior target unheaded-block-24 (cb6381a3b69f2fdd99ff81b06cafbce1f45add19c7076005c59ad0e093d49be8) to unheaded-block-25 (cb6381a3b69f2fdd99ff81b06cafbce1f45add19c7076005c59ad0e093d49be8); inserted paragraphs shift the anchor, prior target text is unchanged.",
    "targetUnitDigest": "cb6381a3b69f2fdd99ff81b06cafbce1f45add19c7076005c59ad0e093d49be8",
    "targetAncestry": [
      "CLI I/O Contract",
      "5. Reasoned Envelope Exceptions"
    ]
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-25",
    "githubAnchor": "unheaded-block-25",
    "stableAnchor": "unheaded-block-25",
    "title": "Unheaded block 25",
    "startLine": 200,
    "endLine": 201,
    "textDigest": "cb6381a3b69f2fdd99ff81b06cafbce1f45add19c7076005c59ad0e093d49be8",
    "sample": "Năm luồng KHÔNG bọc phong bì, mỗi luồng mang một lý do riêng — dùng chung\nđúng một chữ, \"ngoại lệ có lý do\", không gọi tuỳ hứng theo từng chỗ:",
    "identityFingerprint": "a329378df55a88a211d803b53fce8d8b4b954eb4cacd1f78dfc353e97b20d783",
    "ancestry": [
      "CLI I/O Contract",
      "5. Reasoned Envelope Exceptions"
    ],
    "text": "Năm luồng KHÔNG bọc phong bì, mỗi luồng mang một lý do riêng — dùng chung\nđúng một chữ, \"ngoại lệ có lý do\", không gọi tuỳ hứng theo từng chỗ:"
  },
  "oldAnchor": "unheaded-block-24",
  "newAnchor": "unheaded-block-25",
  "oldDigest": "cb6381a3b69f2fdd99ff81b06cafbce1f45add19c7076005c59ad0e093d49be8",
  "newDigest": "cb6381a3b69f2fdd99ff81b06cafbce1f45add19c7076005c59ad0e093d49be8",
  "deepRequired": true,
  "helper": "scripts/doc-binding-repair.mjs",
  "contentProof": {
    "priorCommit": "ab4d6274a",
    "priorMatchingUnits": [
      {
        "unitKind": "unheaded-block",
        "anchor": "unheaded-block-24",
        "githubAnchor": "unheaded-block-24",
        "stableAnchor": "unheaded-block-24",
        "title": "Unheaded block 24",
        "startLine": 190,
        "endLine": 191,
        "textDigest": "cb6381a3b69f2fdd99ff81b06cafbce1f45add19c7076005c59ad0e093d49be8",
        "sample": "Năm luồng KHÔNG bọc phong bì, mỗi luồng mang một lý do riêng — dùng chung\nđúng một chữ, \"ngoại lệ có lý do\", không gọi tuỳ hứng theo từng chỗ:",
        "identityFingerprint": "a329378df55a88a211d803b53fce8d8b4b954eb4cacd1f78dfc353e97b20d783",
        "ancestry": [
          "CLI I/O Contract",
          "5. Reasoned Envelope Exceptions"
        ],
        "text": "Năm luồng KHÔNG bọc phong bì, mỗi luồng mang một lý do riêng — dùng chung\nđúng một chữ, \"ngoại lệ có lý do\", không gọi tuỳ hứng theo từng chỗ:"
      }
    ],
    "currentText": "Năm luồng KHÔNG bọc phong bì, mỗi luồng mang một lý do riêng — dùng chung\nđúng một chữ, \"ngoại lệ có lý do\", không gọi tuỳ hứng theo từng chỗ:",
    "allPriorMatchingTextsEqualCurrent": true,
    "helperReplayed": true
  },
  "reviewScope": "Re-anchor receipt; claim verdict belongs to decisions section.",
  "packagedBy": "codex-session:unit-run-1792094246578-b2fbe39b@2026-10-16",
  "currentContentCommit": "345f15d95663260976200be66d1b9a6c648bcd6d",
  "entryId": "anchors-036"
}
```

## Entry anchors-037

```json
{
  "kind": "content-reanchoring-proof",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s5-root-historical-gaps.json",
  "collection": "registryGaps",
  "before": {
    "claimId": "claim_6a8087a3f502f37f9c7b729e871bee9c",
    "sourcePath": "docs/io-contract.md",
    "sourceAnchor": "unheaded-block-15",
    "sourceUnitDigest": "74809b036d96332c8fd99e73be67a5abacbef4b899eb741b946b39aed1ce1fa6",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-25",
    "rationale": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetUnitDigest": "cb6381a3b69f2fdd99ff81b06cafbce1f45add19c7076005c59ad0e093d49be8",
    "targetAncestry": [
      "CLI I/O Contract",
      "5. Reasoned Envelope Exceptions"
    ]
  },
  "after": {
    "claimId": "claim_6a8087a3f502f37f9c7b729e871bee9c",
    "sourcePath": "docs/io-contract.md",
    "sourceAnchor": "unheaded-block-15",
    "sourceUnitDigest": "74809b036d96332c8fd99e73be67a5abacbef4b899eb741b946b39aed1ce1fa6",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-26",
    "rationale": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. L10-21: content-based rebind from reviewed prior target unheaded-block-25 (f58253403717e416cd5aa169d971bc332b43ab40f16ab6845c90d959d4283221) to unheaded-block-26 (f58253403717e416cd5aa169d971bc332b43ab40f16ab6845c90d959d4283221); inserted paragraphs shift the anchor, prior target text is unchanged.",
    "targetUnitDigest": "f58253403717e416cd5aa169d971bc332b43ab40f16ab6845c90d959d4283221",
    "targetAncestry": [
      "CLI I/O Contract",
      "5. Reasoned Envelope Exceptions"
    ]
  },
  "prior": {
    "claimId": "claim_6a8087a3f502f37f9c7b729e871bee9c",
    "sourcePath": "docs/io-contract.md",
    "sourceAnchor": "unheaded-block-15",
    "sourceUnitDigest": "74809b036d96332c8fd99e73be67a5abacbef4b899eb741b946b39aed1ce1fa6",
    "disposition": "supersede",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792052396770-6f1c5957@2026-10-15",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-25",
    "rationale": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover.",
    "reviewNote": "deep: gap row; old digest 74809b03 found at 05d6fc7ca io-contract block 15 (exceptions list); successor block 25 f5825340 now the five-item list; word diff read: help-flag wording and the added fifth item (agent hook door); anchor shift 24 to 25 verified; supersede unchanged",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-15",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-261015-1526-specs-ui-reworks-main-recarry.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "f58253403717e416cd5aa169d971bc332b43ab40f16ab6845c90d959d4283221",
    "targetAncestry": [
      "CLI I/O Contract",
      "5. Reasoned Envelope Exceptions"
    ],
    "reviewReportCommit": "0e8ce7710ac67ad038927b242b2461876bf8c90d"
  },
  "targetWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-26",
    "githubAnchor": "unheaded-block-26",
    "stableAnchor": "unheaded-block-26",
    "title": "Unheaded block 26",
    "startLine": 203,
    "endLine": 217,
    "textDigest": "f58253403717e416cd5aa169d971bc332b43ab40f16ab6845c90d959d4283221",
    "sample": "1. **Sổ verb máy-đọc** (`--help`/`-h`, có hoặc không `--json`, kể cả\n   `<verb> [<sub>] --help`) — siêu dữ liệu về CLI, không phải payload của\n   một verb.\n2. **`setup`/`doctor --p",
    "identityFingerprint": "4dd427bdfd5fe7ca215b47e3ecfeb8ce37ad0ed58c683df6934f67d32c373e3e",
    "ancestry": [
      "CLI I/O Contract",
      "5. Reasoned Envelope Exceptions"
    ],
    "text": "1. **Sổ verb máy-đọc** (`--help`/`-h`, có hoặc không `--json`, kể cả\n   `<verb> [<sub>] --help`) — siêu dữ liệu về CLI, không phải payload của\n   một verb.\n2. **`setup`/`doctor --pretty`** — lối thoát hiển-thị-cho-người tường minh\n   qua cờ `--pretty`, không phải payload mặc định.\n3. **Log worker** (`.fgos/logs/<id>.log`) — text trần CỐ Ý, để `tail -f`\n   thấy được ngay; bọc phong bì sẽ phá đúng công dụng đó.\n4. **Luồng progress-trace của `fgos-runner`** (gặt-lại, nhận việc, phán\n   làm-rõ/chia-việc, đuôi kết quả proof, thử lại, dừng — cộng dòng lifecycle\n   \"watch mode stopped\" khi nhận tín hiệu dừng) — in console y nguyên như\n   trước, một tính năng KHÁC (đã khoá) với hợp đồng này, không đụng.\n5. **Cửa hook thực thi agent** (`fgos hook <dispatch-decide|decision-question>`) —\n   bypass phong bì CLI và kiểm tra store admission để giữ nguyên vẹn luồng `stdin`,\n   `stdout`, `stderr` và exit code `0`/`2` cho các công cụ như Claude Code và Codex,\n   hoặc xuất JSON stdout trực tiếp cho AGY. Bọc phong bì sẽ phá vỡ giao thức chặn công cụ của agent host."
  },
  "relatedClaimId": "claim_6a8087a3f502f37f9c7b729e871bee9c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_6a8087a3f502f37f9c7b729e871bee9c",
    "sourcePath": "docs/io-contract.md",
    "sourceAnchor": "unheaded-block-15",
    "sourceUnitDigest": "74809b036d96332c8fd99e73be67a5abacbef4b899eb741b946b39aed1ce1fa6",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-26",
    "rationale": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. L10-21: content-based rebind from reviewed prior target unheaded-block-25 (f58253403717e416cd5aa169d971bc332b43ab40f16ab6845c90d959d4283221) to unheaded-block-26 (f58253403717e416cd5aa169d971bc332b43ab40f16ab6845c90d959d4283221); inserted paragraphs shift the anchor, prior target text is unchanged.",
    "targetUnitDigest": "f58253403717e416cd5aa169d971bc332b43ab40f16ab6845c90d959d4283221",
    "targetAncestry": [
      "CLI I/O Contract",
      "5. Reasoned Envelope Exceptions"
    ]
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-26",
    "githubAnchor": "unheaded-block-26",
    "stableAnchor": "unheaded-block-26",
    "title": "Unheaded block 26",
    "startLine": 203,
    "endLine": 217,
    "textDigest": "f58253403717e416cd5aa169d971bc332b43ab40f16ab6845c90d959d4283221",
    "sample": "1. **Sổ verb máy-đọc** (`--help`/`-h`, có hoặc không `--json`, kể cả\n   `<verb> [<sub>] --help`) — siêu dữ liệu về CLI, không phải payload của\n   một verb.\n2. **`setup`/`doctor --p",
    "identityFingerprint": "4dd427bdfd5fe7ca215b47e3ecfeb8ce37ad0ed58c683df6934f67d32c373e3e",
    "ancestry": [
      "CLI I/O Contract",
      "5. Reasoned Envelope Exceptions"
    ],
    "text": "1. **Sổ verb máy-đọc** (`--help`/`-h`, có hoặc không `--json`, kể cả\n   `<verb> [<sub>] --help`) — siêu dữ liệu về CLI, không phải payload của\n   một verb.\n2. **`setup`/`doctor --pretty`** — lối thoát hiển-thị-cho-người tường minh\n   qua cờ `--pretty`, không phải payload mặc định.\n3. **Log worker** (`.fgos/logs/<id>.log`) — text trần CỐ Ý, để `tail -f`\n   thấy được ngay; bọc phong bì sẽ phá đúng công dụng đó.\n4. **Luồng progress-trace của `fgos-runner`** (gặt-lại, nhận việc, phán\n   làm-rõ/chia-việc, đuôi kết quả proof, thử lại, dừng — cộng dòng lifecycle\n   \"watch mode stopped\" khi nhận tín hiệu dừng) — in console y nguyên như\n   trước, một tính năng KHÁC (đã khoá) với hợp đồng này, không đụng.\n5. **Cửa hook thực thi agent** (`fgos hook <dispatch-decide|decision-question>`) —\n   bypass phong bì CLI và kiểm tra store admission để giữ nguyên vẹn luồng `stdin`,\n   `stdout`, `stderr` và exit code `0`/`2` cho các công cụ như Claude Code và Codex,\n   hoặc xuất JSON stdout trực tiếp cho AGY. Bọc phong bì sẽ phá vỡ giao thức chặn công cụ của agent host."
  },
  "oldAnchor": "unheaded-block-25",
  "newAnchor": "unheaded-block-26",
  "oldDigest": "f58253403717e416cd5aa169d971bc332b43ab40f16ab6845c90d959d4283221",
  "newDigest": "f58253403717e416cd5aa169d971bc332b43ab40f16ab6845c90d959d4283221",
  "deepRequired": true,
  "helper": "scripts/doc-binding-repair.mjs",
  "contentProof": {
    "priorCommit": "ab4d6274a",
    "priorMatchingUnits": [
      {
        "unitKind": "unheaded-block",
        "anchor": "unheaded-block-25",
        "githubAnchor": "unheaded-block-25",
        "stableAnchor": "unheaded-block-25",
        "title": "Unheaded block 25",
        "startLine": 193,
        "endLine": 207,
        "textDigest": "f58253403717e416cd5aa169d971bc332b43ab40f16ab6845c90d959d4283221",
        "sample": "1. **Sổ verb máy-đọc** (`--help`/`-h`, có hoặc không `--json`, kể cả\n   `<verb> [<sub>] --help`) — siêu dữ liệu về CLI, không phải payload của\n   một verb.\n2. **`setup`/`doctor --p",
        "identityFingerprint": "4dd427bdfd5fe7ca215b47e3ecfeb8ce37ad0ed58c683df6934f67d32c373e3e",
        "ancestry": [
          "CLI I/O Contract",
          "5. Reasoned Envelope Exceptions"
        ],
        "text": "1. **Sổ verb máy-đọc** (`--help`/`-h`, có hoặc không `--json`, kể cả\n   `<verb> [<sub>] --help`) — siêu dữ liệu về CLI, không phải payload của\n   một verb.\n2. **`setup`/`doctor --pretty`** — lối thoát hiển-thị-cho-người tường minh\n   qua cờ `--pretty`, không phải payload mặc định.\n3. **Log worker** (`.fgos/logs/<id>.log`) — text trần CỐ Ý, để `tail -f`\n   thấy được ngay; bọc phong bì sẽ phá đúng công dụng đó.\n4. **Luồng progress-trace của `fgos-runner`** (gặt-lại, nhận việc, phán\n   làm-rõ/chia-việc, đuôi kết quả proof, thử lại, dừng — cộng dòng lifecycle\n   \"watch mode stopped\" khi nhận tín hiệu dừng) — in console y nguyên như\n   trước, một tính năng KHÁC (đã khoá) với hợp đồng này, không đụng.\n5. **Cửa hook thực thi agent** (`fgos hook <dispatch-decide|decision-question>`) —\n   bypass phong bì CLI và kiểm tra store admission để giữ nguyên vẹn luồng `stdin`,\n   `stdout`, `stderr` và exit code `0`/`2` cho các công cụ như Claude Code và Codex,\n   hoặc xuất JSON stdout trực tiếp cho AGY. Bọc phong bì sẽ phá vỡ giao thức chặn công cụ của agent host."
      }
    ],
    "currentText": "1. **Sổ verb máy-đọc** (`--help`/`-h`, có hoặc không `--json`, kể cả\n   `<verb> [<sub>] --help`) — siêu dữ liệu về CLI, không phải payload của\n   một verb.\n2. **`setup`/`doctor --pretty`** — lối thoát hiển-thị-cho-người tường minh\n   qua cờ `--pretty`, không phải payload mặc định.\n3. **Log worker** (`.fgos/logs/<id>.log`) — text trần CỐ Ý, để `tail -f`\n   thấy được ngay; bọc phong bì sẽ phá đúng công dụng đó.\n4. **Luồng progress-trace của `fgos-runner`** (gặt-lại, nhận việc, phán\n   làm-rõ/chia-việc, đuôi kết quả proof, thử lại, dừng — cộng dòng lifecycle\n   \"watch mode stopped\" khi nhận tín hiệu dừng) — in console y nguyên như\n   trước, một tính năng KHÁC (đã khoá) với hợp đồng này, không đụng.\n5. **Cửa hook thực thi agent** (`fgos hook <dispatch-decide|decision-question>`) —\n   bypass phong bì CLI và kiểm tra store admission để giữ nguyên vẹn luồng `stdin`,\n   `stdout`, `stderr` và exit code `0`/`2` cho các công cụ như Claude Code và Codex,\n   hoặc xuất JSON stdout trực tiếp cho AGY. Bọc phong bì sẽ phá vỡ giao thức chặn công cụ của agent host.",
    "allPriorMatchingTextsEqualCurrent": true,
    "helperReplayed": true
  },
  "reviewScope": "Re-anchor receipt; claim verdict belongs to decisions section.",
  "packagedBy": "codex-session:unit-run-1792094246578-b2fbe39b@2026-10-16",
  "currentContentCommit": "345f15d95663260976200be66d1b9a6c648bcd6d",
  "entryId": "anchors-037"
}
```

## Entry anchors-038

```json
{
  "kind": "content-reanchoring-proof",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s5-root-main-recarry.json",
  "collection": "claims",
  "before": {
    "claimId": "claim_bc091727d4f9526a57978e0ccc1cd5f7",
    "sourceUnitDigest": "d1af2d5a982f5d139fda776a23b4ad0b3776cc40c1fc0177636c44bdc91b968d",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-22",
    "claimKind": "contract",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "A31 native current source identity; full changed source unit carried verbatim in existing candidate owner. Main-only before/after retained in step8-final-rework-accounting.json. No predecessor identity graft or approval carry; no current-truth or promotion approval. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetUnitDigest": "bdeca0144b587f826ce46ea61d3be2e882ad021614d1e5f7c14cf2982573f056",
    "targetAncestry": [
      "CLI I/O Contract",
      "3. Output Direction Unified Envelope",
      "Recognizing A Real Envelope"
    ]
  },
  "after": {
    "claimId": "claim_bc091727d4f9526a57978e0ccc1cd5f7",
    "sourceUnitDigest": "d1af2d5a982f5d139fda776a23b4ad0b3776cc40c1fc0177636c44bdc91b968d",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-23",
    "claimKind": "contract",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "rationale": "A31 native current source identity; full changed source unit carried verbatim in existing candidate owner. Main-only before/after retained in step8-final-rework-accounting.json. No predecessor identity graft or approval carry; no current-truth or promotion approval. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. L10-21: content-based rebind from reviewed prior target unheaded-block-22 (d1af2d5a982f5d139fda776a23b4ad0b3776cc40c1fc0177636c44bdc91b968d) to unheaded-block-23 (d1af2d5a982f5d139fda776a23b4ad0b3776cc40c1fc0177636c44bdc91b968d); inserted paragraphs shift the anchor, prior target text is unchanged.",
    "targetUnitDigest": "d1af2d5a982f5d139fda776a23b4ad0b3776cc40c1fc0177636c44bdc91b968d",
    "targetAncestry": [
      "CLI I/O Contract",
      "4. Exit Codes"
    ]
  },
  "prior": {
    "claimId": "claim_bc091727d4f9526a57978e0ccc1cd5f7",
    "sourceUnitDigest": "d1af2d5a982f5d139fda776a23b4ad0b3776cc40c1fc0177636c44bdc91b968d",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-22",
    "claimKind": "contract",
    "disposition": "move",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792052396770-6f1c5957@2026-10-15",
    "rationale": "A31 native current source identity; full changed source unit carried verbatim in existing candidate owner. Main-only before/after retained in step8-final-rework-accounting.json. No predecessor identity graft or approval carry; no current-truth or promotion approval.",
    "reviewNote": "deep: sampled; new native claim for legacy io-contract block 13 (d1af2d5a); byte-equal to carrier block 22; text read: exit-code table gains 4 not-found and OUTCOME_EXIT_CODES, matches the upstream hunk exactly; move true; pending",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-15",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-261015-1526-specs-ui-reworks-main-recarry.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "d1af2d5a982f5d139fda776a23b4ad0b3776cc40c1fc0177636c44bdc91b968d",
    "targetAncestry": [
      "CLI I/O Contract",
      "4. Exit Codes"
    ],
    "reviewReportCommit": "0e8ce7710ac67ad038927b242b2461876bf8c90d"
  },
  "targetWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-23",
    "githubAnchor": "unheaded-block-23",
    "stableAnchor": "unheaded-block-23",
    "title": "Unheaded block 23",
    "startLine": 188,
    "endLine": 193,
    "textDigest": "d1af2d5a982f5d139fda776a23b4ad0b3776cc40c1fc0177636c44bdc91b968d",
    "sample": "`src/state/store.mjs`'s `EXIT_CODES` (2 precondition [bao gồm not-found / run-not-found / missing-run] · 3 conflict ·\n4 validation · 5 corrupt-log · 7 lock-timeout · 8 session-fail",
    "identityFingerprint": "78a5ddb4f5e294cd0185681fedb1e548cace7fbb42d520feec13ae171ceafb00",
    "ancestry": [
      "CLI I/O Contract",
      "4. Exit Codes"
    ],
    "text": "`src/state/store.mjs`'s `EXIT_CODES` (2 precondition [bao gồm not-found / run-not-found / missing-run] · 3 conflict ·\n4 validation · 5 corrupt-log · 7 lock-timeout · 8 session-fail · 9 merge-fail · 4 not-found) cộng\n`OUTCOME_EXIT_CODES` (4 policy-refusal · 10 provider-limit · 11 execution-failure · 12 partial-writes ·\n13 blocked · 14 findings) cộng `src/runner/loop.mjs`'s `EXIT_BUSY` (6, riêng của\nrunner) là bảng DUY NHẤT. 0 = ok / pass, 1 = bất ngờ (mọi thứ chưa phân loại).\nConsumer rẽ nhánh theo mã thoát phạm trù, không bao giờ theo thông điệp."
  },
  "relatedClaimId": "claim_bc091727d4f9526a57978e0ccc1cd5f7",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_bc091727d4f9526a57978e0ccc1cd5f7",
    "sourceUnitDigest": "d1af2d5a982f5d139fda776a23b4ad0b3776cc40c1fc0177636c44bdc91b968d",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-23",
    "claimKind": "contract",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "rationale": "A31 native current source identity; full changed source unit carried verbatim in existing candidate owner. Main-only before/after retained in step8-final-rework-accounting.json. No predecessor identity graft or approval carry; no current-truth or promotion approval. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. L10-21: content-based rebind from reviewed prior target unheaded-block-22 (d1af2d5a982f5d139fda776a23b4ad0b3776cc40c1fc0177636c44bdc91b968d) to unheaded-block-23 (d1af2d5a982f5d139fda776a23b4ad0b3776cc40c1fc0177636c44bdc91b968d); inserted paragraphs shift the anchor, prior target text is unchanged.",
    "targetUnitDigest": "d1af2d5a982f5d139fda776a23b4ad0b3776cc40c1fc0177636c44bdc91b968d",
    "targetAncestry": [
      "CLI I/O Contract",
      "4. Exit Codes"
    ]
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-23",
    "githubAnchor": "unheaded-block-23",
    "stableAnchor": "unheaded-block-23",
    "title": "Unheaded block 23",
    "startLine": 188,
    "endLine": 193,
    "textDigest": "d1af2d5a982f5d139fda776a23b4ad0b3776cc40c1fc0177636c44bdc91b968d",
    "sample": "`src/state/store.mjs`'s `EXIT_CODES` (2 precondition [bao gồm not-found / run-not-found / missing-run] · 3 conflict ·\n4 validation · 5 corrupt-log · 7 lock-timeout · 8 session-fail",
    "identityFingerprint": "78a5ddb4f5e294cd0185681fedb1e548cace7fbb42d520feec13ae171ceafb00",
    "ancestry": [
      "CLI I/O Contract",
      "4. Exit Codes"
    ],
    "text": "`src/state/store.mjs`'s `EXIT_CODES` (2 precondition [bao gồm not-found / run-not-found / missing-run] · 3 conflict ·\n4 validation · 5 corrupt-log · 7 lock-timeout · 8 session-fail · 9 merge-fail · 4 not-found) cộng\n`OUTCOME_EXIT_CODES` (4 policy-refusal · 10 provider-limit · 11 execution-failure · 12 partial-writes ·\n13 blocked · 14 findings) cộng `src/runner/loop.mjs`'s `EXIT_BUSY` (6, riêng của\nrunner) là bảng DUY NHẤT. 0 = ok / pass, 1 = bất ngờ (mọi thứ chưa phân loại).\nConsumer rẽ nhánh theo mã thoát phạm trù, không bao giờ theo thông điệp."
  },
  "oldAnchor": "unheaded-block-22",
  "newAnchor": "unheaded-block-23",
  "oldDigest": "d1af2d5a982f5d139fda776a23b4ad0b3776cc40c1fc0177636c44bdc91b968d",
  "newDigest": "d1af2d5a982f5d139fda776a23b4ad0b3776cc40c1fc0177636c44bdc91b968d",
  "deepRequired": true,
  "helper": "scripts/doc-binding-repair.mjs",
  "contentProof": {
    "priorCommit": "ab4d6274a",
    "priorMatchingUnits": [
      {
        "unitKind": "unheaded-block",
        "anchor": "unheaded-block-22",
        "githubAnchor": "unheaded-block-22",
        "stableAnchor": "unheaded-block-22",
        "title": "Unheaded block 22",
        "startLine": 178,
        "endLine": 183,
        "textDigest": "d1af2d5a982f5d139fda776a23b4ad0b3776cc40c1fc0177636c44bdc91b968d",
        "sample": "`src/state/store.mjs`'s `EXIT_CODES` (2 precondition [bao gồm not-found / run-not-found / missing-run] · 3 conflict ·\n4 validation · 5 corrupt-log · 7 lock-timeout · 8 session-fail",
        "identityFingerprint": "78a5ddb4f5e294cd0185681fedb1e548cace7fbb42d520feec13ae171ceafb00",
        "ancestry": [
          "CLI I/O Contract",
          "4. Exit Codes"
        ],
        "text": "`src/state/store.mjs`'s `EXIT_CODES` (2 precondition [bao gồm not-found / run-not-found / missing-run] · 3 conflict ·\n4 validation · 5 corrupt-log · 7 lock-timeout · 8 session-fail · 9 merge-fail · 4 not-found) cộng\n`OUTCOME_EXIT_CODES` (4 policy-refusal · 10 provider-limit · 11 execution-failure · 12 partial-writes ·\n13 blocked · 14 findings) cộng `src/runner/loop.mjs`'s `EXIT_BUSY` (6, riêng của\nrunner) là bảng DUY NHẤT. 0 = ok / pass, 1 = bất ngờ (mọi thứ chưa phân loại).\nConsumer rẽ nhánh theo mã thoát phạm trù, không bao giờ theo thông điệp."
      }
    ],
    "currentText": "`src/state/store.mjs`'s `EXIT_CODES` (2 precondition [bao gồm not-found / run-not-found / missing-run] · 3 conflict ·\n4 validation · 5 corrupt-log · 7 lock-timeout · 8 session-fail · 9 merge-fail · 4 not-found) cộng\n`OUTCOME_EXIT_CODES` (4 policy-refusal · 10 provider-limit · 11 execution-failure · 12 partial-writes ·\n13 blocked · 14 findings) cộng `src/runner/loop.mjs`'s `EXIT_BUSY` (6, riêng của\nrunner) là bảng DUY NHẤT. 0 = ok / pass, 1 = bất ngờ (mọi thứ chưa phân loại).\nConsumer rẽ nhánh theo mã thoát phạm trù, không bao giờ theo thông điệp.",
    "allPriorMatchingTextsEqualCurrent": true,
    "helperReplayed": true
  },
  "reviewScope": "Re-anchor receipt; claim verdict belongs to decisions section.",
  "packagedBy": "codex-session:unit-run-1792094246578-b2fbe39b@2026-10-16",
  "currentContentCommit": "345f15d95663260976200be66d1b9a6c648bcd6d",
  "entryId": "anchors-038"
}
```

## Entry anchors-039

```json
{
  "kind": "content-reanchoring-proof",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s5-root-main-recarry.json",
  "collection": "claims",
  "before": {
    "claimId": "claim_812873a889bd4222ea0ab3dc9194e1ad",
    "sourceUnitDigest": "131cc0704d753f35dcbec3ebba7be49a0d103732b6f4ee8c5ecc175d5c46167e",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-23",
    "claimKind": "contract",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "A31 native current source identity; full changed source unit carried verbatim in existing candidate owner. Main-only before/after retained in step8-final-rework-accounting.json. No predecessor identity graft or approval carry; no current-truth or promotion approval. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetUnitDigest": "d1af2d5a982f5d139fda776a23b4ad0b3776cc40c1fc0177636c44bdc91b968d",
    "targetAncestry": [
      "CLI I/O Contract",
      "4. Exit Codes"
    ]
  },
  "after": {
    "claimId": "claim_812873a889bd4222ea0ab3dc9194e1ad",
    "sourceUnitDigest": "131cc0704d753f35dcbec3ebba7be49a0d103732b6f4ee8c5ecc175d5c46167e",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-24",
    "claimKind": "contract",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "rationale": "A31 native current source identity; full changed source unit carried verbatim in existing candidate owner. Main-only before/after retained in step8-final-rework-accounting.json. No predecessor identity graft or approval carry; no current-truth or promotion approval. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. L10-21: content-based rebind from reviewed prior target unheaded-block-23 (131cc0704d753f35dcbec3ebba7be49a0d103732b6f4ee8c5ecc175d5c46167e) to unheaded-block-24 (131cc0704d753f35dcbec3ebba7be49a0d103732b6f4ee8c5ecc175d5c46167e); inserted paragraphs shift the anchor, prior target text is unchanged.",
    "targetUnitDigest": "131cc0704d753f35dcbec3ebba7be49a0d103732b6f4ee8c5ecc175d5c46167e",
    "targetAncestry": [
      "CLI I/O Contract",
      "4. Exit Codes"
    ]
  },
  "prior": {
    "claimId": "claim_812873a889bd4222ea0ab3dc9194e1ad",
    "sourceUnitDigest": "131cc0704d753f35dcbec3ebba7be49a0d103732b6f4ee8c5ecc175d5c46167e",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-23",
    "claimKind": "contract",
    "disposition": "move",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792052396770-6f1c5957@2026-10-15",
    "rationale": "A31 native current source identity; full changed source unit carried verbatim in existing candidate owner. Main-only before/after retained in step8-final-rework-accounting.json. No predecessor identity graft or approval carry; no current-truth or promotion approval.",
    "reviewNote": "deep: new native claim for legacy io-contract block 14 (131cc070, the RUL99 execution-outcome paragraph); byte-equal to carrier block 23 (blank-line spacing before the next heading differs, outside unit text); move true; pending",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-15",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-261015-1526-specs-ui-reworks-main-recarry.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "131cc0704d753f35dcbec3ebba7be49a0d103732b6f4ee8c5ecc175d5c46167e",
    "targetAncestry": [
      "CLI I/O Contract",
      "4. Exit Codes"
    ],
    "reviewReportCommit": "0e8ce7710ac67ad038927b242b2461876bf8c90d"
  },
  "targetWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-24",
    "githubAnchor": "unheaded-block-24",
    "stableAnchor": "unheaded-block-24",
    "title": "Unheaded block 24",
    "startLine": 195,
    "endLine": 196,
    "textDigest": "131cc0704d753f35dcbec3ebba7be49a0d103732b6f4ee8c5ecc175d5c46167e",
    "sample": "**Kết cục thực thi (`fgos run` và `fgos workflow start|resume|answer --foreground`, RUL99):**\nKhi lệnh chạy kết thúc với một outcome không phải `pass`, tiến trình CLI trả mã lỗi tư",
    "identityFingerprint": "e92265336a0d1434e9f7768558dc58ebd574fb194a7871ae7bce67f7afa2a734",
    "ancestry": [
      "CLI I/O Contract",
      "4. Exit Codes"
    ],
    "text": "**Kết cục thực thi (`fgos run` và `fgos workflow start|resume|answer --foreground`, RUL99):**\nKhi lệnh chạy kết thúc với một outcome không phải `pass`, tiến trình CLI trả mã lỗi tương ứng theo bảng mã kết cục thực thi (`policy-refusal`: 4, `provider-limit`: 10, `execution-failure`: 11, `partial-writes`: 12, `blocked`: 13, `findings`: 14), trong khi toàn bộ luồng stdout JSON envelope `fgos.v1` vẫn được giữ nguyên vẹn 100%. Các lệnh chỉ-đọc như `fgos workflow status` luôn trả mã thoát 0 bất kể outcome của workflow run. Lệnh `fgos workflow start` chạy detached trả exit code 0 khi tiến trình daemon được kích hoạt thành công."
  },
  "relatedClaimId": "claim_812873a889bd4222ea0ab3dc9194e1ad",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_812873a889bd4222ea0ab3dc9194e1ad",
    "sourceUnitDigest": "131cc0704d753f35dcbec3ebba7be49a0d103732b6f4ee8c5ecc175d5c46167e",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-24",
    "claimKind": "contract",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "rationale": "A31 native current source identity; full changed source unit carried verbatim in existing candidate owner. Main-only before/after retained in step8-final-rework-accounting.json. No predecessor identity graft or approval carry; no current-truth or promotion approval. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. L10-21: content-based rebind from reviewed prior target unheaded-block-23 (131cc0704d753f35dcbec3ebba7be49a0d103732b6f4ee8c5ecc175d5c46167e) to unheaded-block-24 (131cc0704d753f35dcbec3ebba7be49a0d103732b6f4ee8c5ecc175d5c46167e); inserted paragraphs shift the anchor, prior target text is unchanged.",
    "targetUnitDigest": "131cc0704d753f35dcbec3ebba7be49a0d103732b6f4ee8c5ecc175d5c46167e",
    "targetAncestry": [
      "CLI I/O Contract",
      "4. Exit Codes"
    ]
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-24",
    "githubAnchor": "unheaded-block-24",
    "stableAnchor": "unheaded-block-24",
    "title": "Unheaded block 24",
    "startLine": 195,
    "endLine": 196,
    "textDigest": "131cc0704d753f35dcbec3ebba7be49a0d103732b6f4ee8c5ecc175d5c46167e",
    "sample": "**Kết cục thực thi (`fgos run` và `fgos workflow start|resume|answer --foreground`, RUL99):**\nKhi lệnh chạy kết thúc với một outcome không phải `pass`, tiến trình CLI trả mã lỗi tư",
    "identityFingerprint": "e92265336a0d1434e9f7768558dc58ebd574fb194a7871ae7bce67f7afa2a734",
    "ancestry": [
      "CLI I/O Contract",
      "4. Exit Codes"
    ],
    "text": "**Kết cục thực thi (`fgos run` và `fgos workflow start|resume|answer --foreground`, RUL99):**\nKhi lệnh chạy kết thúc với một outcome không phải `pass`, tiến trình CLI trả mã lỗi tương ứng theo bảng mã kết cục thực thi (`policy-refusal`: 4, `provider-limit`: 10, `execution-failure`: 11, `partial-writes`: 12, `blocked`: 13, `findings`: 14), trong khi toàn bộ luồng stdout JSON envelope `fgos.v1` vẫn được giữ nguyên vẹn 100%. Các lệnh chỉ-đọc như `fgos workflow status` luôn trả mã thoát 0 bất kể outcome của workflow run. Lệnh `fgos workflow start` chạy detached trả exit code 0 khi tiến trình daemon được kích hoạt thành công."
  },
  "oldAnchor": "unheaded-block-23",
  "newAnchor": "unheaded-block-24",
  "oldDigest": "131cc0704d753f35dcbec3ebba7be49a0d103732b6f4ee8c5ecc175d5c46167e",
  "newDigest": "131cc0704d753f35dcbec3ebba7be49a0d103732b6f4ee8c5ecc175d5c46167e",
  "deepRequired": true,
  "helper": "scripts/doc-binding-repair.mjs",
  "contentProof": {
    "priorCommit": "ab4d6274a",
    "priorMatchingUnits": [
      {
        "unitKind": "unheaded-block",
        "anchor": "unheaded-block-23",
        "githubAnchor": "unheaded-block-23",
        "stableAnchor": "unheaded-block-23",
        "title": "Unheaded block 23",
        "startLine": 185,
        "endLine": 186,
        "textDigest": "131cc0704d753f35dcbec3ebba7be49a0d103732b6f4ee8c5ecc175d5c46167e",
        "sample": "**Kết cục thực thi (`fgos run` và `fgos workflow start|resume|answer --foreground`, RUL99):**\nKhi lệnh chạy kết thúc với một outcome không phải `pass`, tiến trình CLI trả mã lỗi tư",
        "identityFingerprint": "e92265336a0d1434e9f7768558dc58ebd574fb194a7871ae7bce67f7afa2a734",
        "ancestry": [
          "CLI I/O Contract",
          "4. Exit Codes"
        ],
        "text": "**Kết cục thực thi (`fgos run` và `fgos workflow start|resume|answer --foreground`, RUL99):**\nKhi lệnh chạy kết thúc với một outcome không phải `pass`, tiến trình CLI trả mã lỗi tương ứng theo bảng mã kết cục thực thi (`policy-refusal`: 4, `provider-limit`: 10, `execution-failure`: 11, `partial-writes`: 12, `blocked`: 13, `findings`: 14), trong khi toàn bộ luồng stdout JSON envelope `fgos.v1` vẫn được giữ nguyên vẹn 100%. Các lệnh chỉ-đọc như `fgos workflow status` luôn trả mã thoát 0 bất kể outcome của workflow run. Lệnh `fgos workflow start` chạy detached trả exit code 0 khi tiến trình daemon được kích hoạt thành công."
      }
    ],
    "currentText": "**Kết cục thực thi (`fgos run` và `fgos workflow start|resume|answer --foreground`, RUL99):**\nKhi lệnh chạy kết thúc với một outcome không phải `pass`, tiến trình CLI trả mã lỗi tương ứng theo bảng mã kết cục thực thi (`policy-refusal`: 4, `provider-limit`: 10, `execution-failure`: 11, `partial-writes`: 12, `blocked`: 13, `findings`: 14), trong khi toàn bộ luồng stdout JSON envelope `fgos.v1` vẫn được giữ nguyên vẹn 100%. Các lệnh chỉ-đọc như `fgos workflow status` luôn trả mã thoát 0 bất kể outcome của workflow run. Lệnh `fgos workflow start` chạy detached trả exit code 0 khi tiến trình daemon được kích hoạt thành công.",
    "allPriorMatchingTextsEqualCurrent": true,
    "helperReplayed": true
  },
  "reviewScope": "Re-anchor receipt; claim verdict belongs to decisions section.",
  "packagedBy": "codex-session:unit-run-1792094246578-b2fbe39b@2026-10-16",
  "currentContentCommit": "345f15d95663260976200be66d1b9a6c648bcd6d",
  "entryId": "anchors-039"
}
```

