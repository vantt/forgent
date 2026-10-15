# Pending final source and predecessor decisions — part 2

Author session: `codex-session:unit-run-1792089181794-89ae42db@2026-10-16`
Packaged by: `codex-session:unit-run-1792090455209-159fbfed@2026-10-16`
Content pin / SYNC: `19ca8de23908e161c34c91626e41041b7813167c`
Comparison base: `ab4d6274a9ae78c2613897432df726bfab32be52`
Entries: **120**, maximum 120 per request part.

[Single request index](review-request-step10-index-19ca8de23.md). This is one bounded re-review set of changes since `ab4d6274a`, replacing prior submission for changed entries only; unchanged matching ok verdicts remain accepted. This author header identifies this part's submitted author; per-row `authoredBy` and immutable historical author fields remain exact. No producer seed, draw, sample or verdict is selected.

Read [A36 mechanical/deep lists](step10-sync19-A36.json). Every submitted claim requires one ordinary verdict with exact shown source and target digests and a `deep` or `mechanical` note. Recompute full digests and anchors and compare current shard/pack equality for every row. Deep-review every unequal source/target row, every submitted partial carry, all seven labelled truth corrections, all historical AGENTS rows and other explicitly marked reworks. The reviewer selects and records a seed for at least 63/415 Weak-exact/Judgment rows (15%, minimum 10, all if fewer); >3% deep rework escalates to whole-pack deep review. A36 changes neither truth sampling nor checkpoint review. Non-claim entries receive item-specific accounting/content verdicts, not claim approvals. Existing independently ok unchanged full-file content is context only.

## Entry claim_a3944b679053b61dc2d743795cde3d77

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_a3944b679053b61dc2d743795cde3d77",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "b-decisions-second",
  "before": {
    "claimId": "claim_a3944b679053b61dc2d743795cde3d77",
    "sourceUnitDigest": "5e566c132da3b486",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-67",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "ADR 0027 reasons why the original rule was revised (multi-domain schema need); carried verbatim.",
    "reviewedBy": "independent reviewer (review-b-decisions-second)",
    "reviewedAt": "2026-10-07",
    "targetUnitDigest": "5e566c132da3b486f17ad15991b3409a"
  },
  "currentDecision": {
    "claimId": "claim_a3944b679053b61dc2d743795cde3d77",
    "sourceUnitDigest": "5e566c132da3b486",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-67",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "ADR 0027 reasons why the original rule was revised (multi-domain schema need); carried verbatim. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
    "targetUnitDigest": "5e566c132da3b486f17ad15991b3409a28229ac2f48472d4e61c13ab0b31b41a",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Context"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/specs/work-state.md",
    "unitDigest": "0c9636bdedc0560ee58bf3a086fa84d457a934272d72bc4c978b9fadf73ddb20",
    "identityFingerprint": "0c9636bdedc0560ee58bf3a086fa84d457a934272d72bc4c978b9fadf73ddb20",
    "claimId": "claim_a3944b679053b61dc2d743795cde3d77",
    "sourceAnchor": "unheaded-block-177",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "5e566c132da3b486f17ad15991b3409a28229ac2f48472d4e61c13ab0b31b41a",
    "claimKind": "contract",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-177",
      "githubAnchor": "unheaded-block-177",
      "stableAnchor": "unheaded-block-177",
      "title": "Unheaded block 177",
      "startLine": 1909,
      "endLine": 1927,
      "textDigest": "5e566c132da3b486f17ad15991b3409a28229ac2f48472d4e61c13ab0b31b41a",
      "sample": "**Vì sao bị revise:** `tsk-38t` (multi-domain schema, Phase 2) cần một domain\nsản xuất thật thứ hai (vd `marketing`) tự khai nhãn/luồng trạng thái riêng mà\nkhông phải học/đụng 10 c",
      "identityFingerprint": "0c9636bdedc0560ee58bf3a086fa84d457a934272d72bc4c978b9fadf73ddb20",
      "ancestry": [
        "0002 — Mô hình việc phẳng",
        "0027 — Domain sở hữu vocabulary/transition status đoạn TRƯỚC `delivered` (supersede base-workflow-model)",
        "Bối cảnh"
      ],
      "text": "**Vì sao bị revise:** `tsk-38t` (multi-domain schema, Phase 2) cần một domain\nsản xuất thật thứ hai (vd `marketing`) tự khai nhãn/luồng trạng thái riêng mà\nkhông phải học/đụng 10 chữ coding-flavored, đồng thời giữ cho các cơ chế\ndomain-agnostic của fgOS (frontier dep-resolve, rollup, outcome/friction,\ndiscovery-judge, compound-learn trigger) có một cách đọc \"item đang ở đâu\"\nkhông phụ thuộc từ vựng domain. Bản thân report nguồn\n(`plans/reports/research-260730-0931-work-item-schema-multi-domain-upgrade-report.md`,\nround 4) ban đầu kết luận **\"domain sở hữu TOÀN BỘ bảng transition\"** — một\nkhung rộng hơn record này thật sự chốt. Khung đó đã bị xét lại và THU HẸP\ntrong phiên `fgos-coding-exploring` cho `tsk-38t`\n(`docs/history/phase-2-status-category-schema/DISCUSSION.md`, đọc toàn văn):\n§1 tự ghi nhận \"Đây là thu hẹp thật so với kết luận round-4 của report gốc\n('domain sở hữu TOÀN BỘ bảng transition') — thu hẹp lại đúng phạm vi domain\nthật sự cần tự khai (đoạn đầu vòng đời)\". Quyết định (chốt vòng 3, seq 5571, xác nhận\nngười dùng nguyên văn: \"đúng, mỗi phần domain sẽ có status/stage trước deliver\nlà chắc chắn khác nhau. nhưng retro không có status khác nhưng sẽ có cách học\nkhác (skill), cleanup cũng sẽ có cách dọn khác (skill)\") là quyết định thật sự\nđược chốt — record này formalize đúng, không phải khung rộng ban đầu của\nreport."
    }
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-67",
    "githubAnchor": "unheaded-block-67",
    "stableAnchor": "unheaded-block-67",
    "title": "Unheaded block 67",
    "startLine": 566,
    "endLine": 584,
    "textDigest": "5e566c132da3b486f17ad15991b3409a28229ac2f48472d4e61c13ab0b31b41a",
    "sample": "**Vì sao bị revise:** `tsk-38t` (multi-domain schema, Phase 2) cần một domain\nsản xuất thật thứ hai (vd `marketing`) tự khai nhãn/luồng trạng thái riêng mà\nkhông phải học/đụng 10 c",
    "identityFingerprint": "0c9636bdedc0560ee58bf3a086fa84d457a934272d72bc4c978b9fadf73ddb20",
    "ancestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Context"
    ],
    "text": "**Vì sao bị revise:** `tsk-38t` (multi-domain schema, Phase 2) cần một domain\nsản xuất thật thứ hai (vd `marketing`) tự khai nhãn/luồng trạng thái riêng mà\nkhông phải học/đụng 10 chữ coding-flavored, đồng thời giữ cho các cơ chế\ndomain-agnostic của fgOS (frontier dep-resolve, rollup, outcome/friction,\ndiscovery-judge, compound-learn trigger) có một cách đọc \"item đang ở đâu\"\nkhông phụ thuộc từ vựng domain. Bản thân report nguồn\n(`plans/reports/research-260730-0931-work-item-schema-multi-domain-upgrade-report.md`,\nround 4) ban đầu kết luận **\"domain sở hữu TOÀN BỘ bảng transition\"** — một\nkhung rộng hơn record này thật sự chốt. Khung đó đã bị xét lại và THU HẸP\ntrong phiên `fgos-coding-exploring` cho `tsk-38t`\n(`docs/history/phase-2-status-category-schema/DISCUSSION.md`, đọc toàn văn):\n§1 tự ghi nhận \"Đây là thu hẹp thật so với kết luận round-4 của report gốc\n('domain sở hữu TOÀN BỘ bảng transition') — thu hẹp lại đúng phạm vi domain\nthật sự cần tự khai (đoạn đầu vòng đời)\". Quyết định (chốt vòng 3, seq 5571, xác nhận\nngười dùng nguyên văn: \"đúng, mỗi phần domain sẽ có status/stage trước deliver\nlà chắc chắn khác nhau. nhưng retro không có status khác nhưng sẽ có cách học\nkhác (skill), cleanup cũng sẽ có cách dọn khác (skill)\") là quyết định thật sự\nđược chốt — record này formalize đúng, không phải khung rộng ban đầu của\nreport."
  },
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Weak-exact",
    "reason": "ancestor headings differ; document exact share below one half",
    "targetUnit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-67",
      "githubAnchor": "unheaded-block-67",
      "stableAnchor": "unheaded-block-67",
      "title": "Unheaded block 67",
      "startLine": 566,
      "endLine": 584,
      "textDigest": "5e566c132da3b486f17ad15991b3409a28229ac2f48472d4e61c13ab0b31b41a",
      "sample": "**Vì sao bị revise:** `tsk-38t` (multi-domain schema, Phase 2) cần một domain\nsản xuất thật thứ hai (vd `marketing`) tự khai nhãn/luồng trạng thái riêng mà\nkhông phải học/đụng 10 c",
      "identityFingerprint": "0c9636bdedc0560ee58bf3a086fa84d457a934272d72bc4c978b9fadf73ddb20",
      "ancestry": [
        "Retired Decision History: Work State",
        "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
        "0027 Context"
      ],
      "text": "**Vì sao bị revise:** `tsk-38t` (multi-domain schema, Phase 2) cần một domain\nsản xuất thật thứ hai (vd `marketing`) tự khai nhãn/luồng trạng thái riêng mà\nkhông phải học/đụng 10 chữ coding-flavored, đồng thời giữ cho các cơ chế\ndomain-agnostic của fgOS (frontier dep-resolve, rollup, outcome/friction,\ndiscovery-judge, compound-learn trigger) có một cách đọc \"item đang ở đâu\"\nkhông phụ thuộc từ vựng domain. Bản thân report nguồn\n(`plans/reports/research-260730-0931-work-item-schema-multi-domain-upgrade-report.md`,\nround 4) ban đầu kết luận **\"domain sở hữu TOÀN BỘ bảng transition\"** — một\nkhung rộng hơn record này thật sự chốt. Khung đó đã bị xét lại và THU HẸP\ntrong phiên `fgos-coding-exploring` cho `tsk-38t`\n(`docs/history/phase-2-status-category-schema/DISCUSSION.md`, đọc toàn văn):\n§1 tự ghi nhận \"Đây là thu hẹp thật so với kết luận round-4 của report gốc\n('domain sở hữu TOÀN BỘ bảng transition') — thu hẹp lại đúng phạm vi domain\nthật sự cần tự khai (đoạn đầu vòng đời)\". Quyết định (chốt vòng 3, seq 5571, xác nhận\nngười dùng nguyên văn: \"đúng, mỗi phần domain sẽ có status/stage trước deliver\nlà chắc chắn khác nhau. nhưng retro không có status khác nhưng sẽ có cách học\nkhác (skill), cleanup cũng sẽ có cách dọn khác (skill)\") là quyết định thật sự\nđược chốt — record này formalize đúng, không phải khung rộng ban đầu của\nreport."
    }
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_a3944b679053b61dc2d743795cde3d77"
}
```

## Entry claim_466331635349f55e32c11e0fcf56d334

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_466331635349f55e32c11e0fcf56d334",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "b-decisions-second",
  "before": {
    "claimId": "claim_466331635349f55e32c11e0fcf56d334",
    "sourceUnitDigest": "d76f5cf17475a3fb",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "0027-decision",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Source H4 \"Quyết định\" of ADR 0027 is carried as H3 \"0027 Decision\"; title differs, heading-only unit.",
    "reviewedBy": "independent reviewer (review-b-decisions-second)",
    "reviewedAt": "2026-10-07",
    "targetUnitDigest": "3969babe82040ce7d1d34672b372c59d"
  },
  "currentDecision": {
    "claimId": "claim_466331635349f55e32c11e0fcf56d334",
    "sourceUnitDigest": "d76f5cf17475a3fb",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "0027-decision",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "Source H4 \"Quyết định\" of ADR 0027 is carried as H3 \"0027 Decision\"; title differs, heading-only unit. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
    "targetUnitDigest": "3969babe82040ce7d1d34672b372c59d3fd1d3721811bdcbfc19c2f0b0960afc",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/specs/work-state.md",
    "unitDigest": "6f6cc47b724f66bd3497d6ec0fa537b818f6025730dde22a59f5b0872cc7b647",
    "identityFingerprint": "66c130799cd7f6af3064a3ff5142c5b41a0775e6c682191d983ea73d86ec47f5",
    "claimId": "claim_466331635349f55e32c11e0fcf56d334",
    "sourceAnchor": "quyết-định-10",
    "unitKind": "heading",
    "sourceUnitDigest": "d76f5cf17475a3fbfcac8752ebf9fd616795b1b9d810e23235f38a8322acffa4",
    "claimKind": "specification",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "heading",
      "level": 4,
      "title": "Quyết định",
      "anchor": "quyết-định-10",
      "githubAnchor": "quyết-định-10",
      "stableAnchor": "h-4e2aab3cc388",
      "startLine": 1929,
      "endLine": 1929,
      "textDigest": "d76f5cf17475a3fbfcac8752ebf9fd616795b1b9d810e23235f38a8322acffa4",
      "sample": "Quyết định",
      "sectionPayloadDigest": "2b9b70d32d6c4d73f536956859ae8b533fc9af2b5abe63276fb05a0908c5398a",
      "followingBlockDigest": "1c7ea2fda926300b7351bee9c39ec9314d0d7f3d053ba408667ef2c0d8f4ac0c",
      "identityFingerprint": "66c130799cd7f6af3064a3ff5142c5b41a0775e6c682191d983ea73d86ec47f5",
      "ancestry": [
        "0002 — Mô hình việc phẳng",
        "0027 — Domain sở hữu vocabulary/transition status đoạn TRƯỚC `delivered` (supersede base-workflow-model)"
      ],
      "text": "#### Quyết định",
      "sectionText": "#### Quyết định\n\n**Phạm vi supersede CHÍNH XÁC — chỉ ĐOẠN ĐẦU, không phải toàn bộ FSM.** 10\nstatus hôm nay chia làm hai nhóm bản chất khác nhau, theo tiêu chí \"domain có\nđược tự đặt nhãn/cạnh chuyển khác cho status này không\" (DISCUSSION.md §6):\n\n- **NHÓM ĐẦU — 6 status TRƯỚC `delivered`:** `todo` / `doing` / `blocked` /\n  `awaiting-human` / `awaiting-approval` / `wontfix`. Kể từ record này, domain\n  SỞ HỮU nhãn + bảng transition riêng cho nhóm này — đây là phần thật sự\n  supersede `base-workflow-model`. Domain KHÔNG BẮT BUỘC đổi tên\n  (coding giữ nguyên cả 6 chữ, 0 migration) — cả hai điều này chỉ trao QUYỀN, không\n  ép dùng.\n- **NHÓM ĐUÔI — 4 status TỪ `delivered` trở đi:** `delivered` → `retrospective`\n  → `cleanup` → `done`, chuỗi TUYẾN TÍNH cố định. KHÔNG domain nào được\n  relabel — đây là nghĩa vụ phổ quát của bất kỳ loại hình việc nào (delivery\n  thật, nhìn lại, dọn dẹp), không phải từ vựng riêng của `coding` (xác\n  nhận trực tiếp: \"loại hình việc nào cũng cần delivery, retro, và cleanup...\n  chỉ có tổ chức nào quá hời hợt sẽ bỏ qua retro và cleanup\"). Khác biệt\n  per-domain ở nhóm này nằm ở **skill nào chạy** bước `retrospective` (mở\n  rộng đúng field `skillMap` đã có trong `DOMAINS[domain]`,\n  `workflow-stage-graphs.mjs`, thêm key `retrospective`; `cleanup` giữ nguyên\n  pure-harness, không cần skill — khác biệt per-domain của nó đã đủ qua field\n  `worktreeBacked` có sẵn), KHÔNG phải ở tên/cạnh chuyển status.\n\nBảng map 6 status đoạn đầu → `statusCategory` (field foundation mới,\nđóng băng lúc ghi event `work.move`/`work.add`, **KHÔNG derive-on-read** —\nluật L3, `docs/platform-foundations.md`):\n\n| status (đoạn đầu) | statusCategory |\n|---|---|\n| `todo` | `todo` |\n| `doing` | `in-progress` |\n| `blocked` | `in-progress` |\n| `awaiting-human` | `in-progress` |\n| `awaiting-approval` | `review` |\n| `wontfix` | `canceled` |\n\n`statusCategory` là **bản nén có mất mát, đã chứng minh lủng** — KHÔNG được\ndùng để validate move: cạnh `blocked → awaiting-human` không tồn tại trong 24\ncạnh thật của `status-fsm.mjs` hôm nay, dù cả hai status cùng rơi vào category\n`in-progress`; validate ở tầng category sẽ tự động legalize sai cạnh này.\nValidate move vẫn luôn đi qua bảng transition ĐẦY ĐỦ, MỊN của chính domain đó\n(`status-fsm.mjs` hôm nay cho `coding`) — `statusCategory` chỉ phục vụ các cơ\nchế domain-agnostic (frontier `ready`-filter, rollup, outcome/friction,\ndiscovery-judge) đọc \"item đang ở nhóm nào\" mà không cần học từ vựng của từng\ndomain.\n\n4 status đoạn đuôi **KHÔNG cần** `statusCategory` — literal status đã đủ dùng\nmãi mãi cho mọi domain, không có khái niệm \"domain tự đặt nhãn cho `delivered`\"\nđể cần nén.\n\nNgoài phạm vi supersede (tách bạch nêu trên, không phải quyết định mới):\nthêm field optional `domainFields: { [domainName]: {...} } }` trên work item\ncho dữ liệu nested per-domain, optional-additive, ghi đè toàn object mỗi lần\n`edit` (latest-wins, cùng khuôn `refs`/`deps`/`acceptance`), validate qua\n`fieldSchema` optional khai trong `DOMAINS[domain]` nếu domain có khai — pattern\nđộc lập với phần status/category ở trên, KHÔNG được implement trong record này\n(ngoài phạm vi `tsk-38t-1`, thuộc `tsk-38t-2` trở đi)."
    }
  },
  "currentTarget": {
    "unitKind": "heading",
    "level": 3,
    "title": "0027 Decision",
    "anchor": "0027-decision",
    "githubAnchor": "0027-decision",
    "stableAnchor": "h-7ab4f6d48a74",
    "startLine": 586,
    "endLine": 586,
    "textDigest": "3969babe82040ce7d1d34672b372c59d3fd1d3721811bdcbfc19c2f0b0960afc",
    "sample": "0027 Decision",
    "sectionPayloadDigest": "2b9b70d32d6c4d73f536956859ae8b533fc9af2b5abe63276fb05a0908c5398a",
    "followingBlockDigest": "1c7ea2fda926300b7351bee9c39ec9314d0d7f3d053ba408667ef2c0d8f4ac0c",
    "identityFingerprint": "c2e9d1845138170a76eddbdef744ac477b317aec14f8eb7415bab7253aca4aff",
    "ancestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary"
    ],
    "text": "### 0027 Decision",
    "sectionText": "### 0027 Decision\n\n**Phạm vi supersede CHÍNH XÁC — chỉ ĐOẠN ĐẦU, không phải toàn bộ FSM.** 10\nstatus hôm nay chia làm hai nhóm bản chất khác nhau, theo tiêu chí \"domain có\nđược tự đặt nhãn/cạnh chuyển khác cho status này không\" (DISCUSSION.md §6):\n\n- **NHÓM ĐẦU — 6 status TRƯỚC `delivered`:** `todo` / `doing` / `blocked` /\n  `awaiting-human` / `awaiting-approval` / `wontfix`. Kể từ record này, domain\n  SỞ HỮU nhãn + bảng transition riêng cho nhóm này — đây là phần thật sự\n  supersede `base-workflow-model`. Domain KHÔNG BẮT BUỘC đổi tên\n  (coding giữ nguyên cả 6 chữ, 0 migration) — cả hai điều này chỉ trao QUYỀN, không\n  ép dùng.\n- **NHÓM ĐUÔI — 4 status TỪ `delivered` trở đi:** `delivered` → `retrospective`\n  → `cleanup` → `done`, chuỗi TUYẾN TÍNH cố định. KHÔNG domain nào được\n  relabel — đây là nghĩa vụ phổ quát của bất kỳ loại hình việc nào (delivery\n  thật, nhìn lại, dọn dẹp), không phải từ vựng riêng của `coding` (xác\n  nhận trực tiếp: \"loại hình việc nào cũng cần delivery, retro, và cleanup...\n  chỉ có tổ chức nào quá hời hợt sẽ bỏ qua retro và cleanup\"). Khác biệt\n  per-domain ở nhóm này nằm ở **skill nào chạy** bước `retrospective` (mở\n  rộng đúng field `skillMap` đã có trong `DOMAINS[domain]`,\n  `workflow-stage-graphs.mjs`, thêm key `retrospective`; `cleanup` giữ nguyên\n  pure-harness, không cần skill — khác biệt per-domain của nó đã đủ qua field\n  `worktreeBacked` có sẵn), KHÔNG phải ở tên/cạnh chuyển status.\n\nBảng map 6 status đoạn đầu → `statusCategory` (field foundation mới,\nđóng băng lúc ghi event `work.move`/`work.add`, **KHÔNG derive-on-read** —\nluật L3, `docs/platform-foundations.md`):\n\n| status (đoạn đầu) | statusCategory |\n|---|---|\n| `todo` | `todo` |\n| `doing` | `in-progress` |\n| `blocked` | `in-progress` |\n| `awaiting-human` | `in-progress` |\n| `awaiting-approval` | `review` |\n| `wontfix` | `canceled` |\n\n`statusCategory` là **bản nén có mất mát, đã chứng minh lủng** — KHÔNG được\ndùng để validate move: cạnh `blocked → awaiting-human` không tồn tại trong 24\ncạnh thật của `status-fsm.mjs` hôm nay, dù cả hai status cùng rơi vào category\n`in-progress`; validate ở tầng category sẽ tự động legalize sai cạnh này.\nValidate move vẫn luôn đi qua bảng transition ĐẦY ĐỦ, MỊN của chính domain đó\n(`status-fsm.mjs` hôm nay cho `coding`) — `statusCategory` chỉ phục vụ các cơ\nchế domain-agnostic (frontier `ready`-filter, rollup, outcome/friction,\ndiscovery-judge) đọc \"item đang ở nhóm nào\" mà không cần học từ vựng của từng\ndomain.\n\n4 status đoạn đuôi **KHÔNG cần** `statusCategory` — literal status đã đủ dùng\nmãi mãi cho mọi domain, không có khái niệm \"domain tự đặt nhãn cho `delivered`\"\nđể cần nén.\n\nNgoài phạm vi supersede (tách bạch nêu trên, không phải quyết định mới):\nthêm field optional `domainFields: { [domainName]: {...} } }` trên work item\ncho dữ liệu nested per-domain, optional-additive, ghi đè toàn object mỗi lần\n`edit` (latest-wins, cùng khuôn `refs`/`deps`/`acceptance`), validate qua\n`fieldSchema` optional khai trong `DOMAINS[domain]` nếu domain có khai — pattern\nđộc lập với phần status/category ở trên, KHÔNG được implement trong record này\n(ngoài phạm vi `tsk-38t-1`, thuộc `tsk-38t-2` trở đi)."
  },
  "sourceTargetDigestsUnequal": true,
  "classObservation": {
    "class": "Judgment",
    "reason": "no target digest match",
    "targetUnit": null
  },
  "mechanicalRequired": true,
  "deepRequired": true,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_466331635349f55e32c11e0fcf56d334"
}
```

## Entry claim_3f65fc24d3eeb760ecc11ff781159152

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_3f65fc24d3eeb760ecc11ff781159152",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "b-decisions-second",
  "before": {
    "claimId": "claim_3f65fc24d3eeb760ecc11ff781159152",
    "sourceUnitDigest": "1c7ea2fda926300b",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-68",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "ADR 0027 statement of the exact supersede scope (only the first segment); carried verbatim.",
    "reviewedBy": "independent reviewer (review-b-decisions-second)",
    "reviewedAt": "2026-10-07",
    "targetUnitDigest": "1c7ea2fda926300b7351bee9c39ec931"
  },
  "currentDecision": {
    "claimId": "claim_3f65fc24d3eeb760ecc11ff781159152",
    "sourceUnitDigest": "1c7ea2fda926300b",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-68",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "ADR 0027 statement of the exact supersede scope (only the first segment); carried verbatim. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
    "targetUnitDigest": "1c7ea2fda926300b7351bee9c39ec9314d0d7f3d053ba408667ef2c0d8f4ac0c",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Decision"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/specs/work-state.md",
    "unitDigest": "0e80bfc727cf9925150e855c03e2047b4ce70b5ae9126304b0730b053573c672",
    "identityFingerprint": "0e80bfc727cf9925150e855c03e2047b4ce70b5ae9126304b0730b053573c672",
    "claimId": "claim_3f65fc24d3eeb760ecc11ff781159152",
    "sourceAnchor": "unheaded-block-178",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "1c7ea2fda926300b7351bee9c39ec9314d0d7f3d053ba408667ef2c0d8f4ac0c",
    "claimKind": "specification",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-178",
      "githubAnchor": "unheaded-block-178",
      "stableAnchor": "unheaded-block-178",
      "title": "Unheaded block 178",
      "startLine": 1931,
      "endLine": 1933,
      "textDigest": "1c7ea2fda926300b7351bee9c39ec9314d0d7f3d053ba408667ef2c0d8f4ac0c",
      "sample": "**Phạm vi supersede CHÍNH XÁC — chỉ ĐOẠN ĐẦU, không phải toàn bộ FSM.** 10\nstatus hôm nay chia làm hai nhóm bản chất khác nhau, theo tiêu chí \"domain có\nđược tự đặt nhãn/cạnh chuyể",
      "identityFingerprint": "0e80bfc727cf9925150e855c03e2047b4ce70b5ae9126304b0730b053573c672",
      "ancestry": [
        "0002 — Mô hình việc phẳng",
        "0027 — Domain sở hữu vocabulary/transition status đoạn TRƯỚC `delivered` (supersede base-workflow-model)",
        "Quyết định"
      ],
      "text": "**Phạm vi supersede CHÍNH XÁC — chỉ ĐOẠN ĐẦU, không phải toàn bộ FSM.** 10\nstatus hôm nay chia làm hai nhóm bản chất khác nhau, theo tiêu chí \"domain có\nđược tự đặt nhãn/cạnh chuyển khác cho status này không\" (DISCUSSION.md §6):"
    }
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-68",
    "githubAnchor": "unheaded-block-68",
    "stableAnchor": "unheaded-block-68",
    "title": "Unheaded block 68",
    "startLine": 588,
    "endLine": 590,
    "textDigest": "1c7ea2fda926300b7351bee9c39ec9314d0d7f3d053ba408667ef2c0d8f4ac0c",
    "sample": "**Phạm vi supersede CHÍNH XÁC — chỉ ĐOẠN ĐẦU, không phải toàn bộ FSM.** 10\nstatus hôm nay chia làm hai nhóm bản chất khác nhau, theo tiêu chí \"domain có\nđược tự đặt nhãn/cạnh chuyể",
    "identityFingerprint": "0e80bfc727cf9925150e855c03e2047b4ce70b5ae9126304b0730b053573c672",
    "ancestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Decision"
    ],
    "text": "**Phạm vi supersede CHÍNH XÁC — chỉ ĐOẠN ĐẦU, không phải toàn bộ FSM.** 10\nstatus hôm nay chia làm hai nhóm bản chất khác nhau, theo tiêu chí \"domain có\nđược tự đặt nhãn/cạnh chuyển khác cho status này không\" (DISCUSSION.md §6):"
  },
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Weak-exact",
    "reason": "ancestor headings differ; document exact share below one half",
    "targetUnit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-68",
      "githubAnchor": "unheaded-block-68",
      "stableAnchor": "unheaded-block-68",
      "title": "Unheaded block 68",
      "startLine": 588,
      "endLine": 590,
      "textDigest": "1c7ea2fda926300b7351bee9c39ec9314d0d7f3d053ba408667ef2c0d8f4ac0c",
      "sample": "**Phạm vi supersede CHÍNH XÁC — chỉ ĐOẠN ĐẦU, không phải toàn bộ FSM.** 10\nstatus hôm nay chia làm hai nhóm bản chất khác nhau, theo tiêu chí \"domain có\nđược tự đặt nhãn/cạnh chuyể",
      "identityFingerprint": "0e80bfc727cf9925150e855c03e2047b4ce70b5ae9126304b0730b053573c672",
      "ancestry": [
        "Retired Decision History: Work State",
        "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
        "0027 Decision"
      ],
      "text": "**Phạm vi supersede CHÍNH XÁC — chỉ ĐOẠN ĐẦU, không phải toàn bộ FSM.** 10\nstatus hôm nay chia làm hai nhóm bản chất khác nhau, theo tiêu chí \"domain có\nđược tự đặt nhãn/cạnh chuyển khác cho status này không\" (DISCUSSION.md §6):"
    }
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_3f65fc24d3eeb760ecc11ff781159152"
}
```

## Entry claim_a4a77d7c336663f81a9bc8ac697ab518

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_a4a77d7c336663f81a9bc8ac697ab518",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "b-decisions-second",
  "before": {
    "claimId": "claim_a4a77d7c336663f81a9bc8ac697ab518",
    "sourceUnitDigest": "46ec1457959a8895",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-69",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "ADR 0027 list of the six pre-delivered statuses and the tail group; carried verbatim.",
    "reviewedBy": "independent reviewer (review-b-decisions-second)",
    "reviewedAt": "2026-10-07",
    "targetUnitDigest": "46ec1457959a8895465a7d7320215bb4"
  },
  "currentDecision": {
    "claimId": "claim_a4a77d7c336663f81a9bc8ac697ab518",
    "sourceUnitDigest": "46ec1457959a8895",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-69",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "ADR 0027 list of the six pre-delivered statuses and the tail group; carried verbatim. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
    "targetUnitDigest": "46ec1457959a8895465a7d7320215bb4940457e34d39eaeb5ab18a8b637aae01",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Decision"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/specs/work-state.md",
    "unitDigest": "122bdf50036f7096478eff347da9f2969e2f284f7cf7a4e0f2f89784618a3d8e",
    "identityFingerprint": "122bdf50036f7096478eff347da9f2969e2f284f7cf7a4e0f2f89784618a3d8e",
    "claimId": "claim_a4a77d7c336663f81a9bc8ac697ab518",
    "sourceAnchor": "unheaded-block-179",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "46ec1457959a8895465a7d7320215bb4940457e34d39eaeb5ab18a8b637aae01",
    "claimKind": "specification",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-179",
      "githubAnchor": "unheaded-block-179",
      "stableAnchor": "unheaded-block-179",
      "title": "Unheaded block 179",
      "startLine": 1935,
      "endLine": 1951,
      "textDigest": "46ec1457959a8895465a7d7320215bb4940457e34d39eaeb5ab18a8b637aae01",
      "sample": "- **NHÓM ĐẦU — 6 status TRƯỚC `delivered`:** `todo` / `doing` / `blocked` /\n  `awaiting-human` / `awaiting-approval` / `wontfix`. Kể từ record này, domain\n  SỞ HỮU nhãn + bảng tran",
      "identityFingerprint": "122bdf50036f7096478eff347da9f2969e2f284f7cf7a4e0f2f89784618a3d8e",
      "ancestry": [
        "0002 — Mô hình việc phẳng",
        "0027 — Domain sở hữu vocabulary/transition status đoạn TRƯỚC `delivered` (supersede base-workflow-model)",
        "Quyết định"
      ],
      "text": "- **NHÓM ĐẦU — 6 status TRƯỚC `delivered`:** `todo` / `doing` / `blocked` /\n  `awaiting-human` / `awaiting-approval` / `wontfix`. Kể từ record này, domain\n  SỞ HỮU nhãn + bảng transition riêng cho nhóm này — đây là phần thật sự\n  supersede `base-workflow-model`. Domain KHÔNG BẮT BUỘC đổi tên\n  (coding giữ nguyên cả 6 chữ, 0 migration) — cả hai điều này chỉ trao QUYỀN, không\n  ép dùng.\n- **NHÓM ĐUÔI — 4 status TỪ `delivered` trở đi:** `delivered` → `retrospective`\n  → `cleanup` → `done`, chuỗi TUYẾN TÍNH cố định. KHÔNG domain nào được\n  relabel — đây là nghĩa vụ phổ quát của bất kỳ loại hình việc nào (delivery\n  thật, nhìn lại, dọn dẹp), không phải từ vựng riêng của `coding` (xác\n  nhận trực tiếp: \"loại hình việc nào cũng cần delivery, retro, và cleanup...\n  chỉ có tổ chức nào quá hời hợt sẽ bỏ qua retro và cleanup\"). Khác biệt\n  per-domain ở nhóm này nằm ở **skill nào chạy** bước `retrospective` (mở\n  rộng đúng field `skillMap` đã có trong `DOMAINS[domain]`,\n  `workflow-stage-graphs.mjs`, thêm key `retrospective`; `cleanup` giữ nguyên\n  pure-harness, không cần skill — khác biệt per-domain của nó đã đủ qua field\n  `worktreeBacked` có sẵn), KHÔNG phải ở tên/cạnh chuyển status."
    }
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-69",
    "githubAnchor": "unheaded-block-69",
    "stableAnchor": "unheaded-block-69",
    "title": "Unheaded block 69",
    "startLine": 592,
    "endLine": 608,
    "textDigest": "46ec1457959a8895465a7d7320215bb4940457e34d39eaeb5ab18a8b637aae01",
    "sample": "- **NHÓM ĐẦU — 6 status TRƯỚC `delivered`:** `todo` / `doing` / `blocked` /\n  `awaiting-human` / `awaiting-approval` / `wontfix`. Kể từ record này, domain\n  SỞ HỮU nhãn + bảng tran",
    "identityFingerprint": "122bdf50036f7096478eff347da9f2969e2f284f7cf7a4e0f2f89784618a3d8e",
    "ancestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Decision"
    ],
    "text": "- **NHÓM ĐẦU — 6 status TRƯỚC `delivered`:** `todo` / `doing` / `blocked` /\n  `awaiting-human` / `awaiting-approval` / `wontfix`. Kể từ record này, domain\n  SỞ HỮU nhãn + bảng transition riêng cho nhóm này — đây là phần thật sự\n  supersede `base-workflow-model`. Domain KHÔNG BẮT BUỘC đổi tên\n  (coding giữ nguyên cả 6 chữ, 0 migration) — cả hai điều này chỉ trao QUYỀN, không\n  ép dùng.\n- **NHÓM ĐUÔI — 4 status TỪ `delivered` trở đi:** `delivered` → `retrospective`\n  → `cleanup` → `done`, chuỗi TUYẾN TÍNH cố định. KHÔNG domain nào được\n  relabel — đây là nghĩa vụ phổ quát của bất kỳ loại hình việc nào (delivery\n  thật, nhìn lại, dọn dẹp), không phải từ vựng riêng của `coding` (xác\n  nhận trực tiếp: \"loại hình việc nào cũng cần delivery, retro, và cleanup...\n  chỉ có tổ chức nào quá hời hợt sẽ bỏ qua retro và cleanup\"). Khác biệt\n  per-domain ở nhóm này nằm ở **skill nào chạy** bước `retrospective` (mở\n  rộng đúng field `skillMap` đã có trong `DOMAINS[domain]`,\n  `workflow-stage-graphs.mjs`, thêm key `retrospective`; `cleanup` giữ nguyên\n  pure-harness, không cần skill — khác biệt per-domain của nó đã đủ qua field\n  `worktreeBacked` có sẵn), KHÔNG phải ở tên/cạnh chuyển status."
  },
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Weak-exact",
    "reason": "ancestor headings differ; document exact share below one half",
    "targetUnit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-69",
      "githubAnchor": "unheaded-block-69",
      "stableAnchor": "unheaded-block-69",
      "title": "Unheaded block 69",
      "startLine": 592,
      "endLine": 608,
      "textDigest": "46ec1457959a8895465a7d7320215bb4940457e34d39eaeb5ab18a8b637aae01",
      "sample": "- **NHÓM ĐẦU — 6 status TRƯỚC `delivered`:** `todo` / `doing` / `blocked` /\n  `awaiting-human` / `awaiting-approval` / `wontfix`. Kể từ record này, domain\n  SỞ HỮU nhãn + bảng tran",
      "identityFingerprint": "122bdf50036f7096478eff347da9f2969e2f284f7cf7a4e0f2f89784618a3d8e",
      "ancestry": [
        "Retired Decision History: Work State",
        "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
        "0027 Decision"
      ],
      "text": "- **NHÓM ĐẦU — 6 status TRƯỚC `delivered`:** `todo` / `doing` / `blocked` /\n  `awaiting-human` / `awaiting-approval` / `wontfix`. Kể từ record này, domain\n  SỞ HỮU nhãn + bảng transition riêng cho nhóm này — đây là phần thật sự\n  supersede `base-workflow-model`. Domain KHÔNG BẮT BUỘC đổi tên\n  (coding giữ nguyên cả 6 chữ, 0 migration) — cả hai điều này chỉ trao QUYỀN, không\n  ép dùng.\n- **NHÓM ĐUÔI — 4 status TỪ `delivered` trở đi:** `delivered` → `retrospective`\n  → `cleanup` → `done`, chuỗi TUYẾN TÍNH cố định. KHÔNG domain nào được\n  relabel — đây là nghĩa vụ phổ quát của bất kỳ loại hình việc nào (delivery\n  thật, nhìn lại, dọn dẹp), không phải từ vựng riêng của `coding` (xác\n  nhận trực tiếp: \"loại hình việc nào cũng cần delivery, retro, và cleanup...\n  chỉ có tổ chức nào quá hời hợt sẽ bỏ qua retro và cleanup\"). Khác biệt\n  per-domain ở nhóm này nằm ở **skill nào chạy** bước `retrospective` (mở\n  rộng đúng field `skillMap` đã có trong `DOMAINS[domain]`,\n  `workflow-stage-graphs.mjs`, thêm key `retrospective`; `cleanup` giữ nguyên\n  pure-harness, không cần skill — khác biệt per-domain của nó đã đủ qua field\n  `worktreeBacked` có sẵn), KHÔNG phải ở tên/cạnh chuyển status."
    }
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_a4a77d7c336663f81a9bc8ac697ab518"
}
```

## Entry claim_a4ed529f5ed4745e1c6bbbb06eb3a4b2

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_a4ed529f5ed4745e1c6bbbb06eb3a4b2",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "b-decisions-second",
  "before": {
    "claimId": "claim_a4ed529f5ed4745e1c6bbbb06eb3a4b2",
    "sourceUnitDigest": "127c7c7a99d0a8fc",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-70",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "ADR 0027 sentence introducing the statusCategory mapping table; carried verbatim.",
    "reviewedBy": "independent reviewer (review-b-decisions-second)",
    "reviewedAt": "2026-10-07",
    "targetUnitDigest": "127c7c7a99d0a8fcab543606c597226d"
  },
  "currentDecision": {
    "claimId": "claim_a4ed529f5ed4745e1c6bbbb06eb3a4b2",
    "sourceUnitDigest": "127c7c7a99d0a8fc",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-70",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "ADR 0027 sentence introducing the statusCategory mapping table; carried verbatim. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
    "targetUnitDigest": "127c7c7a99d0a8fcab543606c597226d64df9b202cda0911d7cbaa815a363cf4",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Decision"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/specs/work-state.md",
    "unitDigest": "bed7ecbd4d2176895459cba453f3620a2c4c09413c3357511c7a7820a50935d8",
    "identityFingerprint": "bed7ecbd4d2176895459cba453f3620a2c4c09413c3357511c7a7820a50935d8",
    "claimId": "claim_a4ed529f5ed4745e1c6bbbb06eb3a4b2",
    "sourceAnchor": "unheaded-block-180",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "127c7c7a99d0a8fcab543606c597226d64df9b202cda0911d7cbaa815a363cf4",
    "claimKind": "specification",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-180",
      "githubAnchor": "unheaded-block-180",
      "stableAnchor": "unheaded-block-180",
      "title": "Unheaded block 180",
      "startLine": 1953,
      "endLine": 1955,
      "textDigest": "127c7c7a99d0a8fcab543606c597226d64df9b202cda0911d7cbaa815a363cf4",
      "sample": "Bảng map 6 status đoạn đầu → `statusCategory` (field foundation mới,\nđóng băng lúc ghi event `work.move`/`work.add`, **KHÔNG derive-on-read** —\nluật L3, `docs/platform-foundations.",
      "identityFingerprint": "bed7ecbd4d2176895459cba453f3620a2c4c09413c3357511c7a7820a50935d8",
      "ancestry": [
        "0002 — Mô hình việc phẳng",
        "0027 — Domain sở hữu vocabulary/transition status đoạn TRƯỚC `delivered` (supersede base-workflow-model)",
        "Quyết định"
      ],
      "text": "Bảng map 6 status đoạn đầu → `statusCategory` (field foundation mới,\nđóng băng lúc ghi event `work.move`/`work.add`, **KHÔNG derive-on-read** —\nluật L3, `docs/platform-foundations.md`):"
    }
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-70",
    "githubAnchor": "unheaded-block-70",
    "stableAnchor": "unheaded-block-70",
    "title": "Unheaded block 70",
    "startLine": 610,
    "endLine": 612,
    "textDigest": "127c7c7a99d0a8fcab543606c597226d64df9b202cda0911d7cbaa815a363cf4",
    "sample": "Bảng map 6 status đoạn đầu → `statusCategory` (field foundation mới,\nđóng băng lúc ghi event `work.move`/`work.add`, **KHÔNG derive-on-read** —\nluật L3, `docs/platform-foundations.",
    "identityFingerprint": "bed7ecbd4d2176895459cba453f3620a2c4c09413c3357511c7a7820a50935d8",
    "ancestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Decision"
    ],
    "text": "Bảng map 6 status đoạn đầu → `statusCategory` (field foundation mới,\nđóng băng lúc ghi event `work.move`/`work.add`, **KHÔNG derive-on-read** —\nluật L3, `docs/platform-foundations.md`):"
  },
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Weak-exact",
    "reason": "ancestor headings differ; document exact share below one half",
    "targetUnit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-70",
      "githubAnchor": "unheaded-block-70",
      "stableAnchor": "unheaded-block-70",
      "title": "Unheaded block 70",
      "startLine": 610,
      "endLine": 612,
      "textDigest": "127c7c7a99d0a8fcab543606c597226d64df9b202cda0911d7cbaa815a363cf4",
      "sample": "Bảng map 6 status đoạn đầu → `statusCategory` (field foundation mới,\nđóng băng lúc ghi event `work.move`/`work.add`, **KHÔNG derive-on-read** —\nluật L3, `docs/platform-foundations.",
      "identityFingerprint": "bed7ecbd4d2176895459cba453f3620a2c4c09413c3357511c7a7820a50935d8",
      "ancestry": [
        "Retired Decision History: Work State",
        "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
        "0027 Decision"
      ],
      "text": "Bảng map 6 status đoạn đầu → `statusCategory` (field foundation mới,\nđóng băng lúc ghi event `work.move`/`work.add`, **KHÔNG derive-on-read** —\nluật L3, `docs/platform-foundations.md`):"
    }
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_a4ed529f5ed4745e1c6bbbb06eb3a4b2"
}
```

## Entry claim_f3d9c6dbb704d09c37ab5cfd4f65927e

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_f3d9c6dbb704d09c37ab5cfd4f65927e",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "b-decisions-second",
  "before": {
    "claimId": "claim_f3d9c6dbb704d09c37ab5cfd4f65927e",
    "sourceUnitDigest": "7b133e87cfdf8159",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-71",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "ADR 0027 status-to-statusCategory mapping table; carried verbatim (table markup intact).",
    "reviewedBy": "independent reviewer (review-b-decisions-second)",
    "reviewedAt": "2026-10-07",
    "targetUnitDigest": "7b133e87cfdf8159a9ddd402d8ce2f59"
  },
  "currentDecision": {
    "claimId": "claim_f3d9c6dbb704d09c37ab5cfd4f65927e",
    "sourceUnitDigest": "7b133e87cfdf8159",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-71",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "ADR 0027 status-to-statusCategory mapping table; carried verbatim (table markup intact). L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
    "targetUnitDigest": "7b133e87cfdf8159a9ddd402d8ce2f59f1a286b8bac218807963a8a8bbbf3483",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Decision"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/specs/work-state.md",
    "unitDigest": "6da118ffabbae1952717861be30debca4074744c39cc5ab0c60cfb2678f5555a",
    "identityFingerprint": "6da118ffabbae1952717861be30debca4074744c39cc5ab0c60cfb2678f5555a",
    "claimId": "claim_f3d9c6dbb704d09c37ab5cfd4f65927e",
    "sourceAnchor": "unheaded-block-181",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "7b133e87cfdf8159a9ddd402d8ce2f59f1a286b8bac218807963a8a8bbbf3483",
    "claimKind": "specification",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-181",
      "githubAnchor": "unheaded-block-181",
      "stableAnchor": "unheaded-block-181",
      "title": "Unheaded block 181",
      "startLine": 1957,
      "endLine": 1964,
      "textDigest": "7b133e87cfdf8159a9ddd402d8ce2f59f1a286b8bac218807963a8a8bbbf3483",
      "sample": "| status (đoạn đầu) | statusCategory |\n|---|---|\n| `todo` | `todo` |\n| `doing` | `in-progress` |\n| `blocked` | `in-progress` |\n| `awaiting-human` | `in-progress` |\n| `awaiting-appr",
      "identityFingerprint": "6da118ffabbae1952717861be30debca4074744c39cc5ab0c60cfb2678f5555a",
      "ancestry": [
        "0002 — Mô hình việc phẳng",
        "0027 — Domain sở hữu vocabulary/transition status đoạn TRƯỚC `delivered` (supersede base-workflow-model)",
        "Quyết định"
      ],
      "text": "| status (đoạn đầu) | statusCategory |\n|---|---|\n| `todo` | `todo` |\n| `doing` | `in-progress` |\n| `blocked` | `in-progress` |\n| `awaiting-human` | `in-progress` |\n| `awaiting-approval` | `review` |\n| `wontfix` | `canceled` |"
    }
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-71",
    "githubAnchor": "unheaded-block-71",
    "stableAnchor": "unheaded-block-71",
    "title": "Unheaded block 71",
    "startLine": 614,
    "endLine": 621,
    "textDigest": "7b133e87cfdf8159a9ddd402d8ce2f59f1a286b8bac218807963a8a8bbbf3483",
    "sample": "| status (đoạn đầu) | statusCategory |\n|---|---|\n| `todo` | `todo` |\n| `doing` | `in-progress` |\n| `blocked` | `in-progress` |\n| `awaiting-human` | `in-progress` |\n| `awaiting-appr",
    "identityFingerprint": "6da118ffabbae1952717861be30debca4074744c39cc5ab0c60cfb2678f5555a",
    "ancestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Decision"
    ],
    "text": "| status (đoạn đầu) | statusCategory |\n|---|---|\n| `todo` | `todo` |\n| `doing` | `in-progress` |\n| `blocked` | `in-progress` |\n| `awaiting-human` | `in-progress` |\n| `awaiting-approval` | `review` |\n| `wontfix` | `canceled` |"
  },
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Weak-exact",
    "reason": "ancestor headings differ; document exact share below one half",
    "targetUnit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-71",
      "githubAnchor": "unheaded-block-71",
      "stableAnchor": "unheaded-block-71",
      "title": "Unheaded block 71",
      "startLine": 614,
      "endLine": 621,
      "textDigest": "7b133e87cfdf8159a9ddd402d8ce2f59f1a286b8bac218807963a8a8bbbf3483",
      "sample": "| status (đoạn đầu) | statusCategory |\n|---|---|\n| `todo` | `todo` |\n| `doing` | `in-progress` |\n| `blocked` | `in-progress` |\n| `awaiting-human` | `in-progress` |\n| `awaiting-appr",
      "identityFingerprint": "6da118ffabbae1952717861be30debca4074744c39cc5ab0c60cfb2678f5555a",
      "ancestry": [
        "Retired Decision History: Work State",
        "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
        "0027 Decision"
      ],
      "text": "| status (đoạn đầu) | statusCategory |\n|---|---|\n| `todo` | `todo` |\n| `doing` | `in-progress` |\n| `blocked` | `in-progress` |\n| `awaiting-human` | `in-progress` |\n| `awaiting-approval` | `review` |\n| `wontfix` | `canceled` |"
    }
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_f3d9c6dbb704d09c37ab5cfd4f65927e"
}
```

## Entry claim_6c5753df306960b46d20e133a2a36894

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_6c5753df306960b46d20e133a2a36894",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "b-decisions-second",
  "before": {
    "claimId": "claim_6c5753df306960b46d20e133a2a36894",
    "sourceUnitDigest": "6d99060fca9f1fb5",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-72",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "ADR 0027 paragraph on statusCategory being a proven lossy compression; carried verbatim.",
    "reviewedBy": "independent reviewer (review-b-decisions-second)",
    "reviewedAt": "2026-10-07",
    "targetUnitDigest": "6d99060fca9f1fb5602ee7d2ec14775a"
  },
  "currentDecision": {
    "claimId": "claim_6c5753df306960b46d20e133a2a36894",
    "sourceUnitDigest": "6d99060fca9f1fb5",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-72",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "ADR 0027 paragraph on statusCategory being a proven lossy compression; carried verbatim. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
    "targetUnitDigest": "6d99060fca9f1fb5602ee7d2ec14775af7aa01b666e2f16ed715219741b651c5",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Decision"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/specs/work-state.md",
    "unitDigest": "21ccf179d35d1ee742a80234d0542712cc57f70fc90819969289dff474474d05",
    "identityFingerprint": "21ccf179d35d1ee742a80234d0542712cc57f70fc90819969289dff474474d05",
    "claimId": "claim_6c5753df306960b46d20e133a2a36894",
    "sourceAnchor": "unheaded-block-182",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "6d99060fca9f1fb5602ee7d2ec14775af7aa01b666e2f16ed715219741b651c5",
    "claimKind": "specification",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-182",
      "githubAnchor": "unheaded-block-182",
      "stableAnchor": "unheaded-block-182",
      "title": "Unheaded block 182",
      "startLine": 1966,
      "endLine": 1974,
      "textDigest": "6d99060fca9f1fb5602ee7d2ec14775af7aa01b666e2f16ed715219741b651c5",
      "sample": "`statusCategory` là **bản nén có mất mát, đã chứng minh lủng** — KHÔNG được\ndùng để validate move: cạnh `blocked → awaiting-human` không tồn tại trong 24\ncạnh thật của `status-fsm.",
      "identityFingerprint": "21ccf179d35d1ee742a80234d0542712cc57f70fc90819969289dff474474d05",
      "ancestry": [
        "0002 — Mô hình việc phẳng",
        "0027 — Domain sở hữu vocabulary/transition status đoạn TRƯỚC `delivered` (supersede base-workflow-model)",
        "Quyết định"
      ],
      "text": "`statusCategory` là **bản nén có mất mát, đã chứng minh lủng** — KHÔNG được\ndùng để validate move: cạnh `blocked → awaiting-human` không tồn tại trong 24\ncạnh thật của `status-fsm.mjs` hôm nay, dù cả hai status cùng rơi vào category\n`in-progress`; validate ở tầng category sẽ tự động legalize sai cạnh này.\nValidate move vẫn luôn đi qua bảng transition ĐẦY ĐỦ, MỊN của chính domain đó\n(`status-fsm.mjs` hôm nay cho `coding`) — `statusCategory` chỉ phục vụ các cơ\nchế domain-agnostic (frontier `ready`-filter, rollup, outcome/friction,\ndiscovery-judge) đọc \"item đang ở nhóm nào\" mà không cần học từ vựng của từng\ndomain."
    }
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-72",
    "githubAnchor": "unheaded-block-72",
    "stableAnchor": "unheaded-block-72",
    "title": "Unheaded block 72",
    "startLine": 623,
    "endLine": 631,
    "textDigest": "6d99060fca9f1fb5602ee7d2ec14775af7aa01b666e2f16ed715219741b651c5",
    "sample": "`statusCategory` là **bản nén có mất mát, đã chứng minh lủng** — KHÔNG được\ndùng để validate move: cạnh `blocked → awaiting-human` không tồn tại trong 24\ncạnh thật của `status-fsm.",
    "identityFingerprint": "21ccf179d35d1ee742a80234d0542712cc57f70fc90819969289dff474474d05",
    "ancestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Decision"
    ],
    "text": "`statusCategory` là **bản nén có mất mát, đã chứng minh lủng** — KHÔNG được\ndùng để validate move: cạnh `blocked → awaiting-human` không tồn tại trong 24\ncạnh thật của `status-fsm.mjs` hôm nay, dù cả hai status cùng rơi vào category\n`in-progress`; validate ở tầng category sẽ tự động legalize sai cạnh này.\nValidate move vẫn luôn đi qua bảng transition ĐẦY ĐỦ, MỊN của chính domain đó\n(`status-fsm.mjs` hôm nay cho `coding`) — `statusCategory` chỉ phục vụ các cơ\nchế domain-agnostic (frontier `ready`-filter, rollup, outcome/friction,\ndiscovery-judge) đọc \"item đang ở nhóm nào\" mà không cần học từ vựng của từng\ndomain."
  },
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Weak-exact",
    "reason": "ancestor headings differ; document exact share below one half",
    "targetUnit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-72",
      "githubAnchor": "unheaded-block-72",
      "stableAnchor": "unheaded-block-72",
      "title": "Unheaded block 72",
      "startLine": 623,
      "endLine": 631,
      "textDigest": "6d99060fca9f1fb5602ee7d2ec14775af7aa01b666e2f16ed715219741b651c5",
      "sample": "`statusCategory` là **bản nén có mất mát, đã chứng minh lủng** — KHÔNG được\ndùng để validate move: cạnh `blocked → awaiting-human` không tồn tại trong 24\ncạnh thật của `status-fsm.",
      "identityFingerprint": "21ccf179d35d1ee742a80234d0542712cc57f70fc90819969289dff474474d05",
      "ancestry": [
        "Retired Decision History: Work State",
        "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
        "0027 Decision"
      ],
      "text": "`statusCategory` là **bản nén có mất mát, đã chứng minh lủng** — KHÔNG được\ndùng để validate move: cạnh `blocked → awaiting-human` không tồn tại trong 24\ncạnh thật của `status-fsm.mjs` hôm nay, dù cả hai status cùng rơi vào category\n`in-progress`; validate ở tầng category sẽ tự động legalize sai cạnh này.\nValidate move vẫn luôn đi qua bảng transition ĐẦY ĐỦ, MỊN của chính domain đó\n(`status-fsm.mjs` hôm nay cho `coding`) — `statusCategory` chỉ phục vụ các cơ\nchế domain-agnostic (frontier `ready`-filter, rollup, outcome/friction,\ndiscovery-judge) đọc \"item đang ở nhóm nào\" mà không cần học từ vựng của từng\ndomain."
    }
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_6c5753df306960b46d20e133a2a36894"
}
```

## Entry claim_1d98a4a5c3391d5318f53153b3f5f442

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_1d98a4a5c3391d5318f53153b3f5f442",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "b-decisions-second",
  "before": {
    "claimId": "claim_1d98a4a5c3391d5318f53153b3f5f442",
    "sourceUnitDigest": "7c211b5505c4924d",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-73",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "ADR 0027 paragraph that the four tail statuses need no statusCategory; carried verbatim.",
    "reviewedBy": "independent reviewer (review-b-decisions-second)",
    "reviewedAt": "2026-10-07",
    "targetUnitDigest": "7c211b5505c4924dd9c23a68d64ab366"
  },
  "currentDecision": {
    "claimId": "claim_1d98a4a5c3391d5318f53153b3f5f442",
    "sourceUnitDigest": "7c211b5505c4924d",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-73",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "ADR 0027 paragraph that the four tail statuses need no statusCategory; carried verbatim. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
    "targetUnitDigest": "7c211b5505c4924dd9c23a68d64ab36658204db5c7e536e15eceea988ef445f7",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Decision"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/specs/work-state.md",
    "unitDigest": "a9a89ce342c77713fc636f2625bef8cb1ee76fd175ce6b302c97c4b72cb0d98d",
    "identityFingerprint": "a9a89ce342c77713fc636f2625bef8cb1ee76fd175ce6b302c97c4b72cb0d98d",
    "claimId": "claim_1d98a4a5c3391d5318f53153b3f5f442",
    "sourceAnchor": "unheaded-block-183",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "7c211b5505c4924dd9c23a68d64ab36658204db5c7e536e15eceea988ef445f7",
    "claimKind": "specification",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-183",
      "githubAnchor": "unheaded-block-183",
      "stableAnchor": "unheaded-block-183",
      "title": "Unheaded block 183",
      "startLine": 1976,
      "endLine": 1978,
      "textDigest": "7c211b5505c4924dd9c23a68d64ab36658204db5c7e536e15eceea988ef445f7",
      "sample": "4 status đoạn đuôi **KHÔNG cần** `statusCategory` — literal status đã đủ dùng\nmãi mãi cho mọi domain, không có khái niệm \"domain tự đặt nhãn cho `delivered`\"\nđể cần nén.",
      "identityFingerprint": "a9a89ce342c77713fc636f2625bef8cb1ee76fd175ce6b302c97c4b72cb0d98d",
      "ancestry": [
        "0002 — Mô hình việc phẳng",
        "0027 — Domain sở hữu vocabulary/transition status đoạn TRƯỚC `delivered` (supersede base-workflow-model)",
        "Quyết định"
      ],
      "text": "4 status đoạn đuôi **KHÔNG cần** `statusCategory` — literal status đã đủ dùng\nmãi mãi cho mọi domain, không có khái niệm \"domain tự đặt nhãn cho `delivered`\"\nđể cần nén."
    }
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-73",
    "githubAnchor": "unheaded-block-73",
    "stableAnchor": "unheaded-block-73",
    "title": "Unheaded block 73",
    "startLine": 633,
    "endLine": 635,
    "textDigest": "7c211b5505c4924dd9c23a68d64ab36658204db5c7e536e15eceea988ef445f7",
    "sample": "4 status đoạn đuôi **KHÔNG cần** `statusCategory` — literal status đã đủ dùng\nmãi mãi cho mọi domain, không có khái niệm \"domain tự đặt nhãn cho `delivered`\"\nđể cần nén.",
    "identityFingerprint": "a9a89ce342c77713fc636f2625bef8cb1ee76fd175ce6b302c97c4b72cb0d98d",
    "ancestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Decision"
    ],
    "text": "4 status đoạn đuôi **KHÔNG cần** `statusCategory` — literal status đã đủ dùng\nmãi mãi cho mọi domain, không có khái niệm \"domain tự đặt nhãn cho `delivered`\"\nđể cần nén."
  },
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Weak-exact",
    "reason": "ancestor headings differ; document exact share below one half",
    "targetUnit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-73",
      "githubAnchor": "unheaded-block-73",
      "stableAnchor": "unheaded-block-73",
      "title": "Unheaded block 73",
      "startLine": 633,
      "endLine": 635,
      "textDigest": "7c211b5505c4924dd9c23a68d64ab36658204db5c7e536e15eceea988ef445f7",
      "sample": "4 status đoạn đuôi **KHÔNG cần** `statusCategory` — literal status đã đủ dùng\nmãi mãi cho mọi domain, không có khái niệm \"domain tự đặt nhãn cho `delivered`\"\nđể cần nén.",
      "identityFingerprint": "a9a89ce342c77713fc636f2625bef8cb1ee76fd175ce6b302c97c4b72cb0d98d",
      "ancestry": [
        "Retired Decision History: Work State",
        "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
        "0027 Decision"
      ],
      "text": "4 status đoạn đuôi **KHÔNG cần** `statusCategory` — literal status đã đủ dùng\nmãi mãi cho mọi domain, không có khái niệm \"domain tự đặt nhãn cho `delivered`\"\nđể cần nén."
    }
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_1d98a4a5c3391d5318f53153b3f5f442"
}
```

## Entry claim_546450931dd47024138ce0a32699cd72

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_546450931dd47024138ce0a32699cd72",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "b-decisions-second",
  "before": {
    "claimId": "claim_546450931dd47024138ce0a32699cd72",
    "sourceUnitDigest": "31a4c4ddccf1d5d5",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-74",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "ADR 0027 out-of-scope list of the supersede; carried verbatim.",
    "reviewedBy": "independent reviewer (review-b-decisions-second)",
    "reviewedAt": "2026-10-07",
    "targetUnitDigest": "31a4c4ddccf1d5d56990ceba0e49bc09"
  },
  "currentDecision": {
    "claimId": "claim_546450931dd47024138ce0a32699cd72",
    "sourceUnitDigest": "31a4c4ddccf1d5d5",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-74",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "ADR 0027 out-of-scope list of the supersede; carried verbatim. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
    "targetUnitDigest": "31a4c4ddccf1d5d56990ceba0e49bc09638561de5ffb5300c3fd73cab4f933fe",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Decision"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/specs/work-state.md",
    "unitDigest": "3417a47ee78449a159af38ddb597291bea4961fbf9430958c9368e194e63bf25",
    "identityFingerprint": "3417a47ee78449a159af38ddb597291bea4961fbf9430958c9368e194e63bf25",
    "claimId": "claim_546450931dd47024138ce0a32699cd72",
    "sourceAnchor": "unheaded-block-184",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "31a4c4ddccf1d5d56990ceba0e49bc09638561de5ffb5300c3fd73cab4f933fe",
    "claimKind": "specification",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-184",
      "githubAnchor": "unheaded-block-184",
      "stableAnchor": "unheaded-block-184",
      "title": "Unheaded block 184",
      "startLine": 1980,
      "endLine": 1986,
      "textDigest": "31a4c4ddccf1d5d56990ceba0e49bc09638561de5ffb5300c3fd73cab4f933fe",
      "sample": "Ngoài phạm vi supersede (tách bạch nêu trên, không phải quyết định mới):\nthêm field optional `domainFields: { [domainName]: {...} } }` trên work item\ncho dữ liệu nested per-domain,",
      "identityFingerprint": "3417a47ee78449a159af38ddb597291bea4961fbf9430958c9368e194e63bf25",
      "ancestry": [
        "0002 — Mô hình việc phẳng",
        "0027 — Domain sở hữu vocabulary/transition status đoạn TRƯỚC `delivered` (supersede base-workflow-model)",
        "Quyết định"
      ],
      "text": "Ngoài phạm vi supersede (tách bạch nêu trên, không phải quyết định mới):\nthêm field optional `domainFields: { [domainName]: {...} } }` trên work item\ncho dữ liệu nested per-domain, optional-additive, ghi đè toàn object mỗi lần\n`edit` (latest-wins, cùng khuôn `refs`/`deps`/`acceptance`), validate qua\n`fieldSchema` optional khai trong `DOMAINS[domain]` nếu domain có khai — pattern\nđộc lập với phần status/category ở trên, KHÔNG được implement trong record này\n(ngoài phạm vi `tsk-38t-1`, thuộc `tsk-38t-2` trở đi)."
    }
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-74",
    "githubAnchor": "unheaded-block-74",
    "stableAnchor": "unheaded-block-74",
    "title": "Unheaded block 74",
    "startLine": 637,
    "endLine": 643,
    "textDigest": "31a4c4ddccf1d5d56990ceba0e49bc09638561de5ffb5300c3fd73cab4f933fe",
    "sample": "Ngoài phạm vi supersede (tách bạch nêu trên, không phải quyết định mới):\nthêm field optional `domainFields: { [domainName]: {...} } }` trên work item\ncho dữ liệu nested per-domain,",
    "identityFingerprint": "3417a47ee78449a159af38ddb597291bea4961fbf9430958c9368e194e63bf25",
    "ancestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Decision"
    ],
    "text": "Ngoài phạm vi supersede (tách bạch nêu trên, không phải quyết định mới):\nthêm field optional `domainFields: { [domainName]: {...} } }` trên work item\ncho dữ liệu nested per-domain, optional-additive, ghi đè toàn object mỗi lần\n`edit` (latest-wins, cùng khuôn `refs`/`deps`/`acceptance`), validate qua\n`fieldSchema` optional khai trong `DOMAINS[domain]` nếu domain có khai — pattern\nđộc lập với phần status/category ở trên, KHÔNG được implement trong record này\n(ngoài phạm vi `tsk-38t-1`, thuộc `tsk-38t-2` trở đi)."
  },
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Weak-exact",
    "reason": "ancestor headings differ; document exact share below one half",
    "targetUnit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-74",
      "githubAnchor": "unheaded-block-74",
      "stableAnchor": "unheaded-block-74",
      "title": "Unheaded block 74",
      "startLine": 637,
      "endLine": 643,
      "textDigest": "31a4c4ddccf1d5d56990ceba0e49bc09638561de5ffb5300c3fd73cab4f933fe",
      "sample": "Ngoài phạm vi supersede (tách bạch nêu trên, không phải quyết định mới):\nthêm field optional `domainFields: { [domainName]: {...} } }` trên work item\ncho dữ liệu nested per-domain,",
      "identityFingerprint": "3417a47ee78449a159af38ddb597291bea4961fbf9430958c9368e194e63bf25",
      "ancestry": [
        "Retired Decision History: Work State",
        "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
        "0027 Decision"
      ],
      "text": "Ngoài phạm vi supersede (tách bạch nêu trên, không phải quyết định mới):\nthêm field optional `domainFields: { [domainName]: {...} } }` trên work item\ncho dữ liệu nested per-domain, optional-additive, ghi đè toàn object mỗi lần\n`edit` (latest-wins, cùng khuôn `refs`/`deps`/`acceptance`), validate qua\n`fieldSchema` optional khai trong `DOMAINS[domain]` nếu domain có khai — pattern\nđộc lập với phần status/category ở trên, KHÔNG được implement trong record này\n(ngoài phạm vi `tsk-38t-1`, thuộc `tsk-38t-2` trở đi)."
    }
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_546450931dd47024138ce0a32699cd72"
}
```

## Entry claim_0da8b597cb243173df9f5eb46a34ec76

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_0da8b597cb243173df9f5eb46a34ec76",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "b-decisions-second",
  "before": {
    "claimId": "claim_0da8b597cb243173df9f5eb46a34ec76",
    "sourceUnitDigest": "7dae6b0f1c8a4ba4",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "0027-consumer-audit",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Source H4 \"Audit: mọi consumer thật ...\" is carried as H3 \"0027 Consumer Audit\"; title shortened and translated.",
    "reviewedBy": "independent reviewer (review-b-decisions-second)",
    "reviewedAt": "2026-10-07",
    "targetUnitDigest": "e8596bf17b33258ee768e967da03d9ef"
  },
  "currentDecision": {
    "claimId": "claim_0da8b597cb243173df9f5eb46a34ec76",
    "sourceUnitDigest": "7dae6b0f1c8a4ba4",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "0027-consumer-audit",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "Source H4 \"Audit: mọi consumer thật ...\" is carried as H3 \"0027 Consumer Audit\"; title shortened and translated. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
    "targetUnitDigest": "e8596bf17b33258ee768e967da03d9efeddd19149ecdbccf1510cc7bdf3ec674",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary"
    ],
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried."
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/specs/work-state.md",
    "unitDigest": "849fa063e6df5d22a2b8d54ae021c2e5cc90b46c86ab92552fe109c9074411b3",
    "identityFingerprint": "559027ce2d77ae11ebdb78d41e0cc2d84aee2e32f48036d61e0f9cf4a57a57ae",
    "claimId": "claim_0da8b597cb243173df9f5eb46a34ec76",
    "sourceAnchor": "audit-mọi-consumer-thật-của-status-fsmmjsstatusestransitionsliteral-status-hôm-nay",
    "unitKind": "heading",
    "sourceUnitDigest": "7dae6b0f1c8a4ba4b700b6a8723d516664ceb3697f8860c66ee5ee50ff0cf1e9",
    "claimKind": "specification",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "heading",
      "level": 4,
      "title": "Audit: mọi consumer thật của `status-fsm.mjs`/`STATUSES`/`TRANSITIONS`/literal status hôm nay",
      "anchor": "audit-mọi-consumer-thật-của-status-fsmmjsstatusestransitionsliteral-status-hôm-nay",
      "githubAnchor": "audit-mọi-consumer-thật-của-status-fsmmjsstatusestransitionsliteral-status-hôm-nay",
      "stableAnchor": "h-0ca84640a58b",
      "startLine": 1988,
      "endLine": 1988,
      "textDigest": "7dae6b0f1c8a4ba4b700b6a8723d516664ceb3697f8860c66ee5ee50ff0cf1e9",
      "sample": "Audit: mọi consumer thật của `status-fsm.mjs`/`STATUSES`/`TRANSITIONS`/literal status hôm nay",
      "sectionPayloadDigest": "c2f2baeae1bc366d51a16dbf1b083a2add5cacd51c1bf7c3ea6d3f91c5190d11",
      "followingBlockDigest": "c2f2baeae1bc366d51a16dbf1b083a2add5cacd51c1bf7c3ea6d3f91c5190d11",
      "identityFingerprint": "559027ce2d77ae11ebdb78d41e0cc2d84aee2e32f48036d61e0f9cf4a57a57ae",
      "ancestry": [
        "0002 — Mô hình việc phẳng",
        "0027 — Domain sở hữu vocabulary/transition status đoạn TRƯỚC `delivered` (supersede base-workflow-model)"
      ],
      "text": "#### Audit: mọi consumer thật của `status-fsm.mjs`/`STATUSES`/`TRANSITIONS`/literal status hôm nay",
      "sectionText": "#### Audit: mọi consumer thật của `status-fsm.mjs`/`STATUSES`/`TRANSITIONS`/literal status hôm nay\n\nQuét bằng `rg -n \"STATUSES|TRANSITIONS\" src/ bin/ --glob '*.mjs'` và\n`rg -n \"'todo'|'doing'|'blocked'|'awaiting-approval'|'awaiting-human'|\n'delivered'|'retrospective'|'cleanup'|'wontfix'\"` trên `frontier.mjs`,\n`retro-pool.mjs`, `status-fsm.mjs`, `runner/*.mjs`, `bin/fgos.mjs` — cộng thêm\nquét mở rộng ra mọi consumer thật của tập `RESOLVED_STATUSES` (đã là 1 tập\n\"giống category\" viết tay, DISCUSSION.md §3 #3) và ra khỏi thư mục `src/`/`bin/`\n(CLI-display doc, external Rust consumer) để không bỏ sót theo đúng yêu cầu\nacceptance của `tsk-38t`. Cột \"Đổi?\" nói rõ consumer này có cần đổi sang đọc\n`statusCategory` (hoặc bảng transition riêng của domain) hay giữ nguyên literal\nmãi mãi theo đúng ranh giới đầu/đuôi vừa chốt ở trên."
    }
  },
  "currentTarget": {
    "unitKind": "heading",
    "level": 3,
    "title": "0027 Consumer Audit",
    "anchor": "0027-consumer-audit",
    "githubAnchor": "0027-consumer-audit",
    "stableAnchor": "h-7732aeaf85dc",
    "startLine": 645,
    "endLine": 645,
    "textDigest": "e8596bf17b33258ee768e967da03d9efeddd19149ecdbccf1510cc7bdf3ec674",
    "sample": "0027 Consumer Audit",
    "sectionPayloadDigest": "c2f2baeae1bc366d51a16dbf1b083a2add5cacd51c1bf7c3ea6d3f91c5190d11",
    "followingBlockDigest": "c2f2baeae1bc366d51a16dbf1b083a2add5cacd51c1bf7c3ea6d3f91c5190d11",
    "identityFingerprint": "5b197c489de9cc0b4cab78f705c0f86f4aed208782af12ed5d1470b0e50ee438",
    "ancestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary"
    ],
    "text": "### 0027 Consumer Audit",
    "sectionText": "### 0027 Consumer Audit\n\nQuét bằng `rg -n \"STATUSES|TRANSITIONS\" src/ bin/ --glob '*.mjs'` và\n`rg -n \"'todo'|'doing'|'blocked'|'awaiting-approval'|'awaiting-human'|\n'delivered'|'retrospective'|'cleanup'|'wontfix'\"` trên `frontier.mjs`,\n`retro-pool.mjs`, `status-fsm.mjs`, `runner/*.mjs`, `bin/fgos.mjs` — cộng thêm\nquét mở rộng ra mọi consumer thật của tập `RESOLVED_STATUSES` (đã là 1 tập\n\"giống category\" viết tay, DISCUSSION.md §3 #3) và ra khỏi thư mục `src/`/`bin/`\n(CLI-display doc, external Rust consumer) để không bỏ sót theo đúng yêu cầu\nacceptance của `tsk-38t`. Cột \"Đổi?\" nói rõ consumer này có cần đổi sang đọc\n`statusCategory` (hoặc bảng transition riêng của domain) hay giữ nguyên literal\nmãi mãi theo đúng ranh giới đầu/đuôi vừa chốt ở trên."
  },
  "sourceTargetDigestsUnequal": true,
  "classObservation": {
    "class": "Judgment",
    "reason": "no target digest match",
    "targetUnit": null
  },
  "mechanicalRequired": true,
  "deepRequired": true,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_0da8b597cb243173df9f5eb46a34ec76"
}
```

## Entry claim_0cabbd5a6b95edeb9aab6832ad276c50

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_0cabbd5a6b95edeb9aab6832ad276c50",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "b-decisions-second",
  "before": {
    "claimId": "claim_0cabbd5a6b95edeb9aab6832ad276c50",
    "sourceUnitDigest": "c2f2baeae1bc366d",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-75",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "ADR 0027 audit method paragraph (rg scan of STATUSES/TRANSITIONS) carried verbatim.",
    "reviewedBy": "independent reviewer (review-b-decisions-second)",
    "reviewedAt": "2026-10-07",
    "targetUnitDigest": "c2f2baeae1bc366d51a16dbf1b083a2a"
  },
  "currentDecision": {
    "claimId": "claim_0cabbd5a6b95edeb9aab6832ad276c50",
    "sourceUnitDigest": "c2f2baeae1bc366d",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-75",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "ADR 0027 audit method paragraph (rg scan of STATUSES/TRANSITIONS) carried verbatim. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
    "targetUnitDigest": "c2f2baeae1bc366d51a16dbf1b083a2add5cacd51c1bf7c3ea6d3f91c5190d11",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Consumer Audit"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/specs/work-state.md",
    "unitDigest": "bbe91d6eb7a56a04458eee39385b2b0817aa46386c1f757b2f1de94328ca2df6",
    "identityFingerprint": "bbe91d6eb7a56a04458eee39385b2b0817aa46386c1f757b2f1de94328ca2df6",
    "claimId": "claim_0cabbd5a6b95edeb9aab6832ad276c50",
    "sourceAnchor": "unheaded-block-185",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "c2f2baeae1bc366d51a16dbf1b083a2add5cacd51c1bf7c3ea6d3f91c5190d11",
    "claimKind": "specification",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-185",
      "githubAnchor": "unheaded-block-185",
      "stableAnchor": "unheaded-block-185",
      "title": "Unheaded block 185",
      "startLine": 1990,
      "endLine": 1999,
      "textDigest": "c2f2baeae1bc366d51a16dbf1b083a2add5cacd51c1bf7c3ea6d3f91c5190d11",
      "sample": "Quét bằng `rg -n \"STATUSES|TRANSITIONS\" src/ bin/ --glob '*.mjs'` và\n`rg -n \"'todo'|'doing'|'blocked'|'awaiting-approval'|'awaiting-human'|\n'delivered'|'retrospective'|'cleanup'|'w",
      "identityFingerprint": "bbe91d6eb7a56a04458eee39385b2b0817aa46386c1f757b2f1de94328ca2df6",
      "ancestry": [
        "0002 — Mô hình việc phẳng",
        "0027 — Domain sở hữu vocabulary/transition status đoạn TRƯỚC `delivered` (supersede base-workflow-model)",
        "Audit: mọi consumer thật của `status-fsm.mjs`/`STATUSES`/`TRANSITIONS`/literal status hôm nay"
      ],
      "text": "Quét bằng `rg -n \"STATUSES|TRANSITIONS\" src/ bin/ --glob '*.mjs'` và\n`rg -n \"'todo'|'doing'|'blocked'|'awaiting-approval'|'awaiting-human'|\n'delivered'|'retrospective'|'cleanup'|'wontfix'\"` trên `frontier.mjs`,\n`retro-pool.mjs`, `status-fsm.mjs`, `runner/*.mjs`, `bin/fgos.mjs` — cộng thêm\nquét mở rộng ra mọi consumer thật của tập `RESOLVED_STATUSES` (đã là 1 tập\n\"giống category\" viết tay, DISCUSSION.md §3 #3) và ra khỏi thư mục `src/`/`bin/`\n(CLI-display doc, external Rust consumer) để không bỏ sót theo đúng yêu cầu\nacceptance của `tsk-38t`. Cột \"Đổi?\" nói rõ consumer này có cần đổi sang đọc\n`statusCategory` (hoặc bảng transition riêng của domain) hay giữ nguyên literal\nmãi mãi theo đúng ranh giới đầu/đuôi vừa chốt ở trên."
    }
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-75",
    "githubAnchor": "unheaded-block-75",
    "stableAnchor": "unheaded-block-75",
    "title": "Unheaded block 75",
    "startLine": 647,
    "endLine": 656,
    "textDigest": "c2f2baeae1bc366d51a16dbf1b083a2add5cacd51c1bf7c3ea6d3f91c5190d11",
    "sample": "Quét bằng `rg -n \"STATUSES|TRANSITIONS\" src/ bin/ --glob '*.mjs'` và\n`rg -n \"'todo'|'doing'|'blocked'|'awaiting-approval'|'awaiting-human'|\n'delivered'|'retrospective'|'cleanup'|'w",
    "identityFingerprint": "bbe91d6eb7a56a04458eee39385b2b0817aa46386c1f757b2f1de94328ca2df6",
    "ancestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Consumer Audit"
    ],
    "text": "Quét bằng `rg -n \"STATUSES|TRANSITIONS\" src/ bin/ --glob '*.mjs'` và\n`rg -n \"'todo'|'doing'|'blocked'|'awaiting-approval'|'awaiting-human'|\n'delivered'|'retrospective'|'cleanup'|'wontfix'\"` trên `frontier.mjs`,\n`retro-pool.mjs`, `status-fsm.mjs`, `runner/*.mjs`, `bin/fgos.mjs` — cộng thêm\nquét mở rộng ra mọi consumer thật của tập `RESOLVED_STATUSES` (đã là 1 tập\n\"giống category\" viết tay, DISCUSSION.md §3 #3) và ra khỏi thư mục `src/`/`bin/`\n(CLI-display doc, external Rust consumer) để không bỏ sót theo đúng yêu cầu\nacceptance của `tsk-38t`. Cột \"Đổi?\" nói rõ consumer này có cần đổi sang đọc\n`statusCategory` (hoặc bảng transition riêng của domain) hay giữ nguyên literal\nmãi mãi theo đúng ranh giới đầu/đuôi vừa chốt ở trên."
  },
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Weak-exact",
    "reason": "ancestor headings differ; document exact share below one half",
    "targetUnit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-75",
      "githubAnchor": "unheaded-block-75",
      "stableAnchor": "unheaded-block-75",
      "title": "Unheaded block 75",
      "startLine": 647,
      "endLine": 656,
      "textDigest": "c2f2baeae1bc366d51a16dbf1b083a2add5cacd51c1bf7c3ea6d3f91c5190d11",
      "sample": "Quét bằng `rg -n \"STATUSES|TRANSITIONS\" src/ bin/ --glob '*.mjs'` và\n`rg -n \"'todo'|'doing'|'blocked'|'awaiting-approval'|'awaiting-human'|\n'delivered'|'retrospective'|'cleanup'|'w",
      "identityFingerprint": "bbe91d6eb7a56a04458eee39385b2b0817aa46386c1f757b2f1de94328ca2df6",
      "ancestry": [
        "Retired Decision History: Work State",
        "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
        "0027 Consumer Audit"
      ],
      "text": "Quét bằng `rg -n \"STATUSES|TRANSITIONS\" src/ bin/ --glob '*.mjs'` và\n`rg -n \"'todo'|'doing'|'blocked'|'awaiting-approval'|'awaiting-human'|\n'delivered'|'retrospective'|'cleanup'|'wontfix'\"` trên `frontier.mjs`,\n`retro-pool.mjs`, `status-fsm.mjs`, `runner/*.mjs`, `bin/fgos.mjs` — cộng thêm\nquét mở rộng ra mọi consumer thật của tập `RESOLVED_STATUSES` (đã là 1 tập\n\"giống category\" viết tay, DISCUSSION.md §3 #3) và ra khỏi thư mục `src/`/`bin/`\n(CLI-display doc, external Rust consumer) để không bỏ sót theo đúng yêu cầu\nacceptance của `tsk-38t`. Cột \"Đổi?\" nói rõ consumer này có cần đổi sang đọc\n`statusCategory` (hoặc bảng transition riêng của domain) hay giữ nguyên literal\nmãi mãi theo đúng ranh giới đầu/đuôi vừa chốt ở trên."
    }
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_0cabbd5a6b95edeb9aab6832ad276c50"
}
```

## Entry claim_7889671f1f2783b634ef6d90a251f3e9

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_7889671f1f2783b634ef6d90a251f3e9",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "b-decisions-second",
  "before": {
    "claimId": "claim_7889671f1f2783b634ef6d90a251f3e9",
    "sourceUnitDigest": "cfb28f2fabec3889",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "0027-audit-1-status-source-of-truth",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Source H5 \"1. Nguồn sự thật\" is carried as H4 \"0027 Audit 1 Status Source Of Truth\"; title and level changed.",
    "reviewedBy": "independent reviewer (review-b-decisions-second)",
    "reviewedAt": "2026-10-07",
    "targetUnitDigest": "50248a7774c2a4f3faf5bf48e4204713"
  },
  "currentDecision": {
    "claimId": "claim_7889671f1f2783b634ef6d90a251f3e9",
    "sourceUnitDigest": "cfb28f2fabec3889",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "0027-audit-1-status-source-of-truth",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "Source H5 \"1. Nguồn sự thật\" is carried as H4 \"0027 Audit 1 Status Source Of Truth\"; title and level changed. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
    "targetUnitDigest": "50248a7774c2a4f3faf5bf48e42047130dd788a8ab92dc278a4c66bf17a2654a",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Consumer Audit"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/specs/work-state.md",
    "unitDigest": "84087c16d1fca9a5b62bc70229516e323cf97826022669d9598cd4e39744e9d6",
    "identityFingerprint": "a8cc7cbb87ca35746bbcfb81b9b43a470a0cc3108203da712b37fadbe890553f",
    "claimId": "claim_7889671f1f2783b634ef6d90a251f3e9",
    "sourceAnchor": "1-nguồn-sự-thật-định-nghĩa-statusestransitions",
    "unitKind": "heading",
    "sourceUnitDigest": "cfb28f2fabec3889394f7a2c06ee84aab57810dada3902eddbaabc23c4c3fca5",
    "claimKind": "specification",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "heading",
      "level": 5,
      "title": "1. Nguồn sự thật (định nghĩa STATUSES/TRANSITIONS)",
      "anchor": "1-nguồn-sự-thật-định-nghĩa-statusestransitions",
      "githubAnchor": "1-nguồn-sự-thật-định-nghĩa-statusestransitions",
      "stableAnchor": "h-575cac9c5d3b",
      "startLine": 2001,
      "endLine": 2001,
      "textDigest": "cfb28f2fabec3889394f7a2c06ee84aab57810dada3902eddbaabc23c4c3fca5",
      "sample": "1. Nguồn sự thật (định nghĩa STATUSES/TRANSITIONS)",
      "sectionPayloadDigest": "bdee4fb8f864c64bb1ccdda044960818cc6bfae1e87d8ac8da077bbb8fb4a757",
      "followingBlockDigest": "bdee4fb8f864c64bb1ccdda044960818cc6bfae1e87d8ac8da077bbb8fb4a757",
      "identityFingerprint": "a8cc7cbb87ca35746bbcfb81b9b43a470a0cc3108203da712b37fadbe890553f",
      "ancestry": [
        "0002 — Mô hình việc phẳng",
        "0027 — Domain sở hữu vocabulary/transition status đoạn TRƯỚC `delivered` (supersede base-workflow-model)",
        "Audit: mọi consumer thật của `status-fsm.mjs`/`STATUSES`/`TRANSITIONS`/literal status hôm nay"
      ],
      "text": "##### 1. Nguồn sự thật (định nghĩa STATUSES/TRANSITIONS)",
      "sectionText": "##### 1. Nguồn sự thật (định nghĩa STATUSES/TRANSITIONS)\n\n| File:line | Vai trò | Đổi? |\n|---|---|---|\n| `src/state/work.mjs:83-94` | `STATUSES` — 10 giá trị hợp lệ, nguồn duy nhất (`status-fsm.mjs` re-export, không định nghĩa lại) | Có — trở thành union của \"10 giá trị coding\" thay vì hằng số toàn cục duy nhất; domain khác khai `statusLabels` riêng trong `DOMAINS[domain]` (mở rộng `workflow-stage-graphs.mjs`, chưa tồn tại — `tsk-38t-2`) |\n| `src/state/work.mjs:205-207` | `validateWork` — chặn `work.status` ngoài `STATUSES` (phạm trù `validation`) | Có — phải đọc bảng transition/label của `work.domain`, không phải hằng số toàn cục |\n| `src/state/status-fsm.mjs:99-152` (`TRANSITIONS`, 24 cạnh) | Bảng chuyển-status PHẲNG duy nhất, validate mọi `transitionWork` | Có, nhưng CHỈ phần đoạn đầu (19/24 cạnh chạm 6 status đoạn đầu) — 5 cạnh đoạn đuôi (`delivered→retrospective`, `retrospective→cleanup`, `cleanup→done`, `cleanup→blocked`, `blocked→delivered`) giữ nguyên, dùng chung mọi domain |\n| `src/state/status-fsm.mjs:193-256` (`transitionWork`) | Hàm validate + sinh event, đọc `TRANSITIONS` trực tiếp | Có — cần tham số hoá theo `work.domain` cho phần đoạn đầu |"
    }
  },
  "currentTarget": {
    "unitKind": "heading",
    "level": 4,
    "title": "0027 Audit 1 Status Source Of Truth",
    "anchor": "0027-audit-1-status-source-of-truth",
    "githubAnchor": "0027-audit-1-status-source-of-truth",
    "stableAnchor": "h-d2cec64e0a11",
    "startLine": 658,
    "endLine": 658,
    "textDigest": "50248a7774c2a4f3faf5bf48e42047130dd788a8ab92dc278a4c66bf17a2654a",
    "sample": "0027 Audit 1 Status Source Of Truth",
    "sectionPayloadDigest": "bdee4fb8f864c64bb1ccdda044960818cc6bfae1e87d8ac8da077bbb8fb4a757",
    "followingBlockDigest": "bdee4fb8f864c64bb1ccdda044960818cc6bfae1e87d8ac8da077bbb8fb4a757",
    "identityFingerprint": "e5eb1e3bdd4948900e5a4655ac341f182fb707e17520e7e4e61469d9183319a5",
    "ancestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Consumer Audit"
    ],
    "text": "#### 0027 Audit 1 Status Source Of Truth",
    "sectionText": "#### 0027 Audit 1 Status Source Of Truth\n\n| File:line | Vai trò | Đổi? |\n|---|---|---|\n| `src/state/work.mjs:83-94` | `STATUSES` — 10 giá trị hợp lệ, nguồn duy nhất (`status-fsm.mjs` re-export, không định nghĩa lại) | Có — trở thành union của \"10 giá trị coding\" thay vì hằng số toàn cục duy nhất; domain khác khai `statusLabels` riêng trong `DOMAINS[domain]` (mở rộng `workflow-stage-graphs.mjs`, chưa tồn tại — `tsk-38t-2`) |\n| `src/state/work.mjs:205-207` | `validateWork` — chặn `work.status` ngoài `STATUSES` (phạm trù `validation`) | Có — phải đọc bảng transition/label của `work.domain`, không phải hằng số toàn cục |\n| `src/state/status-fsm.mjs:99-152` (`TRANSITIONS`, 24 cạnh) | Bảng chuyển-status PHẲNG duy nhất, validate mọi `transitionWork` | Có, nhưng CHỈ phần đoạn đầu (19/24 cạnh chạm 6 status đoạn đầu) — 5 cạnh đoạn đuôi (`delivered→retrospective`, `retrospective→cleanup`, `cleanup→done`, `cleanup→blocked`, `blocked→delivered`) giữ nguyên, dùng chung mọi domain |\n| `src/state/status-fsm.mjs:193-256` (`transitionWork`) | Hàm validate + sinh event, đọc `TRANSITIONS` trực tiếp | Có — cần tham số hoá theo `work.domain` cho phần đoạn đầu |"
  },
  "sourceTargetDigestsUnequal": true,
  "classObservation": {
    "class": "Judgment",
    "reason": "no target digest match",
    "targetUnit": null
  },
  "mechanicalRequired": true,
  "deepRequired": true,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_7889671f1f2783b634ef6d90a251f3e9"
}
```

## Entry claim_fc0f124b5b1368034455207d6378bc00

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_fc0f124b5b1368034455207d6378bc00",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "b-decisions-second",
  "before": {
    "claimId": "claim_fc0f124b5b1368034455207d6378bc00",
    "sourceUnitDigest": "bdee4fb8f864c64b",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-76",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Audit 1 table (status source-of-truth file:line, role, changed?) carried verbatim into block 76 under Audit 1; the shared first-line suggestion was checked against the Audit 1 position.",
    "reviewedBy": "independent reviewer (review-b-decisions-second)",
    "reviewedAt": "2026-10-07",
    "targetUnitDigest": "bdee4fb8f864c64bb1ccdda044960818"
  },
  "currentDecision": {
    "claimId": "claim_fc0f124b5b1368034455207d6378bc00",
    "sourceUnitDigest": "bdee4fb8f864c64b",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-76",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "Audit 1 table (status source-of-truth file:line, role, changed?) carried verbatim into block 76 under Audit 1; the shared first-line suggestion was checked against the Audit 1 position. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
    "targetUnitDigest": "bdee4fb8f864c64bb1ccdda044960818cc6bfae1e87d8ac8da077bbb8fb4a757",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Consumer Audit",
      "0027 Audit 1 Status Source Of Truth"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/specs/work-state.md",
    "unitDigest": "59c1fcde75206bdaef837ab71fad21ff6bc41b864e33f813da8bef0de71dd66c",
    "identityFingerprint": "59c1fcde75206bdaef837ab71fad21ff6bc41b864e33f813da8bef0de71dd66c",
    "claimId": "claim_fc0f124b5b1368034455207d6378bc00",
    "sourceAnchor": "unheaded-block-186",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "bdee4fb8f864c64bb1ccdda044960818cc6bfae1e87d8ac8da077bbb8fb4a757",
    "claimKind": "specification",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-186",
      "githubAnchor": "unheaded-block-186",
      "stableAnchor": "unheaded-block-186",
      "title": "Unheaded block 186",
      "startLine": 2003,
      "endLine": 2008,
      "textDigest": "bdee4fb8f864c64bb1ccdda044960818cc6bfae1e87d8ac8da077bbb8fb4a757",
      "sample": "| File:line | Vai trò | Đổi? |\n|---|---|---|\n| `src/state/work.mjs:83-94` | `STATUSES` — 10 giá trị hợp lệ, nguồn duy nhất (`status-fsm.mjs` re-export, không định nghĩa lại) | Có —",
      "identityFingerprint": "59c1fcde75206bdaef837ab71fad21ff6bc41b864e33f813da8bef0de71dd66c",
      "ancestry": [
        "0002 — Mô hình việc phẳng",
        "0027 — Domain sở hữu vocabulary/transition status đoạn TRƯỚC `delivered` (supersede base-workflow-model)",
        "Audit: mọi consumer thật của `status-fsm.mjs`/`STATUSES`/`TRANSITIONS`/literal status hôm nay",
        "1. Nguồn sự thật (định nghĩa STATUSES/TRANSITIONS)"
      ],
      "text": "| File:line | Vai trò | Đổi? |\n|---|---|---|\n| `src/state/work.mjs:83-94` | `STATUSES` — 10 giá trị hợp lệ, nguồn duy nhất (`status-fsm.mjs` re-export, không định nghĩa lại) | Có — trở thành union của \"10 giá trị coding\" thay vì hằng số toàn cục duy nhất; domain khác khai `statusLabels` riêng trong `DOMAINS[domain]` (mở rộng `workflow-stage-graphs.mjs`, chưa tồn tại — `tsk-38t-2`) |\n| `src/state/work.mjs:205-207` | `validateWork` — chặn `work.status` ngoài `STATUSES` (phạm trù `validation`) | Có — phải đọc bảng transition/label của `work.domain`, không phải hằng số toàn cục |\n| `src/state/status-fsm.mjs:99-152` (`TRANSITIONS`, 24 cạnh) | Bảng chuyển-status PHẲNG duy nhất, validate mọi `transitionWork` | Có, nhưng CHỈ phần đoạn đầu (19/24 cạnh chạm 6 status đoạn đầu) — 5 cạnh đoạn đuôi (`delivered→retrospective`, `retrospective→cleanup`, `cleanup→done`, `cleanup→blocked`, `blocked→delivered`) giữ nguyên, dùng chung mọi domain |\n| `src/state/status-fsm.mjs:193-256` (`transitionWork`) | Hàm validate + sinh event, đọc `TRANSITIONS` trực tiếp | Có — cần tham số hoá theo `work.domain` cho phần đoạn đầu |"
    }
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-76",
    "githubAnchor": "unheaded-block-76",
    "stableAnchor": "unheaded-block-76",
    "title": "Unheaded block 76",
    "startLine": 660,
    "endLine": 665,
    "textDigest": "bdee4fb8f864c64bb1ccdda044960818cc6bfae1e87d8ac8da077bbb8fb4a757",
    "sample": "| File:line | Vai trò | Đổi? |\n|---|---|---|\n| `src/state/work.mjs:83-94` | `STATUSES` — 10 giá trị hợp lệ, nguồn duy nhất (`status-fsm.mjs` re-export, không định nghĩa lại) | Có —",
    "identityFingerprint": "59c1fcde75206bdaef837ab71fad21ff6bc41b864e33f813da8bef0de71dd66c",
    "ancestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Consumer Audit",
      "0027 Audit 1 Status Source Of Truth"
    ],
    "text": "| File:line | Vai trò | Đổi? |\n|---|---|---|\n| `src/state/work.mjs:83-94` | `STATUSES` — 10 giá trị hợp lệ, nguồn duy nhất (`status-fsm.mjs` re-export, không định nghĩa lại) | Có — trở thành union của \"10 giá trị coding\" thay vì hằng số toàn cục duy nhất; domain khác khai `statusLabels` riêng trong `DOMAINS[domain]` (mở rộng `workflow-stage-graphs.mjs`, chưa tồn tại — `tsk-38t-2`) |\n| `src/state/work.mjs:205-207` | `validateWork` — chặn `work.status` ngoài `STATUSES` (phạm trù `validation`) | Có — phải đọc bảng transition/label của `work.domain`, không phải hằng số toàn cục |\n| `src/state/status-fsm.mjs:99-152` (`TRANSITIONS`, 24 cạnh) | Bảng chuyển-status PHẲNG duy nhất, validate mọi `transitionWork` | Có, nhưng CHỈ phần đoạn đầu (19/24 cạnh chạm 6 status đoạn đầu) — 5 cạnh đoạn đuôi (`delivered→retrospective`, `retrospective→cleanup`, `cleanup→done`, `cleanup→blocked`, `blocked→delivered`) giữ nguyên, dùng chung mọi domain |\n| `src/state/status-fsm.mjs:193-256` (`transitionWork`) | Hàm validate + sinh event, đọc `TRANSITIONS` trực tiếp | Có — cần tham số hoá theo `work.domain` cho phần đoạn đầu |"
  },
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Weak-exact",
    "reason": "ancestor headings differ; document exact share below one half",
    "targetUnit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-76",
      "githubAnchor": "unheaded-block-76",
      "stableAnchor": "unheaded-block-76",
      "title": "Unheaded block 76",
      "startLine": 660,
      "endLine": 665,
      "textDigest": "bdee4fb8f864c64bb1ccdda044960818cc6bfae1e87d8ac8da077bbb8fb4a757",
      "sample": "| File:line | Vai trò | Đổi? |\n|---|---|---|\n| `src/state/work.mjs:83-94` | `STATUSES` — 10 giá trị hợp lệ, nguồn duy nhất (`status-fsm.mjs` re-export, không định nghĩa lại) | Có —",
      "identityFingerprint": "59c1fcde75206bdaef837ab71fad21ff6bc41b864e33f813da8bef0de71dd66c",
      "ancestry": [
        "Retired Decision History: Work State",
        "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
        "0027 Consumer Audit",
        "0027 Audit 1 Status Source Of Truth"
      ],
      "text": "| File:line | Vai trò | Đổi? |\n|---|---|---|\n| `src/state/work.mjs:83-94` | `STATUSES` — 10 giá trị hợp lệ, nguồn duy nhất (`status-fsm.mjs` re-export, không định nghĩa lại) | Có — trở thành union của \"10 giá trị coding\" thay vì hằng số toàn cục duy nhất; domain khác khai `statusLabels` riêng trong `DOMAINS[domain]` (mở rộng `workflow-stage-graphs.mjs`, chưa tồn tại — `tsk-38t-2`) |\n| `src/state/work.mjs:205-207` | `validateWork` — chặn `work.status` ngoài `STATUSES` (phạm trù `validation`) | Có — phải đọc bảng transition/label của `work.domain`, không phải hằng số toàn cục |\n| `src/state/status-fsm.mjs:99-152` (`TRANSITIONS`, 24 cạnh) | Bảng chuyển-status PHẲNG duy nhất, validate mọi `transitionWork` | Có, nhưng CHỈ phần đoạn đầu (19/24 cạnh chạm 6 status đoạn đầu) — 5 cạnh đoạn đuôi (`delivered→retrospective`, `retrospective→cleanup`, `cleanup→done`, `cleanup→blocked`, `blocked→delivered`) giữ nguyên, dùng chung mọi domain |\n| `src/state/status-fsm.mjs:193-256` (`transitionWork`) | Hàm validate + sinh event, đọc `TRANSITIONS` trực tiếp | Có — cần tham số hoá theo `work.domain` cho phần đoạn đầu |"
    }
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_fc0f124b5b1368034455207d6378bc00"
}
```

## Entry claim_c0adce3f717a031d4159eee6dd0aaaa1

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_c0adce3f717a031d4159eee6dd0aaaa1",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "b-decisions-second",
  "before": {
    "claimId": "claim_c0adce3f717a031d4159eee6dd0aaaa1",
    "sourceUnitDigest": "517a80cc0c3f64d3",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "0027-audit-2-resolved-statuses-set",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Source H5 \"2. RESOLVED_STATUSES\" is carried as H4 \"0027 Audit 2 Resolved Statuses Set\"; title and level changed.",
    "reviewedBy": "independent reviewer (review-b-decisions-second)",
    "reviewedAt": "2026-10-07",
    "targetUnitDigest": "a4b78ba726bd39959cca89e81fa9d1bd"
  },
  "currentDecision": {
    "claimId": "claim_c0adce3f717a031d4159eee6dd0aaaa1",
    "sourceUnitDigest": "517a80cc0c3f64d3",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "0027-audit-2-resolved-statuses-set",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "Source H5 \"2. RESOLVED_STATUSES\" is carried as H4 \"0027 Audit 2 Resolved Statuses Set\"; title and level changed. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
    "targetUnitDigest": "a4b78ba726bd39959cca89e81fa9d1bd269cf16807d014204b9427573cde9dea",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Consumer Audit"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/specs/work-state.md",
    "unitDigest": "de5bd4cd4e4be4a107f5cd1911335c08c77b37fb6682191229e6ebbefe958cdc",
    "identityFingerprint": "79347f49197602234a11531e4eb8f14e3d55f18665acd045e59042f6e459a5d7",
    "claimId": "claim_c0adce3f717a031d4159eee6dd0aaaa1",
    "sourceAnchor": "2-resolved_statuses-tập-giống-category-viết-tay-trộn-cả-2-nhóm",
    "unitKind": "heading",
    "sourceUnitDigest": "517a80cc0c3f64d3de66ea1c720d3d3d3d581f8e33c2160727bcb78d8cfea3ac",
    "claimKind": "specification",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "heading",
      "level": 5,
      "title": "2. `RESOLVED_STATUSES` (tập \"giống category\" viết tay, trộn cả 2 nhóm)",
      "anchor": "2-resolved_statuses-tập-giống-category-viết-tay-trộn-cả-2-nhóm",
      "githubAnchor": "2-resolved_statuses-tập-giống-category-viết-tay-trộn-cả-2-nhóm",
      "stableAnchor": "h-52041a6f0100",
      "startLine": 2010,
      "endLine": 2010,
      "textDigest": "517a80cc0c3f64d3de66ea1c720d3d3d3d581f8e33c2160727bcb78d8cfea3ac",
      "sample": "2. `RESOLVED_STATUSES` (tập \"giống category\" viết tay, trộn cả 2 nhóm)",
      "sectionPayloadDigest": "1ce6d8aeb480f4456b23212633667e753734a50753ae4ca6a4e8f6e0a1351bab",
      "followingBlockDigest": "827c7ac395f16aea73f4b6cb168d3876cf6a02ba54e137c27768654b4b04a7e4",
      "identityFingerprint": "79347f49197602234a11531e4eb8f14e3d55f18665acd045e59042f6e459a5d7",
      "ancestry": [
        "0002 — Mô hình việc phẳng",
        "0027 — Domain sở hữu vocabulary/transition status đoạn TRƯỚC `delivered` (supersede base-workflow-model)",
        "Audit: mọi consumer thật của `status-fsm.mjs`/`STATUSES`/`TRANSITIONS`/literal status hôm nay"
      ],
      "text": "##### 2. `RESOLVED_STATUSES` (tập \"giống category\" viết tay, trộn cả 2 nhóm)",
      "sectionText": "##### 2. `RESOLVED_STATUSES` (tập \"giống category\" viết tay, trộn cả 2 nhóm)\n\n`src/state/frontier.mjs:186` khai `RESOLVED_STATUSES = new Set(['delivered',\n'retrospective', 'cleanup', 'done', 'wontfix'])` — trộn 4 status ĐUÔI (cố\nđịnh) với `wontfix` (ĐẦU, domain-owned label nhưng luôn map `canceled`).\nĐây chính là hệ quả DISCUSSION.md §6 \"Hệ quả 1\" đã lường trước: khi hiện thực\nhoá, chỗ này phải đọc HỖN HỢP — literal cho 4 tên đuôi + `statusCategory ===\n'canceled'` cho phần thay `wontfix` (để bắt được cả label khác domain map vào\ncùng category) — không còn là 1 Set string thuần.\n\n| File:line | Vai trò | Đổi? |\n|---|---|---|\n| `src/state/frontier.mjs:107,128,186,202` | Định nghĩa + dùng cho `ready`-filter dep-resolve và `hasOpenDescendant` | Có — hỗn hợp literal-đuôi + category-canceled, như trên |\n| `src/state/frontier.mjs:92` | `item.status !== 'todo'` — cạnh CÒN LẠI của `ready`-filter, literal `todo` (đoạn đầu) | Có — phải đọc `statusCategory === 'todo'` để domain khác dùng nhãn khác cho \"chưa bắt đầu\" vẫn được nhặt |\n| `src/state/graph-metrics.mjs:15,298,358,378,401,406` | Import `RESOLVED_STATUSES`, đếm dep-blocked/not-done cho `graph`/`triage`/`stale` verb | Kế thừa tự động từ thay đổi ở frontier.mjs (chỉ gọi `.has`, không tự literal-compare) — cần đổi CHỮ KÝ gọi nếu `RESOLVED_STATUSES` đổi từ Set sang hàm `isResolved(item)` |\n| `src/state/graph-harness.mjs:22,103,106,108,143,154` | Import `RESOLVED_STATUSES`, gate `deps`/`mergeAfter` sẵn sàng cho `evolve`/dispatch | Như trên — kế thừa, đổi chữ ký gọi |\n| `src/state/drift-status.mjs:16,93` | `needsSync` — root chưa resolved mà ahead-of-target | Như trên |\n| `src/state/impact.mjs:24,90,146` | `openIds`/dep resolved-filter cho impact-analysis nội bộ fgOS | Như trên |\n| `src/runner/claim-port.mjs:11,159` | `unmergedDeps` — chặn claim khi dep chưa resolved | Như trên |\n| `src/report/entropy.mjs:15,17,41,96` | Import `RESOLVED_STATUSES` + `FINAL_STATUSES` cục bộ riêng (`awaiting-approval`,`blocked`,`done`) cho báo cáo entropy/stale-clarify | Có — `FINAL_STATUSES` cục bộ này TỰ Ý trộn 1 status đầu (`awaiting-approval`,`blocked`) với 1 status đuôi (`done`), là một bản sao lệch nghĩa của `RESOLVED_STATUSES` cần rà lại cùng lúc |\n| `bin/fgos.mjs:33,544,1373` | Import `RESOLVED_STATUSES` + `FINAL_STATUSES` cục bộ (`awaiting-approval`,`blocked`,`delivered`,`retrospective`,`cleanup`,`done`) cho outcome-backfill check và ready-view filter | Có — cùng lý do, cần đối chiếu lại theo ranh giới đầu/đuôi mới |"
    }
  },
  "currentTarget": {
    "unitKind": "heading",
    "level": 4,
    "title": "0027 Audit 2 Resolved Statuses Set",
    "anchor": "0027-audit-2-resolved-statuses-set",
    "githubAnchor": "0027-audit-2-resolved-statuses-set",
    "stableAnchor": "h-9cd0549c68f6",
    "startLine": 667,
    "endLine": 667,
    "textDigest": "a4b78ba726bd39959cca89e81fa9d1bd269cf16807d014204b9427573cde9dea",
    "sample": "0027 Audit 2 Resolved Statuses Set",
    "sectionPayloadDigest": "1ce6d8aeb480f4456b23212633667e753734a50753ae4ca6a4e8f6e0a1351bab",
    "followingBlockDigest": "827c7ac395f16aea73f4b6cb168d3876cf6a02ba54e137c27768654b4b04a7e4",
    "identityFingerprint": "2e21df03514690d5df56883cf56f803549ca5c9072236f787a45ea04741b07f1",
    "ancestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Consumer Audit"
    ],
    "text": "#### 0027 Audit 2 Resolved Statuses Set",
    "sectionText": "#### 0027 Audit 2 Resolved Statuses Set\n\n`src/state/frontier.mjs:186` khai `RESOLVED_STATUSES = new Set(['delivered',\n'retrospective', 'cleanup', 'done', 'wontfix'])` — trộn 4 status ĐUÔI (cố\nđịnh) với `wontfix` (ĐẦU, domain-owned label nhưng luôn map `canceled`).\nĐây chính là hệ quả DISCUSSION.md §6 \"Hệ quả 1\" đã lường trước: khi hiện thực\nhoá, chỗ này phải đọc HỖN HỢP — literal cho 4 tên đuôi + `statusCategory ===\n'canceled'` cho phần thay `wontfix` (để bắt được cả label khác domain map vào\ncùng category) — không còn là 1 Set string thuần.\n\n| File:line | Vai trò | Đổi? |\n|---|---|---|\n| `src/state/frontier.mjs:107,128,186,202` | Định nghĩa + dùng cho `ready`-filter dep-resolve và `hasOpenDescendant` | Có — hỗn hợp literal-đuôi + category-canceled, như trên |\n| `src/state/frontier.mjs:92` | `item.status !== 'todo'` — cạnh CÒN LẠI của `ready`-filter, literal `todo` (đoạn đầu) | Có — phải đọc `statusCategory === 'todo'` để domain khác dùng nhãn khác cho \"chưa bắt đầu\" vẫn được nhặt |\n| `src/state/graph-metrics.mjs:15,298,358,378,401,406` | Import `RESOLVED_STATUSES`, đếm dep-blocked/not-done cho `graph`/`triage`/`stale` verb | Kế thừa tự động từ thay đổi ở frontier.mjs (chỉ gọi `.has`, không tự literal-compare) — cần đổi CHỮ KÝ gọi nếu `RESOLVED_STATUSES` đổi từ Set sang hàm `isResolved(item)` |\n| `src/state/graph-harness.mjs:22,103,106,108,143,154` | Import `RESOLVED_STATUSES`, gate `deps`/`mergeAfter` sẵn sàng cho `evolve`/dispatch | Như trên — kế thừa, đổi chữ ký gọi |\n| `src/state/drift-status.mjs:16,93` | `needsSync` — root chưa resolved mà ahead-of-target | Như trên |\n| `src/state/impact.mjs:24,90,146` | `openIds`/dep resolved-filter cho impact-analysis nội bộ fgOS | Như trên |\n| `src/runner/claim-port.mjs:11,159` | `unmergedDeps` — chặn claim khi dep chưa resolved | Như trên |\n| `src/report/entropy.mjs:15,17,41,96` | Import `RESOLVED_STATUSES` + `FINAL_STATUSES` cục bộ riêng (`awaiting-approval`,`blocked`,`done`) cho báo cáo entropy/stale-clarify | Có — `FINAL_STATUSES` cục bộ này TỰ Ý trộn 1 status đầu (`awaiting-approval`,`blocked`) với 1 status đuôi (`done`), là một bản sao lệch nghĩa của `RESOLVED_STATUSES` cần rà lại cùng lúc |\n| `bin/fgos.mjs:33,544,1373` | Import `RESOLVED_STATUSES` + `FINAL_STATUSES` cục bộ (`awaiting-approval`,`blocked`,`delivered`,`retrospective`,`cleanup`,`done`) cho outcome-backfill check và ready-view filter | Có — cùng lý do, cần đối chiếu lại theo ranh giới đầu/đuôi mới |"
  },
  "sourceTargetDigestsUnequal": true,
  "classObservation": {
    "class": "Judgment",
    "reason": "no target digest match",
    "targetUnit": null
  },
  "mechanicalRequired": true,
  "deepRequired": true,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_c0adce3f717a031d4159eee6dd0aaaa1"
}
```

## Entry claim_d97ba7f5ff310af83839fea58329acdd

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_d97ba7f5ff310af83839fea58329acdd",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "b-decisions-second",
  "before": {
    "claimId": "claim_d97ba7f5ff310af83839fea58329acdd",
    "sourceUnitDigest": "827c7ac395f16aea",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-77",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Audit 2 paragraph on RESOLVED_STATUSES in frontier.mjs; carried verbatim.",
    "reviewedBy": "independent reviewer (review-b-decisions-second)",
    "reviewedAt": "2026-10-07",
    "targetUnitDigest": "827c7ac395f16aea73f4b6cb168d3876"
  },
  "currentDecision": {
    "claimId": "claim_d97ba7f5ff310af83839fea58329acdd",
    "sourceUnitDigest": "827c7ac395f16aea",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-77",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "Audit 2 paragraph on RESOLVED_STATUSES in frontier.mjs; carried verbatim. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
    "targetUnitDigest": "827c7ac395f16aea73f4b6cb168d3876cf6a02ba54e137c27768654b4b04a7e4",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Consumer Audit",
      "0027 Audit 2 Resolved Statuses Set"
    ],
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried."
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/specs/work-state.md",
    "unitDigest": "84aecbeebc83aabcc8387946bf1fb6965500b68bbc426266f2ae3d644b1617db",
    "identityFingerprint": "84aecbeebc83aabcc8387946bf1fb6965500b68bbc426266f2ae3d644b1617db",
    "claimId": "claim_d97ba7f5ff310af83839fea58329acdd",
    "sourceAnchor": "unheaded-block-187",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "827c7ac395f16aea73f4b6cb168d3876cf6a02ba54e137c27768654b4b04a7e4",
    "claimKind": "specification",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-187",
      "githubAnchor": "unheaded-block-187",
      "stableAnchor": "unheaded-block-187",
      "title": "Unheaded block 187",
      "startLine": 2012,
      "endLine": 2018,
      "textDigest": "827c7ac395f16aea73f4b6cb168d3876cf6a02ba54e137c27768654b4b04a7e4",
      "sample": "`src/state/frontier.mjs:186` khai `RESOLVED_STATUSES = new Set(['delivered',\n'retrospective', 'cleanup', 'done', 'wontfix'])` — trộn 4 status ĐUÔI (cố\nđịnh) với `wontfix` (ĐẦU, dom",
      "identityFingerprint": "84aecbeebc83aabcc8387946bf1fb6965500b68bbc426266f2ae3d644b1617db",
      "ancestry": [
        "0002 — Mô hình việc phẳng",
        "0027 — Domain sở hữu vocabulary/transition status đoạn TRƯỚC `delivered` (supersede base-workflow-model)",
        "Audit: mọi consumer thật của `status-fsm.mjs`/`STATUSES`/`TRANSITIONS`/literal status hôm nay",
        "2. `RESOLVED_STATUSES` (tập \"giống category\" viết tay, trộn cả 2 nhóm)"
      ],
      "text": "`src/state/frontier.mjs:186` khai `RESOLVED_STATUSES = new Set(['delivered',\n'retrospective', 'cleanup', 'done', 'wontfix'])` — trộn 4 status ĐUÔI (cố\nđịnh) với `wontfix` (ĐẦU, domain-owned label nhưng luôn map `canceled`).\nĐây chính là hệ quả DISCUSSION.md §6 \"Hệ quả 1\" đã lường trước: khi hiện thực\nhoá, chỗ này phải đọc HỖN HỢP — literal cho 4 tên đuôi + `statusCategory ===\n'canceled'` cho phần thay `wontfix` (để bắt được cả label khác domain map vào\ncùng category) — không còn là 1 Set string thuần."
    }
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-77",
    "githubAnchor": "unheaded-block-77",
    "stableAnchor": "unheaded-block-77",
    "title": "Unheaded block 77",
    "startLine": 669,
    "endLine": 675,
    "textDigest": "827c7ac395f16aea73f4b6cb168d3876cf6a02ba54e137c27768654b4b04a7e4",
    "sample": "`src/state/frontier.mjs:186` khai `RESOLVED_STATUSES = new Set(['delivered',\n'retrospective', 'cleanup', 'done', 'wontfix'])` — trộn 4 status ĐUÔI (cố\nđịnh) với `wontfix` (ĐẦU, dom",
    "identityFingerprint": "84aecbeebc83aabcc8387946bf1fb6965500b68bbc426266f2ae3d644b1617db",
    "ancestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Consumer Audit",
      "0027 Audit 2 Resolved Statuses Set"
    ],
    "text": "`src/state/frontier.mjs:186` khai `RESOLVED_STATUSES = new Set(['delivered',\n'retrospective', 'cleanup', 'done', 'wontfix'])` — trộn 4 status ĐUÔI (cố\nđịnh) với `wontfix` (ĐẦU, domain-owned label nhưng luôn map `canceled`).\nĐây chính là hệ quả DISCUSSION.md §6 \"Hệ quả 1\" đã lường trước: khi hiện thực\nhoá, chỗ này phải đọc HỖN HỢP — literal cho 4 tên đuôi + `statusCategory ===\n'canceled'` cho phần thay `wontfix` (để bắt được cả label khác domain map vào\ncùng category) — không còn là 1 Set string thuần."
  },
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Weak-exact",
    "reason": "ancestor headings differ; document exact share below one half",
    "targetUnit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-77",
      "githubAnchor": "unheaded-block-77",
      "stableAnchor": "unheaded-block-77",
      "title": "Unheaded block 77",
      "startLine": 669,
      "endLine": 675,
      "textDigest": "827c7ac395f16aea73f4b6cb168d3876cf6a02ba54e137c27768654b4b04a7e4",
      "sample": "`src/state/frontier.mjs:186` khai `RESOLVED_STATUSES = new Set(['delivered',\n'retrospective', 'cleanup', 'done', 'wontfix'])` — trộn 4 status ĐUÔI (cố\nđịnh) với `wontfix` (ĐẦU, dom",
      "identityFingerprint": "84aecbeebc83aabcc8387946bf1fb6965500b68bbc426266f2ae3d644b1617db",
      "ancestry": [
        "Retired Decision History: Work State",
        "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
        "0027 Consumer Audit",
        "0027 Audit 2 Resolved Statuses Set"
      ],
      "text": "`src/state/frontier.mjs:186` khai `RESOLVED_STATUSES = new Set(['delivered',\n'retrospective', 'cleanup', 'done', 'wontfix'])` — trộn 4 status ĐUÔI (cố\nđịnh) với `wontfix` (ĐẦU, domain-owned label nhưng luôn map `canceled`).\nĐây chính là hệ quả DISCUSSION.md §6 \"Hệ quả 1\" đã lường trước: khi hiện thực\nhoá, chỗ này phải đọc HỖN HỢP — literal cho 4 tên đuôi + `statusCategory ===\n'canceled'` cho phần thay `wontfix` (để bắt được cả label khác domain map vào\ncùng category) — không còn là 1 Set string thuần."
    }
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_d97ba7f5ff310af83839fea58329acdd"
}
```

## Entry claim_84950cfff9d75392b847739c4812768a

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_84950cfff9d75392b847739c4812768a",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "b-decisions-second",
  "before": {
    "claimId": "claim_84950cfff9d75392b847739c4812768a",
    "sourceUnitDigest": "4e6cda4b133d000a",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-78",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Audit 2 table of RESOLVED_STATUSES consumers; carried verbatim into block 78 (the located suggestion of block 76 was a first-line collision, the whole-text match is block 78).",
    "reviewedBy": "independent reviewer (review-b-decisions-second)",
    "reviewedAt": "2026-10-07",
    "targetUnitDigest": "4e6cda4b133d000a59389f9baa14d539"
  },
  "currentDecision": {
    "claimId": "claim_84950cfff9d75392b847739c4812768a",
    "sourceUnitDigest": "4e6cda4b133d000a",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-78",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "Audit 2 table of RESOLVED_STATUSES consumers; carried verbatim into block 78 (the located suggestion of block 76 was a first-line collision, the whole-text match is block 78). L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
    "targetUnitDigest": "4e6cda4b133d000a59389f9baa14d539c3dbc65fce54bbade31697dbdd6f33f6",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Consumer Audit",
      "0027 Audit 2 Resolved Statuses Set"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/specs/work-state.md",
    "unitDigest": "70972efde274b05a3207c09d8595b3c9965d81ec82876f8bfd5e0e573cf5dec0",
    "identityFingerprint": "70972efde274b05a3207c09d8595b3c9965d81ec82876f8bfd5e0e573cf5dec0",
    "claimId": "claim_84950cfff9d75392b847739c4812768a",
    "sourceAnchor": "unheaded-block-188",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "4e6cda4b133d000a59389f9baa14d539c3dbc65fce54bbade31697dbdd6f33f6",
    "claimKind": "specification",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-188",
      "githubAnchor": "unheaded-block-188",
      "stableAnchor": "unheaded-block-188",
      "title": "Unheaded block 188",
      "startLine": 2020,
      "endLine": 2030,
      "textDigest": "4e6cda4b133d000a59389f9baa14d539c3dbc65fce54bbade31697dbdd6f33f6",
      "sample": "| File:line | Vai trò | Đổi? |\n|---|---|---|\n| `src/state/frontier.mjs:107,128,186,202` | Định nghĩa + dùng cho `ready`-filter dep-resolve và `hasOpenDescendant` | Có — hỗn hợp lit",
      "identityFingerprint": "70972efde274b05a3207c09d8595b3c9965d81ec82876f8bfd5e0e573cf5dec0",
      "ancestry": [
        "0002 — Mô hình việc phẳng",
        "0027 — Domain sở hữu vocabulary/transition status đoạn TRƯỚC `delivered` (supersede base-workflow-model)",
        "Audit: mọi consumer thật của `status-fsm.mjs`/`STATUSES`/`TRANSITIONS`/literal status hôm nay",
        "2. `RESOLVED_STATUSES` (tập \"giống category\" viết tay, trộn cả 2 nhóm)"
      ],
      "text": "| File:line | Vai trò | Đổi? |\n|---|---|---|\n| `src/state/frontier.mjs:107,128,186,202` | Định nghĩa + dùng cho `ready`-filter dep-resolve và `hasOpenDescendant` | Có — hỗn hợp literal-đuôi + category-canceled, như trên |\n| `src/state/frontier.mjs:92` | `item.status !== 'todo'` — cạnh CÒN LẠI của `ready`-filter, literal `todo` (đoạn đầu) | Có — phải đọc `statusCategory === 'todo'` để domain khác dùng nhãn khác cho \"chưa bắt đầu\" vẫn được nhặt |\n| `src/state/graph-metrics.mjs:15,298,358,378,401,406` | Import `RESOLVED_STATUSES`, đếm dep-blocked/not-done cho `graph`/`triage`/`stale` verb | Kế thừa tự động từ thay đổi ở frontier.mjs (chỉ gọi `.has`, không tự literal-compare) — cần đổi CHỮ KÝ gọi nếu `RESOLVED_STATUSES` đổi từ Set sang hàm `isResolved(item)` |\n| `src/state/graph-harness.mjs:22,103,106,108,143,154` | Import `RESOLVED_STATUSES`, gate `deps`/`mergeAfter` sẵn sàng cho `evolve`/dispatch | Như trên — kế thừa, đổi chữ ký gọi |\n| `src/state/drift-status.mjs:16,93` | `needsSync` — root chưa resolved mà ahead-of-target | Như trên |\n| `src/state/impact.mjs:24,90,146` | `openIds`/dep resolved-filter cho impact-analysis nội bộ fgOS | Như trên |\n| `src/runner/claim-port.mjs:11,159` | `unmergedDeps` — chặn claim khi dep chưa resolved | Như trên |\n| `src/report/entropy.mjs:15,17,41,96` | Import `RESOLVED_STATUSES` + `FINAL_STATUSES` cục bộ riêng (`awaiting-approval`,`blocked`,`done`) cho báo cáo entropy/stale-clarify | Có — `FINAL_STATUSES` cục bộ này TỰ Ý trộn 1 status đầu (`awaiting-approval`,`blocked`) với 1 status đuôi (`done`), là một bản sao lệch nghĩa của `RESOLVED_STATUSES` cần rà lại cùng lúc |\n| `bin/fgos.mjs:33,544,1373` | Import `RESOLVED_STATUSES` + `FINAL_STATUSES` cục bộ (`awaiting-approval`,`blocked`,`delivered`,`retrospective`,`cleanup`,`done`) cho outcome-backfill check và ready-view filter | Có — cùng lý do, cần đối chiếu lại theo ranh giới đầu/đuôi mới |"
    }
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-78",
    "githubAnchor": "unheaded-block-78",
    "stableAnchor": "unheaded-block-78",
    "title": "Unheaded block 78",
    "startLine": 677,
    "endLine": 687,
    "textDigest": "4e6cda4b133d000a59389f9baa14d539c3dbc65fce54bbade31697dbdd6f33f6",
    "sample": "| File:line | Vai trò | Đổi? |\n|---|---|---|\n| `src/state/frontier.mjs:107,128,186,202` | Định nghĩa + dùng cho `ready`-filter dep-resolve và `hasOpenDescendant` | Có — hỗn hợp lit",
    "identityFingerprint": "70972efde274b05a3207c09d8595b3c9965d81ec82876f8bfd5e0e573cf5dec0",
    "ancestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Consumer Audit",
      "0027 Audit 2 Resolved Statuses Set"
    ],
    "text": "| File:line | Vai trò | Đổi? |\n|---|---|---|\n| `src/state/frontier.mjs:107,128,186,202` | Định nghĩa + dùng cho `ready`-filter dep-resolve và `hasOpenDescendant` | Có — hỗn hợp literal-đuôi + category-canceled, như trên |\n| `src/state/frontier.mjs:92` | `item.status !== 'todo'` — cạnh CÒN LẠI của `ready`-filter, literal `todo` (đoạn đầu) | Có — phải đọc `statusCategory === 'todo'` để domain khác dùng nhãn khác cho \"chưa bắt đầu\" vẫn được nhặt |\n| `src/state/graph-metrics.mjs:15,298,358,378,401,406` | Import `RESOLVED_STATUSES`, đếm dep-blocked/not-done cho `graph`/`triage`/`stale` verb | Kế thừa tự động từ thay đổi ở frontier.mjs (chỉ gọi `.has`, không tự literal-compare) — cần đổi CHỮ KÝ gọi nếu `RESOLVED_STATUSES` đổi từ Set sang hàm `isResolved(item)` |\n| `src/state/graph-harness.mjs:22,103,106,108,143,154` | Import `RESOLVED_STATUSES`, gate `deps`/`mergeAfter` sẵn sàng cho `evolve`/dispatch | Như trên — kế thừa, đổi chữ ký gọi |\n| `src/state/drift-status.mjs:16,93` | `needsSync` — root chưa resolved mà ahead-of-target | Như trên |\n| `src/state/impact.mjs:24,90,146` | `openIds`/dep resolved-filter cho impact-analysis nội bộ fgOS | Như trên |\n| `src/runner/claim-port.mjs:11,159` | `unmergedDeps` — chặn claim khi dep chưa resolved | Như trên |\n| `src/report/entropy.mjs:15,17,41,96` | Import `RESOLVED_STATUSES` + `FINAL_STATUSES` cục bộ riêng (`awaiting-approval`,`blocked`,`done`) cho báo cáo entropy/stale-clarify | Có — `FINAL_STATUSES` cục bộ này TỰ Ý trộn 1 status đầu (`awaiting-approval`,`blocked`) với 1 status đuôi (`done`), là một bản sao lệch nghĩa của `RESOLVED_STATUSES` cần rà lại cùng lúc |\n| `bin/fgos.mjs:33,544,1373` | Import `RESOLVED_STATUSES` + `FINAL_STATUSES` cục bộ (`awaiting-approval`,`blocked`,`delivered`,`retrospective`,`cleanup`,`done`) cho outcome-backfill check và ready-view filter | Có — cùng lý do, cần đối chiếu lại theo ranh giới đầu/đuôi mới |"
  },
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Weak-exact",
    "reason": "ancestor headings differ; document exact share below one half",
    "targetUnit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-78",
      "githubAnchor": "unheaded-block-78",
      "stableAnchor": "unheaded-block-78",
      "title": "Unheaded block 78",
      "startLine": 677,
      "endLine": 687,
      "textDigest": "4e6cda4b133d000a59389f9baa14d539c3dbc65fce54bbade31697dbdd6f33f6",
      "sample": "| File:line | Vai trò | Đổi? |\n|---|---|---|\n| `src/state/frontier.mjs:107,128,186,202` | Định nghĩa + dùng cho `ready`-filter dep-resolve và `hasOpenDescendant` | Có — hỗn hợp lit",
      "identityFingerprint": "70972efde274b05a3207c09d8595b3c9965d81ec82876f8bfd5e0e573cf5dec0",
      "ancestry": [
        "Retired Decision History: Work State",
        "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
        "0027 Consumer Audit",
        "0027 Audit 2 Resolved Statuses Set"
      ],
      "text": "| File:line | Vai trò | Đổi? |\n|---|---|---|\n| `src/state/frontier.mjs:107,128,186,202` | Định nghĩa + dùng cho `ready`-filter dep-resolve và `hasOpenDescendant` | Có — hỗn hợp literal-đuôi + category-canceled, như trên |\n| `src/state/frontier.mjs:92` | `item.status !== 'todo'` — cạnh CÒN LẠI của `ready`-filter, literal `todo` (đoạn đầu) | Có — phải đọc `statusCategory === 'todo'` để domain khác dùng nhãn khác cho \"chưa bắt đầu\" vẫn được nhặt |\n| `src/state/graph-metrics.mjs:15,298,358,378,401,406` | Import `RESOLVED_STATUSES`, đếm dep-blocked/not-done cho `graph`/`triage`/`stale` verb | Kế thừa tự động từ thay đổi ở frontier.mjs (chỉ gọi `.has`, không tự literal-compare) — cần đổi CHỮ KÝ gọi nếu `RESOLVED_STATUSES` đổi từ Set sang hàm `isResolved(item)` |\n| `src/state/graph-harness.mjs:22,103,106,108,143,154` | Import `RESOLVED_STATUSES`, gate `deps`/`mergeAfter` sẵn sàng cho `evolve`/dispatch | Như trên — kế thừa, đổi chữ ký gọi |\n| `src/state/drift-status.mjs:16,93` | `needsSync` — root chưa resolved mà ahead-of-target | Như trên |\n| `src/state/impact.mjs:24,90,146` | `openIds`/dep resolved-filter cho impact-analysis nội bộ fgOS | Như trên |\n| `src/runner/claim-port.mjs:11,159` | `unmergedDeps` — chặn claim khi dep chưa resolved | Như trên |\n| `src/report/entropy.mjs:15,17,41,96` | Import `RESOLVED_STATUSES` + `FINAL_STATUSES` cục bộ riêng (`awaiting-approval`,`blocked`,`done`) cho báo cáo entropy/stale-clarify | Có — `FINAL_STATUSES` cục bộ này TỰ Ý trộn 1 status đầu (`awaiting-approval`,`blocked`) với 1 status đuôi (`done`), là một bản sao lệch nghĩa của `RESOLVED_STATUSES` cần rà lại cùng lúc |\n| `bin/fgos.mjs:33,544,1373` | Import `RESOLVED_STATUSES` + `FINAL_STATUSES` cục bộ (`awaiting-approval`,`blocked`,`delivered`,`retrospective`,`cleanup`,`done`) cho outcome-backfill check và ready-view filter | Có — cùng lý do, cần đối chiếu lại theo ranh giới đầu/đuôi mới |"
    }
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_84950cfff9d75392b847739c4812768a"
}
```

## Entry claim_ebfe14fc1ae59246f7b3c8871b402520

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_ebfe14fc1ae59246f7b3c8871b402520",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "b-decisions-second",
  "before": {
    "claimId": "claim_ebfe14fc1ae59246f7b3c8871b402520",
    "sourceUnitDigest": "8590e597d5f07589",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "0027-audit-3-cli-status-literals",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Source H5 \"3. Literal status trong verb logic\" is carried as H4 \"0027 Audit 3 CLI Status Literals\"; title and level changed.",
    "reviewedBy": "independent reviewer (review-b-decisions-second)",
    "reviewedAt": "2026-10-07",
    "targetUnitDigest": "f921d3b97d03d68d8e8ea0e0722b1893"
  },
  "currentDecision": {
    "claimId": "claim_ebfe14fc1ae59246f7b3c8871b402520",
    "sourceUnitDigest": "8590e597d5f07589",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "0027-audit-3-cli-status-literals",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "Source H5 \"3. Literal status trong verb logic\" is carried as H4 \"0027 Audit 3 CLI Status Literals\"; title and level changed. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
    "targetUnitDigest": "f921d3b97d03d68d8e8ea0e0722b18935ef9d37b362a0ce7e23b40b04aea8d27",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Consumer Audit"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/specs/work-state.md",
    "unitDigest": "26071a794a7d9b64d957d191369bf4df8aa6300176784d7d57503dda8acfbce1",
    "identityFingerprint": "e54a4909de009d2e98c668e3daa791add95be762b762ae9e9354ca2c9051ba68",
    "claimId": "claim_ebfe14fc1ae59246f7b3c8871b402520",
    "sourceAnchor": "3-literal-status-trong-verb-logic-của-binfgosmjs-tầng-clistore-chính-là-bảng-transition-của-domain-coding-hôm-nay",
    "unitKind": "heading",
    "sourceUnitDigest": "8590e597d5f07589aa636ec12500101275449755ae201796444dc84e81a70538",
    "claimKind": "specification",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "heading",
      "level": 5,
      "title": "3. Literal status trong verb logic của `bin/fgos.mjs` (tầng CLI/store — chính là \"bảng transition của domain coding\" hôm nay)",
      "anchor": "3-literal-status-trong-verb-logic-của-binfgosmjs-tầng-clistore-chính-là-bảng-transition-của-domain-coding-hôm-nay",
      "githubAnchor": "3-literal-status-trong-verb-logic-của-binfgosmjs-tầng-clistore-chính-là-bảng-transition-của-domain-coding-hôm-nay",
      "stableAnchor": "h-807dd27b1850",
      "startLine": 2032,
      "endLine": 2032,
      "textDigest": "8590e597d5f07589aa636ec12500101275449755ae201796444dc84e81a70538",
      "sample": "3. Literal status trong verb logic của `bin/fgos.mjs` (tầng CLI/store — chính là \"bảng transition của domain coding\" hôm nay)",
      "sectionPayloadDigest": "707bfd13096596cdaacead82be5204686f47f824c3a3323cbb5bed21ebcceb95",
      "followingBlockDigest": "707bfd13096596cdaacead82be5204686f47f824c3a3323cbb5bed21ebcceb95",
      "identityFingerprint": "e54a4909de009d2e98c668e3daa791add95be762b762ae9e9354ca2c9051ba68",
      "ancestry": [
        "0002 — Mô hình việc phẳng",
        "0027 — Domain sở hữu vocabulary/transition status đoạn TRƯỚC `delivered` (supersede base-workflow-model)",
        "Audit: mọi consumer thật của `status-fsm.mjs`/`STATUSES`/`TRANSITIONS`/literal status hôm nay"
      ],
      "text": "##### 3. Literal status trong verb logic của `bin/fgos.mjs` (tầng CLI/store — chính là \"bảng transition của domain coding\" hôm nay)",
      "sectionText": "##### 3. Literal status trong verb logic của `bin/fgos.mjs` (tầng CLI/store — chính là \"bảng transition của domain coding\" hôm nay)\n\n| File:line (khu vực) | Vai trò | Đổi? |\n|---|---|---|\n| `bin/fgos.mjs:700,816,2958` | `status: 'todo'` mặc định lúc `add`/`submit`/`sync-root` khai item mới | Không đổi hành vi coding (label giữ nguyên); về nguyên tắc trở thành default của domain đó, không hằng số toàn cục |\n| `bin/fgos.mjs:1358,1382` | Check `item.status === 'awaiting-human'` cho verb `ask`/`answer` | Đoạn đầu — domain-owned, nhưng cơ chế ask/answer bản thân domain-agnostic (async-human-gate, `status-fsm.mjs` header) nên về sau nên đọc category `in-progress` + field `ask`/`answer` thay vì literal `'awaiting-human'` nếu domain khác đặt tên khác cho park-state |\n| `bin/fgos.mjs:1800,1834,1866,1894,1957` | Check `'todo'`/`'blocked'`/`'doing'` cho `take`/`return`'s claim/verify flow | Đoạn đầu — domain-owned; verb `take`/`return` hôm nay hardcode transition coding, cần đọc bảng transition của `work.domain` khi domain thứ hai sản xuất thật xuất hiện |\n| `bin/fgos.mjs:2036-2114` | `doing → awaiting-approval`/`doing → blocked` (return verb, goal-check pass/fail) | Đoạn đầu — domain-owned |\n| `bin/fgos.mjs:2129,2278,3015-3019` | `awaiting-approval` check cho `approve`/`reject`, `awaiting-approval → todo` (reject, mang `reason` bắt buộc) | Đoạn đầu — domain-owned |\n| `bin/fgos.mjs:2234,2455-2456,2525-2748` | `awaiting-approval → delivered` (approve merge/GitHub/verify-only) và các cạnh `awaiting-approval → blocked` (merge-conflict/verify-fail-post-merge, mang `reason`) | **Ranh giới đầu/đuôi** — cạnh này BẮC CẦU 2 nhóm (nguồn đoạn đầu, đích đoạn đuôi); giữ nguyên vì `delivered` là điểm vào cố định của đuôi, nhưng điều kiện gate ở phía `awaiting-approval` vẫn đoạn đầu, domain-owned |\n| `bin/fgos.mjs:3047,3125-3193` | `blocked → awaiting-approval` (sync-root/catchup mechanical reconcile, fan-out-parallel) | Đoạn đầu — domain-owned |\n| `bin/fgos.mjs:1020-1025` | `case 'retrospective'`: yêu cầu `item.status === 'delivered'`, chuyển `delivered → retrospective` | **Đuôi — KHÔNG đổi** (chuỗi đuôi cố định, dùng chung mọi domain) |\n| `bin/fgos.mjs:1042-1082,1114` | `case 'cleanup'`: yêu cầu `status === 'cleanup'`, chuyển `cleanup → done`/`cleanup → blocked`; `case 'compound'` yêu cầu `status === 'retrospective'` | **Đuôi — KHÔNG đổi** cạnh transition; nhưng verb `cleanup`/skill chạy `retrospective` là nơi gap thật của `skillMap.retrospective` sẽ cắm vào (chưa code — `tsk-38t` decompose kế tiếp) |\n| `bin/fgos.mjs:658-672` (`collectRollupData`) | `w.status === 'done'` — đếm con `done`/tổng con cho verb `rollup` | **Đuôi — KHÔNG đổi** (`done` là literal cố định) |"
    }
  },
  "currentTarget": {
    "unitKind": "heading",
    "level": 4,
    "title": "0027 Audit 3 CLI Status Literals",
    "anchor": "0027-audit-3-cli-status-literals",
    "githubAnchor": "0027-audit-3-cli-status-literals",
    "stableAnchor": "h-a5f8396de511",
    "startLine": 689,
    "endLine": 689,
    "textDigest": "f921d3b97d03d68d8e8ea0e0722b18935ef9d37b362a0ce7e23b40b04aea8d27",
    "sample": "0027 Audit 3 CLI Status Literals",
    "sectionPayloadDigest": "707bfd13096596cdaacead82be5204686f47f824c3a3323cbb5bed21ebcceb95",
    "followingBlockDigest": "707bfd13096596cdaacead82be5204686f47f824c3a3323cbb5bed21ebcceb95",
    "identityFingerprint": "f16fa4a01ed949e956f6e6be4385d94e6b53a2201be7042947711410050370b9",
    "ancestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Consumer Audit"
    ],
    "text": "#### 0027 Audit 3 CLI Status Literals",
    "sectionText": "#### 0027 Audit 3 CLI Status Literals\n\n| File:line (khu vực) | Vai trò | Đổi? |\n|---|---|---|\n| `bin/fgos.mjs:700,816,2958` | `status: 'todo'` mặc định lúc `add`/`submit`/`sync-root` khai item mới | Không đổi hành vi coding (label giữ nguyên); về nguyên tắc trở thành default của domain đó, không hằng số toàn cục |\n| `bin/fgos.mjs:1358,1382` | Check `item.status === 'awaiting-human'` cho verb `ask`/`answer` | Đoạn đầu — domain-owned, nhưng cơ chế ask/answer bản thân domain-agnostic (async-human-gate, `status-fsm.mjs` header) nên về sau nên đọc category `in-progress` + field `ask`/`answer` thay vì literal `'awaiting-human'` nếu domain khác đặt tên khác cho park-state |\n| `bin/fgos.mjs:1800,1834,1866,1894,1957` | Check `'todo'`/`'blocked'`/`'doing'` cho `take`/`return`'s claim/verify flow | Đoạn đầu — domain-owned; verb `take`/`return` hôm nay hardcode transition coding, cần đọc bảng transition của `work.domain` khi domain thứ hai sản xuất thật xuất hiện |\n| `bin/fgos.mjs:2036-2114` | `doing → awaiting-approval`/`doing → blocked` (return verb, goal-check pass/fail) | Đoạn đầu — domain-owned |\n| `bin/fgos.mjs:2129,2278,3015-3019` | `awaiting-approval` check cho `approve`/`reject`, `awaiting-approval → todo` (reject, mang `reason` bắt buộc) | Đoạn đầu — domain-owned |\n| `bin/fgos.mjs:2234,2455-2456,2525-2748` | `awaiting-approval → delivered` (approve merge/GitHub/verify-only) và các cạnh `awaiting-approval → blocked` (merge-conflict/verify-fail-post-merge, mang `reason`) | **Ranh giới đầu/đuôi** — cạnh này BẮC CẦU 2 nhóm (nguồn đoạn đầu, đích đoạn đuôi); giữ nguyên vì `delivered` là điểm vào cố định của đuôi, nhưng điều kiện gate ở phía `awaiting-approval` vẫn đoạn đầu, domain-owned |\n| `bin/fgos.mjs:3047,3125-3193` | `blocked → awaiting-approval` (sync-root/catchup mechanical reconcile, fan-out-parallel) | Đoạn đầu — domain-owned |\n| `bin/fgos.mjs:1020-1025` | `case 'retrospective'`: yêu cầu `item.status === 'delivered'`, chuyển `delivered → retrospective` | **Đuôi — KHÔNG đổi** (chuỗi đuôi cố định, dùng chung mọi domain) |\n| `bin/fgos.mjs:1042-1082,1114` | `case 'cleanup'`: yêu cầu `status === 'cleanup'`, chuyển `cleanup → done`/`cleanup → blocked`; `case 'compound'` yêu cầu `status === 'retrospective'` | **Đuôi — KHÔNG đổi** cạnh transition; nhưng verb `cleanup`/skill chạy `retrospective` là nơi gap thật của `skillMap.retrospective` sẽ cắm vào (chưa code — `tsk-38t` decompose kế tiếp) |\n| `bin/fgos.mjs:658-672` (`collectRollupData`) | `w.status === 'done'` — đếm con `done`/tổng con cho verb `rollup` | **Đuôi — KHÔNG đổi** (`done` là literal cố định) |"
  },
  "sourceTargetDigestsUnequal": true,
  "classObservation": {
    "class": "Judgment",
    "reason": "no target digest match",
    "targetUnit": null
  },
  "mechanicalRequired": true,
  "deepRequired": true,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_ebfe14fc1ae59246f7b3c8871b402520"
}
```

## Entry claim_72ee6b558f807216affeb2559c6a597d

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_72ee6b558f807216affeb2559c6a597d",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "b-decisions-second",
  "before": {
    "claimId": "claim_72ee6b558f807216affeb2559c6a597d",
    "sourceUnitDigest": "707bfd13096596cd",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-79",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Audit 3 table of CLI status literals; carried verbatim.",
    "reviewedBy": "independent reviewer (review-b-decisions-second)",
    "reviewedAt": "2026-10-07",
    "targetUnitDigest": "707bfd13096596cdaacead82be520468"
  },
  "currentDecision": {
    "claimId": "claim_72ee6b558f807216affeb2559c6a597d",
    "sourceUnitDigest": "707bfd13096596cd",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-79",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "Audit 3 table of CLI status literals; carried verbatim. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
    "targetUnitDigest": "707bfd13096596cdaacead82be5204686f47f824c3a3323cbb5bed21ebcceb95",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Consumer Audit",
      "0027 Audit 3 CLI Status Literals"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/specs/work-state.md",
    "unitDigest": "254ba8be6f77fe9245560bbbf4e2143e9b5cfcc52480ac828491b3237871ea44",
    "identityFingerprint": "254ba8be6f77fe9245560bbbf4e2143e9b5cfcc52480ac828491b3237871ea44",
    "claimId": "claim_72ee6b558f807216affeb2559c6a597d",
    "sourceAnchor": "unheaded-block-189",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "707bfd13096596cdaacead82be5204686f47f824c3a3323cbb5bed21ebcceb95",
    "claimKind": "specification",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-189",
      "githubAnchor": "unheaded-block-189",
      "stableAnchor": "unheaded-block-189",
      "title": "Unheaded block 189",
      "startLine": 2034,
      "endLine": 2045,
      "textDigest": "707bfd13096596cdaacead82be5204686f47f824c3a3323cbb5bed21ebcceb95",
      "sample": "| File:line (khu vực) | Vai trò | Đổi? |\n|---|---|---|\n| `bin/fgos.mjs:700,816,2958` | `status: 'todo'` mặc định lúc `add`/`submit`/`sync-root` khai item mới | Không đổi hành vi co",
      "identityFingerprint": "254ba8be6f77fe9245560bbbf4e2143e9b5cfcc52480ac828491b3237871ea44",
      "ancestry": [
        "0002 — Mô hình việc phẳng",
        "0027 — Domain sở hữu vocabulary/transition status đoạn TRƯỚC `delivered` (supersede base-workflow-model)",
        "Audit: mọi consumer thật của `status-fsm.mjs`/`STATUSES`/`TRANSITIONS`/literal status hôm nay",
        "3. Literal status trong verb logic của `bin/fgos.mjs` (tầng CLI/store — chính là \"bảng transition của domain coding\" hôm nay)"
      ],
      "text": "| File:line (khu vực) | Vai trò | Đổi? |\n|---|---|---|\n| `bin/fgos.mjs:700,816,2958` | `status: 'todo'` mặc định lúc `add`/`submit`/`sync-root` khai item mới | Không đổi hành vi coding (label giữ nguyên); về nguyên tắc trở thành default của domain đó, không hằng số toàn cục |\n| `bin/fgos.mjs:1358,1382` | Check `item.status === 'awaiting-human'` cho verb `ask`/`answer` | Đoạn đầu — domain-owned, nhưng cơ chế ask/answer bản thân domain-agnostic (async-human-gate, `status-fsm.mjs` header) nên về sau nên đọc category `in-progress` + field `ask`/`answer` thay vì literal `'awaiting-human'` nếu domain khác đặt tên khác cho park-state |\n| `bin/fgos.mjs:1800,1834,1866,1894,1957` | Check `'todo'`/`'blocked'`/`'doing'` cho `take`/`return`'s claim/verify flow | Đoạn đầu — domain-owned; verb `take`/`return` hôm nay hardcode transition coding, cần đọc bảng transition của `work.domain` khi domain thứ hai sản xuất thật xuất hiện |\n| `bin/fgos.mjs:2036-2114` | `doing → awaiting-approval`/`doing → blocked` (return verb, goal-check pass/fail) | Đoạn đầu — domain-owned |\n| `bin/fgos.mjs:2129,2278,3015-3019` | `awaiting-approval` check cho `approve`/`reject`, `awaiting-approval → todo` (reject, mang `reason` bắt buộc) | Đoạn đầu — domain-owned |\n| `bin/fgos.mjs:2234,2455-2456,2525-2748` | `awaiting-approval → delivered` (approve merge/GitHub/verify-only) và các cạnh `awaiting-approval → blocked` (merge-conflict/verify-fail-post-merge, mang `reason`) | **Ranh giới đầu/đuôi** — cạnh này BẮC CẦU 2 nhóm (nguồn đoạn đầu, đích đoạn đuôi); giữ nguyên vì `delivered` là điểm vào cố định của đuôi, nhưng điều kiện gate ở phía `awaiting-approval` vẫn đoạn đầu, domain-owned |\n| `bin/fgos.mjs:3047,3125-3193` | `blocked → awaiting-approval` (sync-root/catchup mechanical reconcile, fan-out-parallel) | Đoạn đầu — domain-owned |\n| `bin/fgos.mjs:1020-1025` | `case 'retrospective'`: yêu cầu `item.status === 'delivered'`, chuyển `delivered → retrospective` | **Đuôi — KHÔNG đổi** (chuỗi đuôi cố định, dùng chung mọi domain) |\n| `bin/fgos.mjs:1042-1082,1114` | `case 'cleanup'`: yêu cầu `status === 'cleanup'`, chuyển `cleanup → done`/`cleanup → blocked`; `case 'compound'` yêu cầu `status === 'retrospective'` | **Đuôi — KHÔNG đổi** cạnh transition; nhưng verb `cleanup`/skill chạy `retrospective` là nơi gap thật của `skillMap.retrospective` sẽ cắm vào (chưa code — `tsk-38t` decompose kế tiếp) |\n| `bin/fgos.mjs:658-672` (`collectRollupData`) | `w.status === 'done'` — đếm con `done`/tổng con cho verb `rollup` | **Đuôi — KHÔNG đổi** (`done` là literal cố định) |"
    }
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-79",
    "githubAnchor": "unheaded-block-79",
    "stableAnchor": "unheaded-block-79",
    "title": "Unheaded block 79",
    "startLine": 691,
    "endLine": 702,
    "textDigest": "707bfd13096596cdaacead82be5204686f47f824c3a3323cbb5bed21ebcceb95",
    "sample": "| File:line (khu vực) | Vai trò | Đổi? |\n|---|---|---|\n| `bin/fgos.mjs:700,816,2958` | `status: 'todo'` mặc định lúc `add`/`submit`/`sync-root` khai item mới | Không đổi hành vi co",
    "identityFingerprint": "254ba8be6f77fe9245560bbbf4e2143e9b5cfcc52480ac828491b3237871ea44",
    "ancestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Consumer Audit",
      "0027 Audit 3 CLI Status Literals"
    ],
    "text": "| File:line (khu vực) | Vai trò | Đổi? |\n|---|---|---|\n| `bin/fgos.mjs:700,816,2958` | `status: 'todo'` mặc định lúc `add`/`submit`/`sync-root` khai item mới | Không đổi hành vi coding (label giữ nguyên); về nguyên tắc trở thành default của domain đó, không hằng số toàn cục |\n| `bin/fgos.mjs:1358,1382` | Check `item.status === 'awaiting-human'` cho verb `ask`/`answer` | Đoạn đầu — domain-owned, nhưng cơ chế ask/answer bản thân domain-agnostic (async-human-gate, `status-fsm.mjs` header) nên về sau nên đọc category `in-progress` + field `ask`/`answer` thay vì literal `'awaiting-human'` nếu domain khác đặt tên khác cho park-state |\n| `bin/fgos.mjs:1800,1834,1866,1894,1957` | Check `'todo'`/`'blocked'`/`'doing'` cho `take`/`return`'s claim/verify flow | Đoạn đầu — domain-owned; verb `take`/`return` hôm nay hardcode transition coding, cần đọc bảng transition của `work.domain` khi domain thứ hai sản xuất thật xuất hiện |\n| `bin/fgos.mjs:2036-2114` | `doing → awaiting-approval`/`doing → blocked` (return verb, goal-check pass/fail) | Đoạn đầu — domain-owned |\n| `bin/fgos.mjs:2129,2278,3015-3019` | `awaiting-approval` check cho `approve`/`reject`, `awaiting-approval → todo` (reject, mang `reason` bắt buộc) | Đoạn đầu — domain-owned |\n| `bin/fgos.mjs:2234,2455-2456,2525-2748` | `awaiting-approval → delivered` (approve merge/GitHub/verify-only) và các cạnh `awaiting-approval → blocked` (merge-conflict/verify-fail-post-merge, mang `reason`) | **Ranh giới đầu/đuôi** — cạnh này BẮC CẦU 2 nhóm (nguồn đoạn đầu, đích đoạn đuôi); giữ nguyên vì `delivered` là điểm vào cố định của đuôi, nhưng điều kiện gate ở phía `awaiting-approval` vẫn đoạn đầu, domain-owned |\n| `bin/fgos.mjs:3047,3125-3193` | `blocked → awaiting-approval` (sync-root/catchup mechanical reconcile, fan-out-parallel) | Đoạn đầu — domain-owned |\n| `bin/fgos.mjs:1020-1025` | `case 'retrospective'`: yêu cầu `item.status === 'delivered'`, chuyển `delivered → retrospective` | **Đuôi — KHÔNG đổi** (chuỗi đuôi cố định, dùng chung mọi domain) |\n| `bin/fgos.mjs:1042-1082,1114` | `case 'cleanup'`: yêu cầu `status === 'cleanup'`, chuyển `cleanup → done`/`cleanup → blocked`; `case 'compound'` yêu cầu `status === 'retrospective'` | **Đuôi — KHÔNG đổi** cạnh transition; nhưng verb `cleanup`/skill chạy `retrospective` là nơi gap thật của `skillMap.retrospective` sẽ cắm vào (chưa code — `tsk-38t` decompose kế tiếp) |\n| `bin/fgos.mjs:658-672` (`collectRollupData`) | `w.status === 'done'` — đếm con `done`/tổng con cho verb `rollup` | **Đuôi — KHÔNG đổi** (`done` là literal cố định) |"
  },
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Weak-exact",
    "reason": "ancestor headings differ; document exact share below one half",
    "targetUnit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-79",
      "githubAnchor": "unheaded-block-79",
      "stableAnchor": "unheaded-block-79",
      "title": "Unheaded block 79",
      "startLine": 691,
      "endLine": 702,
      "textDigest": "707bfd13096596cdaacead82be5204686f47f824c3a3323cbb5bed21ebcceb95",
      "sample": "| File:line (khu vực) | Vai trò | Đổi? |\n|---|---|---|\n| `bin/fgos.mjs:700,816,2958` | `status: 'todo'` mặc định lúc `add`/`submit`/`sync-root` khai item mới | Không đổi hành vi co",
      "identityFingerprint": "254ba8be6f77fe9245560bbbf4e2143e9b5cfcc52480ac828491b3237871ea44",
      "ancestry": [
        "Retired Decision History: Work State",
        "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
        "0027 Consumer Audit",
        "0027 Audit 3 CLI Status Literals"
      ],
      "text": "| File:line (khu vực) | Vai trò | Đổi? |\n|---|---|---|\n| `bin/fgos.mjs:700,816,2958` | `status: 'todo'` mặc định lúc `add`/`submit`/`sync-root` khai item mới | Không đổi hành vi coding (label giữ nguyên); về nguyên tắc trở thành default của domain đó, không hằng số toàn cục |\n| `bin/fgos.mjs:1358,1382` | Check `item.status === 'awaiting-human'` cho verb `ask`/`answer` | Đoạn đầu — domain-owned, nhưng cơ chế ask/answer bản thân domain-agnostic (async-human-gate, `status-fsm.mjs` header) nên về sau nên đọc category `in-progress` + field `ask`/`answer` thay vì literal `'awaiting-human'` nếu domain khác đặt tên khác cho park-state |\n| `bin/fgos.mjs:1800,1834,1866,1894,1957` | Check `'todo'`/`'blocked'`/`'doing'` cho `take`/`return`'s claim/verify flow | Đoạn đầu — domain-owned; verb `take`/`return` hôm nay hardcode transition coding, cần đọc bảng transition của `work.domain` khi domain thứ hai sản xuất thật xuất hiện |\n| `bin/fgos.mjs:2036-2114` | `doing → awaiting-approval`/`doing → blocked` (return verb, goal-check pass/fail) | Đoạn đầu — domain-owned |\n| `bin/fgos.mjs:2129,2278,3015-3019` | `awaiting-approval` check cho `approve`/`reject`, `awaiting-approval → todo` (reject, mang `reason` bắt buộc) | Đoạn đầu — domain-owned |\n| `bin/fgos.mjs:2234,2455-2456,2525-2748` | `awaiting-approval → delivered` (approve merge/GitHub/verify-only) và các cạnh `awaiting-approval → blocked` (merge-conflict/verify-fail-post-merge, mang `reason`) | **Ranh giới đầu/đuôi** — cạnh này BẮC CẦU 2 nhóm (nguồn đoạn đầu, đích đoạn đuôi); giữ nguyên vì `delivered` là điểm vào cố định của đuôi, nhưng điều kiện gate ở phía `awaiting-approval` vẫn đoạn đầu, domain-owned |\n| `bin/fgos.mjs:3047,3125-3193` | `blocked → awaiting-approval` (sync-root/catchup mechanical reconcile, fan-out-parallel) | Đoạn đầu — domain-owned |\n| `bin/fgos.mjs:1020-1025` | `case 'retrospective'`: yêu cầu `item.status === 'delivered'`, chuyển `delivered → retrospective` | **Đuôi — KHÔNG đổi** (chuỗi đuôi cố định, dùng chung mọi domain) |\n| `bin/fgos.mjs:1042-1082,1114` | `case 'cleanup'`: yêu cầu `status === 'cleanup'`, chuyển `cleanup → done`/`cleanup → blocked`; `case 'compound'` yêu cầu `status === 'retrospective'` | **Đuôi — KHÔNG đổi** cạnh transition; nhưng verb `cleanup`/skill chạy `retrospective` là nơi gap thật của `skillMap.retrospective` sẽ cắm vào (chưa code — `tsk-38t` decompose kế tiếp) |\n| `bin/fgos.mjs:658-672` (`collectRollupData`) | `w.status === 'done'` — đếm con `done`/tổng con cho verb `rollup` | **Đuôi — KHÔNG đổi** (`done` là literal cố định) |"
    }
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_72ee6b558f807216affeb2559c6a597d"
}
```

## Entry claim_6a85836cdc08fbdfde62f6d3fd9c2d8f

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_6a85836cdc08fbdfde62f6d3fd9c2d8f",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "b-decisions-second",
  "before": {
    "claimId": "claim_6a85836cdc08fbdfde62f6d3fd9c2d8f",
    "sourceUnitDigest": "96096e1e5dd0a59c",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "0027-audit-4-runner-consumers",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Source H5 \"4. runner/ ...\" is carried as H4 \"0027 Audit 4 Runner Consumers\"; title and level changed.",
    "reviewedBy": "independent reviewer (review-b-decisions-second)",
    "reviewedAt": "2026-10-07",
    "targetUnitDigest": "cab0851daca0bf6a441036d7b9e02d4f"
  },
  "currentDecision": {
    "claimId": "claim_6a85836cdc08fbdfde62f6d3fd9c2d8f",
    "sourceUnitDigest": "96096e1e5dd0a59c",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "0027-audit-4-runner-consumers",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "Source H5 \"4. runner/ ...\" is carried as H4 \"0027 Audit 4 Runner Consumers\"; title and level changed. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
    "targetUnitDigest": "cab0851daca0bf6a441036d7b9e02d4f16af9a41b78fd56f251727b173b51e5d",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Consumer Audit"
    ],
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried."
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/specs/work-state.md",
    "unitDigest": "43b72ec1515895c8837f01df0cfb5d0071dc70e255cd78eaf57ab609ea63efd7",
    "identityFingerprint": "e1641f8a3ff36bf58b46fd29f1dd9d53397c6850c456b58d8bcc77f837b90661",
    "claimId": "claim_6a85836cdc08fbdfde62f6d3fd9c2d8f",
    "sourceAnchor": "4-runner-vòng-tự-hành-tiêu-thụ-nặng-nhóm-đầu",
    "unitKind": "heading",
    "sourceUnitDigest": "96096e1e5dd0a59ceb0881cddb307462283daac13759672f41a1890a346e6f98",
    "claimKind": "specification",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "heading",
      "level": 5,
      "title": "4. `runner/` — vòng tự hành, tiêu thụ nặng nhóm đầu",
      "anchor": "4-runner-vòng-tự-hành-tiêu-thụ-nặng-nhóm-đầu",
      "githubAnchor": "4-runner-vòng-tự-hành-tiêu-thụ-nặng-nhóm-đầu",
      "stableAnchor": "h-c7a94531a5ec",
      "startLine": 2047,
      "endLine": 2047,
      "textDigest": "96096e1e5dd0a59ceb0881cddb307462283daac13759672f41a1890a346e6f98",
      "sample": "4. `runner/` — vòng tự hành, tiêu thụ nặng nhóm đầu",
      "sectionPayloadDigest": "78c3de3f1ca205dedc7323091a92d4c1fcfff8e99132b37291aa46035cd75a20",
      "followingBlockDigest": "78c3de3f1ca205dedc7323091a92d4c1fcfff8e99132b37291aa46035cd75a20",
      "identityFingerprint": "e1641f8a3ff36bf58b46fd29f1dd9d53397c6850c456b58d8bcc77f837b90661",
      "ancestry": [
        "0002 — Mô hình việc phẳng",
        "0027 — Domain sở hữu vocabulary/transition status đoạn TRƯỚC `delivered` (supersede base-workflow-model)",
        "Audit: mọi consumer thật của `status-fsm.mjs`/`STATUSES`/`TRANSITIONS`/literal status hôm nay"
      ],
      "text": "##### 4. `runner/` — vòng tự hành, tiêu thụ nặng nhóm đầu",
      "sectionText": "##### 4. `runner/` — vòng tự hành, tiêu thụ nặng nhóm đầu\n\n| File:line | Vai trò | Đổi? |\n|---|---|---|\n| `src/runner/loop.mjs:336,352,381,383` | Check `status !== 'doing'`, resolve crash-reclaim (`doing → blocked`) | Đoạn đầu — domain-owned |\n| `src/runner/loop.mjs:546,598` | `status: 'todo'` mặc định item mới do runner tự sinh (discovered-from) | Đoạn đầu — domain-owned |\n| `src/runner/loop.mjs:720,729,738` | `doing → awaiting-approval`, outcome `'awaiting-approval'` (goal-check pass) | Đoạn đầu — domain-owned |\n| `src/runner/loop.mjs:797-798,1060` | `doing → blocked` (verify-fail/anti-loop trip) | Đoạn đầu — domain-owned |\n| `src/runner/loop.mjs:976,996` | Check `item.stage === clarifyStage/decomposeStage && item.status === 'todo'` — cổng phối `stage` × `status` để chọn dispatch | **Điểm giao thoa 2 trục** — `stage` đã domain-owned (phần cũ vẫn đúng phần này), `status` literal `'todo'` ở đây cần đổi sang category `todo` để domain khác không bị lệch |\n| `src/runner/anti-loop.mjs:59` | Đếm `event.payload.to === 'doing'` cho visit-count chống lặp | Đoạn đầu — domain-owned |\n| `src/runner/claim-port.mjs:44,204-261` | `take` verb: `'todo'`/`'blocked'` (branch-take) → `'doing'` | Đoạn đầu — domain-owned |\n| `src/runner/github-adapter.mjs:56,90,106,123,150,179` | `outcome: 'blocked'` (disposition, TỪ VỰNG DÙNG CHUNG với `status` per `0024`) khi `gh` thất bại | Đoạn đầu (disposition-side) — cần đồng bộ cùng lúc với `status`, đúng bài học `0024` (đổi 1 nơi bỏ nơi kia tái tạo ambiguity) |\n| `src/runner/promote-engine.mjs:79` | `outcome: 'blocked'` | Như trên |\n| `src/runner/recovery.mjs:131,133` | Crash-recovery resolve `to: 'awaiting-approval'` / `to: 'blocked'` | Đoạn đầu — domain-owned |"
    }
  },
  "currentTarget": {
    "unitKind": "heading",
    "level": 4,
    "title": "0027 Audit 4 Runner Consumers",
    "anchor": "0027-audit-4-runner-consumers",
    "githubAnchor": "0027-audit-4-runner-consumers",
    "stableAnchor": "h-4c3b31155559",
    "startLine": 704,
    "endLine": 704,
    "textDigest": "cab0851daca0bf6a441036d7b9e02d4f16af9a41b78fd56f251727b173b51e5d",
    "sample": "0027 Audit 4 Runner Consumers",
    "sectionPayloadDigest": "78c3de3f1ca205dedc7323091a92d4c1fcfff8e99132b37291aa46035cd75a20",
    "followingBlockDigest": "78c3de3f1ca205dedc7323091a92d4c1fcfff8e99132b37291aa46035cd75a20",
    "identityFingerprint": "42fc746b3c0119e7c1e039695941895b0c0cc9e8d9f008c6d75f6301139db92c",
    "ancestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Consumer Audit"
    ],
    "text": "#### 0027 Audit 4 Runner Consumers",
    "sectionText": "#### 0027 Audit 4 Runner Consumers\n\n| File:line | Vai trò | Đổi? |\n|---|---|---|\n| `src/runner/loop.mjs:336,352,381,383` | Check `status !== 'doing'`, resolve crash-reclaim (`doing → blocked`) | Đoạn đầu — domain-owned |\n| `src/runner/loop.mjs:546,598` | `status: 'todo'` mặc định item mới do runner tự sinh (discovered-from) | Đoạn đầu — domain-owned |\n| `src/runner/loop.mjs:720,729,738` | `doing → awaiting-approval`, outcome `'awaiting-approval'` (goal-check pass) | Đoạn đầu — domain-owned |\n| `src/runner/loop.mjs:797-798,1060` | `doing → blocked` (verify-fail/anti-loop trip) | Đoạn đầu — domain-owned |\n| `src/runner/loop.mjs:976,996` | Check `item.stage === clarifyStage/decomposeStage && item.status === 'todo'` — cổng phối `stage` × `status` để chọn dispatch | **Điểm giao thoa 2 trục** — `stage` đã domain-owned (phần cũ vẫn đúng phần này), `status` literal `'todo'` ở đây cần đổi sang category `todo` để domain khác không bị lệch |\n| `src/runner/anti-loop.mjs:59` | Đếm `event.payload.to === 'doing'` cho visit-count chống lặp | Đoạn đầu — domain-owned |\n| `src/runner/claim-port.mjs:44,204-261` | `take` verb: `'todo'`/`'blocked'` (branch-take) → `'doing'` | Đoạn đầu — domain-owned |\n| `src/runner/github-adapter.mjs:56,90,106,123,150,179` | `outcome: 'blocked'` (disposition, TỪ VỰNG DÙNG CHUNG với `status` per `0024`) khi `gh` thất bại | Đoạn đầu (disposition-side) — cần đồng bộ cùng lúc với `status`, đúng bài học `0024` (đổi 1 nơi bỏ nơi kia tái tạo ambiguity) |\n| `src/runner/promote-engine.mjs:79` | `outcome: 'blocked'` | Như trên |\n| `src/runner/recovery.mjs:131,133` | Crash-recovery resolve `to: 'awaiting-approval'` / `to: 'blocked'` | Đoạn đầu — domain-owned |"
  },
  "sourceTargetDigestsUnequal": true,
  "classObservation": {
    "class": "Judgment",
    "reason": "no target digest match",
    "targetUnit": null
  },
  "mechanicalRequired": true,
  "deepRequired": true,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_6a85836cdc08fbdfde62f6d3fd9c2d8f"
}
```

## Entry claim_4fceb5ca59ea256ccd77c0975d3576e1

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_4fceb5ca59ea256ccd77c0975d3576e1",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "b-decisions-second",
  "before": {
    "claimId": "claim_4fceb5ca59ea256ccd77c0975d3576e1",
    "sourceUnitDigest": "78c3de3f1ca205de",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-80",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Audit 4 runner table; carried verbatim into block 80 (the located suggestion of block 76 was a first-line collision, whole-text match is block 80).",
    "reviewedBy": "independent reviewer (review-b-decisions-second)",
    "reviewedAt": "2026-10-07",
    "targetUnitDigest": "78c3de3f1ca205dedc7323091a92d4c1"
  },
  "currentDecision": {
    "claimId": "claim_4fceb5ca59ea256ccd77c0975d3576e1",
    "sourceUnitDigest": "78c3de3f1ca205de",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-80",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "Audit 4 runner table; carried verbatim into block 80 (the located suggestion of block 76 was a first-line collision, whole-text match is block 80). L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
    "targetUnitDigest": "78c3de3f1ca205dedc7323091a92d4c1fcfff8e99132b37291aa46035cd75a20",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Consumer Audit",
      "0027 Audit 4 Runner Consumers"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/specs/work-state.md",
    "unitDigest": "c1712116f21ec187a11b298cd174f9856aa769c2065b02c30266a484db80a0a0",
    "identityFingerprint": "c1712116f21ec187a11b298cd174f9856aa769c2065b02c30266a484db80a0a0",
    "claimId": "claim_4fceb5ca59ea256ccd77c0975d3576e1",
    "sourceAnchor": "unheaded-block-190",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "78c3de3f1ca205dedc7323091a92d4c1fcfff8e99132b37291aa46035cd75a20",
    "claimKind": "specification",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-190",
      "githubAnchor": "unheaded-block-190",
      "stableAnchor": "unheaded-block-190",
      "title": "Unheaded block 190",
      "startLine": 2049,
      "endLine": 2060,
      "textDigest": "78c3de3f1ca205dedc7323091a92d4c1fcfff8e99132b37291aa46035cd75a20",
      "sample": "| File:line | Vai trò | Đổi? |\n|---|---|---|\n| `src/runner/loop.mjs:336,352,381,383` | Check `status !== 'doing'`, resolve crash-reclaim (`doing → blocked`) | Đoạn đầu — domain-own",
      "identityFingerprint": "c1712116f21ec187a11b298cd174f9856aa769c2065b02c30266a484db80a0a0",
      "ancestry": [
        "0002 — Mô hình việc phẳng",
        "0027 — Domain sở hữu vocabulary/transition status đoạn TRƯỚC `delivered` (supersede base-workflow-model)",
        "Audit: mọi consumer thật của `status-fsm.mjs`/`STATUSES`/`TRANSITIONS`/literal status hôm nay",
        "4. `runner/` — vòng tự hành, tiêu thụ nặng nhóm đầu"
      ],
      "text": "| File:line | Vai trò | Đổi? |\n|---|---|---|\n| `src/runner/loop.mjs:336,352,381,383` | Check `status !== 'doing'`, resolve crash-reclaim (`doing → blocked`) | Đoạn đầu — domain-owned |\n| `src/runner/loop.mjs:546,598` | `status: 'todo'` mặc định item mới do runner tự sinh (discovered-from) | Đoạn đầu — domain-owned |\n| `src/runner/loop.mjs:720,729,738` | `doing → awaiting-approval`, outcome `'awaiting-approval'` (goal-check pass) | Đoạn đầu — domain-owned |\n| `src/runner/loop.mjs:797-798,1060` | `doing → blocked` (verify-fail/anti-loop trip) | Đoạn đầu — domain-owned |\n| `src/runner/loop.mjs:976,996` | Check `item.stage === clarifyStage/decomposeStage && item.status === 'todo'` — cổng phối `stage` × `status` để chọn dispatch | **Điểm giao thoa 2 trục** — `stage` đã domain-owned (phần cũ vẫn đúng phần này), `status` literal `'todo'` ở đây cần đổi sang category `todo` để domain khác không bị lệch |\n| `src/runner/anti-loop.mjs:59` | Đếm `event.payload.to === 'doing'` cho visit-count chống lặp | Đoạn đầu — domain-owned |\n| `src/runner/claim-port.mjs:44,204-261` | `take` verb: `'todo'`/`'blocked'` (branch-take) → `'doing'` | Đoạn đầu — domain-owned |\n| `src/runner/github-adapter.mjs:56,90,106,123,150,179` | `outcome: 'blocked'` (disposition, TỪ VỰNG DÙNG CHUNG với `status` per `0024`) khi `gh` thất bại | Đoạn đầu (disposition-side) — cần đồng bộ cùng lúc với `status`, đúng bài học `0024` (đổi 1 nơi bỏ nơi kia tái tạo ambiguity) |\n| `src/runner/promote-engine.mjs:79` | `outcome: 'blocked'` | Như trên |\n| `src/runner/recovery.mjs:131,133` | Crash-recovery resolve `to: 'awaiting-approval'` / `to: 'blocked'` | Đoạn đầu — domain-owned |"
    }
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-80",
    "githubAnchor": "unheaded-block-80",
    "stableAnchor": "unheaded-block-80",
    "title": "Unheaded block 80",
    "startLine": 706,
    "endLine": 717,
    "textDigest": "78c3de3f1ca205dedc7323091a92d4c1fcfff8e99132b37291aa46035cd75a20",
    "sample": "| File:line | Vai trò | Đổi? |\n|---|---|---|\n| `src/runner/loop.mjs:336,352,381,383` | Check `status !== 'doing'`, resolve crash-reclaim (`doing → blocked`) | Đoạn đầu — domain-own",
    "identityFingerprint": "c1712116f21ec187a11b298cd174f9856aa769c2065b02c30266a484db80a0a0",
    "ancestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Consumer Audit",
      "0027 Audit 4 Runner Consumers"
    ],
    "text": "| File:line | Vai trò | Đổi? |\n|---|---|---|\n| `src/runner/loop.mjs:336,352,381,383` | Check `status !== 'doing'`, resolve crash-reclaim (`doing → blocked`) | Đoạn đầu — domain-owned |\n| `src/runner/loop.mjs:546,598` | `status: 'todo'` mặc định item mới do runner tự sinh (discovered-from) | Đoạn đầu — domain-owned |\n| `src/runner/loop.mjs:720,729,738` | `doing → awaiting-approval`, outcome `'awaiting-approval'` (goal-check pass) | Đoạn đầu — domain-owned |\n| `src/runner/loop.mjs:797-798,1060` | `doing → blocked` (verify-fail/anti-loop trip) | Đoạn đầu — domain-owned |\n| `src/runner/loop.mjs:976,996` | Check `item.stage === clarifyStage/decomposeStage && item.status === 'todo'` — cổng phối `stage` × `status` để chọn dispatch | **Điểm giao thoa 2 trục** — `stage` đã domain-owned (phần cũ vẫn đúng phần này), `status` literal `'todo'` ở đây cần đổi sang category `todo` để domain khác không bị lệch |\n| `src/runner/anti-loop.mjs:59` | Đếm `event.payload.to === 'doing'` cho visit-count chống lặp | Đoạn đầu — domain-owned |\n| `src/runner/claim-port.mjs:44,204-261` | `take` verb: `'todo'`/`'blocked'` (branch-take) → `'doing'` | Đoạn đầu — domain-owned |\n| `src/runner/github-adapter.mjs:56,90,106,123,150,179` | `outcome: 'blocked'` (disposition, TỪ VỰNG DÙNG CHUNG với `status` per `0024`) khi `gh` thất bại | Đoạn đầu (disposition-side) — cần đồng bộ cùng lúc với `status`, đúng bài học `0024` (đổi 1 nơi bỏ nơi kia tái tạo ambiguity) |\n| `src/runner/promote-engine.mjs:79` | `outcome: 'blocked'` | Như trên |\n| `src/runner/recovery.mjs:131,133` | Crash-recovery resolve `to: 'awaiting-approval'` / `to: 'blocked'` | Đoạn đầu — domain-owned |"
  },
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Weak-exact",
    "reason": "ancestor headings differ; document exact share below one half",
    "targetUnit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-80",
      "githubAnchor": "unheaded-block-80",
      "stableAnchor": "unheaded-block-80",
      "title": "Unheaded block 80",
      "startLine": 706,
      "endLine": 717,
      "textDigest": "78c3de3f1ca205dedc7323091a92d4c1fcfff8e99132b37291aa46035cd75a20",
      "sample": "| File:line | Vai trò | Đổi? |\n|---|---|---|\n| `src/runner/loop.mjs:336,352,381,383` | Check `status !== 'doing'`, resolve crash-reclaim (`doing → blocked`) | Đoạn đầu — domain-own",
      "identityFingerprint": "c1712116f21ec187a11b298cd174f9856aa769c2065b02c30266a484db80a0a0",
      "ancestry": [
        "Retired Decision History: Work State",
        "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
        "0027 Consumer Audit",
        "0027 Audit 4 Runner Consumers"
      ],
      "text": "| File:line | Vai trò | Đổi? |\n|---|---|---|\n| `src/runner/loop.mjs:336,352,381,383` | Check `status !== 'doing'`, resolve crash-reclaim (`doing → blocked`) | Đoạn đầu — domain-owned |\n| `src/runner/loop.mjs:546,598` | `status: 'todo'` mặc định item mới do runner tự sinh (discovered-from) | Đoạn đầu — domain-owned |\n| `src/runner/loop.mjs:720,729,738` | `doing → awaiting-approval`, outcome `'awaiting-approval'` (goal-check pass) | Đoạn đầu — domain-owned |\n| `src/runner/loop.mjs:797-798,1060` | `doing → blocked` (verify-fail/anti-loop trip) | Đoạn đầu — domain-owned |\n| `src/runner/loop.mjs:976,996` | Check `item.stage === clarifyStage/decomposeStage && item.status === 'todo'` — cổng phối `stage` × `status` để chọn dispatch | **Điểm giao thoa 2 trục** — `stage` đã domain-owned (phần cũ vẫn đúng phần này), `status` literal `'todo'` ở đây cần đổi sang category `todo` để domain khác không bị lệch |\n| `src/runner/anti-loop.mjs:59` | Đếm `event.payload.to === 'doing'` cho visit-count chống lặp | Đoạn đầu — domain-owned |\n| `src/runner/claim-port.mjs:44,204-261` | `take` verb: `'todo'`/`'blocked'` (branch-take) → `'doing'` | Đoạn đầu — domain-owned |\n| `src/runner/github-adapter.mjs:56,90,106,123,150,179` | `outcome: 'blocked'` (disposition, TỪ VỰNG DÙNG CHUNG với `status` per `0024`) khi `gh` thất bại | Đoạn đầu (disposition-side) — cần đồng bộ cùng lúc với `status`, đúng bài học `0024` (đổi 1 nơi bỏ nơi kia tái tạo ambiguity) |\n| `src/runner/promote-engine.mjs:79` | `outcome: 'blocked'` | Như trên |\n| `src/runner/recovery.mjs:131,133` | Crash-recovery resolve `to: 'awaiting-approval'` / `to: 'blocked'` | Đoạn đầu — domain-owned |"
    }
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_4fceb5ca59ea256ccd77c0975d3576e1"
}
```

## Entry claim_f1507b5008c678f9474202706e018774

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_f1507b5008c678f9474202706e018774",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "b-decisions-second",
  "before": {
    "claimId": "claim_f1507b5008c678f9474202706e018774",
    "sourceUnitDigest": "80901672ceab8f8c",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "0027-audit-5-other-domain-agnostic-mechanisms",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Source H5 \"5. Cơ chế domain-agnostic khác\" is carried as H4 \"0027 Audit 5 Other Domain-Agnostic Mechanisms\"; title and level changed.",
    "reviewedBy": "independent reviewer (review-b-decisions-second)",
    "reviewedAt": "2026-10-07",
    "targetUnitDigest": "42d14b107b6ba2a390f6c7881ba8471c"
  },
  "currentDecision": {
    "claimId": "claim_f1507b5008c678f9474202706e018774",
    "sourceUnitDigest": "80901672ceab8f8c",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "0027-audit-5-other-domain-agnostic-mechanisms",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "Source H5 \"5. Cơ chế domain-agnostic khác\" is carried as H4 \"0027 Audit 5 Other Domain-Agnostic Mechanisms\"; title and level changed. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
    "targetUnitDigest": "42d14b107b6ba2a390f6c7881ba8471c91817a24674e7eae6f05ff917d296692",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Consumer Audit"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/specs/work-state.md",
    "unitDigest": "f2fa109b8ab2d82a29e6ba3c6db6307c7165581942aff5511e9f545bc34f6e42",
    "identityFingerprint": "e649484f0cd2401428bfa9ab67df1cd02aa5e267db336aa56834159b3ef60e5c",
    "claimId": "claim_f1507b5008c678f9474202706e018774",
    "sourceAnchor": "5-cơ-chế-domain-agnostic-khác-được-discussionmd-liệt-tường-minh",
    "unitKind": "heading",
    "sourceUnitDigest": "80901672ceab8f8cd67de403bda21b3525f9f208c1e723ebcb6fbac040c47bec",
    "claimKind": "specification",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "heading",
      "level": 5,
      "title": "5. Cơ chế domain-agnostic khác (được DISCUSSION.md liệt tường minh)",
      "anchor": "5-cơ-chế-domain-agnostic-khác-được-discussionmd-liệt-tường-minh",
      "githubAnchor": "5-cơ-chế-domain-agnostic-khác-được-discussionmd-liệt-tường-minh",
      "stableAnchor": "h-8593c1af47a3",
      "startLine": 2062,
      "endLine": 2062,
      "textDigest": "80901672ceab8f8cd67de403bda21b3525f9f208c1e723ebcb6fbac040c47bec",
      "sample": "5. Cơ chế domain-agnostic khác (được DISCUSSION.md liệt tường minh)",
      "sectionPayloadDigest": "fa83039437009e5f88a38c2bc19014eb481d33e6f82c491aeee4e2b226bf5e6a",
      "followingBlockDigest": "fa83039437009e5f88a38c2bc19014eb481d33e6f82c491aeee4e2b226bf5e6a",
      "identityFingerprint": "e649484f0cd2401428bfa9ab67df1cd02aa5e267db336aa56834159b3ef60e5c",
      "ancestry": [
        "0002 — Mô hình việc phẳng",
        "0027 — Domain sở hữu vocabulary/transition status đoạn TRƯỚC `delivered` (supersede base-workflow-model)",
        "Audit: mọi consumer thật của `status-fsm.mjs`/`STATUSES`/`TRANSITIONS`/literal status hôm nay"
      ],
      "text": "##### 5. Cơ chế domain-agnostic khác (được DISCUSSION.md liệt tường minh)",
      "sectionText": "##### 5. Cơ chế domain-agnostic khác (được DISCUSSION.md liệt tường minh)\n\n| File:line | Vai trò | Đổi? |\n|---|---|---|\n| `src/state/retro-pool.mjs:12,21` | `isRetrospectiveReady`: `item.status === 'retrospective'` literal | **KHÔNG đổi — xác nhận trực tiếp** (\"`retro-pool.mjs`'s literal `status === 'retrospective'` đúng mãi mãi, không cần đổi\") |\n| `src/intake/discovery.mjs:128,649,651,674-690` | `statusAtAsk`/ask-answer gate đọc `work.status` (`todo`/`doing`/`awaiting-human`) để resume đúng chỗ | Đoạn đầu — domain-owned; cơ chế bản thân domain-agnostic (mirror `status-fsm.mjs`'s async-human-gate), nên về sau nên đọc category thay vì literal 3 tên này |\n| `docs/reference/triage-table-columns.md:18` | Bảng cột hiển thị CLI liệt kê CHỈ 7 status cũ (`todo`/`doing`/`blocked`/`awaiting-human`/`awaiting-approval`/`done`), \"rendered as-is\" — literal, đã lệch 10 status thật hôm nay (thiếu `delivered`/`retrospective`/`cleanup`/`wontfix`) | **Gap có thật, ĐỘC LẬP với quyết định category** (DISCUSSION.md §3 #6) — cần sửa dù thiết kế category chốt kiểu gì; hiển thị \"as-is\" hôm nay đã ngầm giả định 1 domain, sẽ hiện sai khi domain khác dùng nhãn khác cho cùng category |\n| `packages/herdr-fgos-common/rust/src/fgos.rs:46,101,110,203-272` | Tiến trình Rust NGOÀI runtime Node — parse `fgos list --all --json` stdout, lọc `item.status == \"doing\" \\|\\| item.status == \"awaiting-approval\"` (tsk-4vo) để hiển thị pane \"in-process\" | **Consumer NGOÀI biên `src/`/`bin/`, qua ranh giới CLI/JSON** — domain-owned, đọc literal string coding hôm nay; nếu domain khác đổi nhãn 2 status này, `herdr-dashboard` vỡ ngầm trừ khi tự đọc `statusCategory` thay literal — phải liệt vào backlog migrate-consumer của `tsk-38t-3` (consumer-migration), không chỉ audit mã nguồn `.mjs` |"
    }
  },
  "currentTarget": {
    "unitKind": "heading",
    "level": 4,
    "title": "0027 Audit 5 Other Domain-Agnostic Mechanisms",
    "anchor": "0027-audit-5-other-domain-agnostic-mechanisms",
    "githubAnchor": "0027-audit-5-other-domain-agnostic-mechanisms",
    "stableAnchor": "h-d291ba168047",
    "startLine": 719,
    "endLine": 719,
    "textDigest": "42d14b107b6ba2a390f6c7881ba8471c91817a24674e7eae6f05ff917d296692",
    "sample": "0027 Audit 5 Other Domain-Agnostic Mechanisms",
    "sectionPayloadDigest": "fa83039437009e5f88a38c2bc19014eb481d33e6f82c491aeee4e2b226bf5e6a",
    "followingBlockDigest": "fa83039437009e5f88a38c2bc19014eb481d33e6f82c491aeee4e2b226bf5e6a",
    "identityFingerprint": "819bc9680ae770d352bd568a713a30f637bdddf816c79b3a97f6e6231ae981d0",
    "ancestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Consumer Audit"
    ],
    "text": "#### 0027 Audit 5 Other Domain-Agnostic Mechanisms",
    "sectionText": "#### 0027 Audit 5 Other Domain-Agnostic Mechanisms\n\n| File:line | Vai trò | Đổi? |\n|---|---|---|\n| `src/state/retro-pool.mjs:12,21` | `isRetrospectiveReady`: `item.status === 'retrospective'` literal | **KHÔNG đổi — xác nhận trực tiếp** (\"`retro-pool.mjs`'s literal `status === 'retrospective'` đúng mãi mãi, không cần đổi\") |\n| `src/intake/discovery.mjs:128,649,651,674-690` | `statusAtAsk`/ask-answer gate đọc `work.status` (`todo`/`doing`/`awaiting-human`) để resume đúng chỗ | Đoạn đầu — domain-owned; cơ chế bản thân domain-agnostic (mirror `status-fsm.mjs`'s async-human-gate), nên về sau nên đọc category thay vì literal 3 tên này |\n| `docs/reference/triage-table-columns.md:18` | Bảng cột hiển thị CLI liệt kê CHỈ 7 status cũ (`todo`/`doing`/`blocked`/`awaiting-human`/`awaiting-approval`/`done`), \"rendered as-is\" — literal, đã lệch 10 status thật hôm nay (thiếu `delivered`/`retrospective`/`cleanup`/`wontfix`) | **Gap có thật, ĐỘC LẬP với quyết định category** (DISCUSSION.md §3 #6) — cần sửa dù thiết kế category chốt kiểu gì; hiển thị \"as-is\" hôm nay đã ngầm giả định 1 domain, sẽ hiện sai khi domain khác dùng nhãn khác cho cùng category |\n| `packages/herdr-fgos-common/rust/src/fgos.rs:46,101,110,203-272` | Tiến trình Rust NGOÀI runtime Node — parse `fgos list --all --json` stdout, lọc `item.status == \"doing\" \\|\\| item.status == \"awaiting-approval\"` (tsk-4vo) để hiển thị pane \"in-process\" | **Consumer NGOÀI biên `src/`/`bin/`, qua ranh giới CLI/JSON** — domain-owned, đọc literal string coding hôm nay; nếu domain khác đổi nhãn 2 status này, `herdr-dashboard` vỡ ngầm trừ khi tự đọc `statusCategory` thay literal — phải liệt vào backlog migrate-consumer của `tsk-38t-3` (consumer-migration), không chỉ audit mã nguồn `.mjs` |"
  },
  "sourceTargetDigestsUnequal": true,
  "classObservation": {
    "class": "Judgment",
    "reason": "no target digest match",
    "targetUnit": null
  },
  "mechanicalRequired": true,
  "deepRequired": true,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_f1507b5008c678f9474202706e018774"
}
```

## Entry claim_042b85c001dab92b6ae561f89eac6337

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_042b85c001dab92b6ae561f89eac6337",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "b-decisions-second",
  "before": {
    "claimId": "claim_042b85c001dab92b6ae561f89eac6337",
    "sourceUnitDigest": "fa83039437009e5f",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-81",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Audit 5 table of other domain-agnostic mechanisms; carried verbatim into block 81 (located suggestion block 76 was a first-line collision).",
    "reviewedBy": "independent reviewer (review-b-decisions-second)",
    "reviewedAt": "2026-10-07",
    "targetUnitDigest": "fa83039437009e5f88a38c2bc19014eb"
  },
  "currentDecision": {
    "claimId": "claim_042b85c001dab92b6ae561f89eac6337",
    "sourceUnitDigest": "fa83039437009e5f",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-81",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "Audit 5 table of other domain-agnostic mechanisms; carried verbatim into block 81 (located suggestion block 76 was a first-line collision). L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
    "targetUnitDigest": "fa83039437009e5f88a38c2bc19014eb481d33e6f82c491aeee4e2b226bf5e6a",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Consumer Audit",
      "0027 Audit 5 Other Domain-Agnostic Mechanisms"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/specs/work-state.md",
    "unitDigest": "f0115848472a403f971c3403524291369afa16e25d54c873d9a5f0bff557e1f5",
    "identityFingerprint": "f0115848472a403f971c3403524291369afa16e25d54c873d9a5f0bff557e1f5",
    "claimId": "claim_042b85c001dab92b6ae561f89eac6337",
    "sourceAnchor": "unheaded-block-191",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "fa83039437009e5f88a38c2bc19014eb481d33e6f82c491aeee4e2b226bf5e6a",
    "claimKind": "specification",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-191",
      "githubAnchor": "unheaded-block-191",
      "stableAnchor": "unheaded-block-191",
      "title": "Unheaded block 191",
      "startLine": 2064,
      "endLine": 2069,
      "textDigest": "fa83039437009e5f88a38c2bc19014eb481d33e6f82c491aeee4e2b226bf5e6a",
      "sample": "| File:line | Vai trò | Đổi? |\n|---|---|---|\n| `src/state/retro-pool.mjs:12,21` | `isRetrospectiveReady`: `item.status === 'retrospective'` literal | **KHÔNG đổi — xác nhận trực ti",
      "identityFingerprint": "f0115848472a403f971c3403524291369afa16e25d54c873d9a5f0bff557e1f5",
      "ancestry": [
        "0002 — Mô hình việc phẳng",
        "0027 — Domain sở hữu vocabulary/transition status đoạn TRƯỚC `delivered` (supersede base-workflow-model)",
        "Audit: mọi consumer thật của `status-fsm.mjs`/`STATUSES`/`TRANSITIONS`/literal status hôm nay",
        "5. Cơ chế domain-agnostic khác (được DISCUSSION.md liệt tường minh)"
      ],
      "text": "| File:line | Vai trò | Đổi? |\n|---|---|---|\n| `src/state/retro-pool.mjs:12,21` | `isRetrospectiveReady`: `item.status === 'retrospective'` literal | **KHÔNG đổi — xác nhận trực tiếp** (\"`retro-pool.mjs`'s literal `status === 'retrospective'` đúng mãi mãi, không cần đổi\") |\n| `src/intake/discovery.mjs:128,649,651,674-690` | `statusAtAsk`/ask-answer gate đọc `work.status` (`todo`/`doing`/`awaiting-human`) để resume đúng chỗ | Đoạn đầu — domain-owned; cơ chế bản thân domain-agnostic (mirror `status-fsm.mjs`'s async-human-gate), nên về sau nên đọc category thay vì literal 3 tên này |\n| `docs/reference/triage-table-columns.md:18` | Bảng cột hiển thị CLI liệt kê CHỈ 7 status cũ (`todo`/`doing`/`blocked`/`awaiting-human`/`awaiting-approval`/`done`), \"rendered as-is\" — literal, đã lệch 10 status thật hôm nay (thiếu `delivered`/`retrospective`/`cleanup`/`wontfix`) | **Gap có thật, ĐỘC LẬP với quyết định category** (DISCUSSION.md §3 #6) — cần sửa dù thiết kế category chốt kiểu gì; hiển thị \"as-is\" hôm nay đã ngầm giả định 1 domain, sẽ hiện sai khi domain khác dùng nhãn khác cho cùng category |\n| `packages/herdr-fgos-common/rust/src/fgos.rs:46,101,110,203-272` | Tiến trình Rust NGOÀI runtime Node — parse `fgos list --all --json` stdout, lọc `item.status == \"doing\" \\|\\| item.status == \"awaiting-approval\"` (tsk-4vo) để hiển thị pane \"in-process\" | **Consumer NGOÀI biên `src/`/`bin/`, qua ranh giới CLI/JSON** — domain-owned, đọc literal string coding hôm nay; nếu domain khác đổi nhãn 2 status này, `herdr-dashboard` vỡ ngầm trừ khi tự đọc `statusCategory` thay literal — phải liệt vào backlog migrate-consumer của `tsk-38t-3` (consumer-migration), không chỉ audit mã nguồn `.mjs` |"
    }
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-81",
    "githubAnchor": "unheaded-block-81",
    "stableAnchor": "unheaded-block-81",
    "title": "Unheaded block 81",
    "startLine": 721,
    "endLine": 726,
    "textDigest": "fa83039437009e5f88a38c2bc19014eb481d33e6f82c491aeee4e2b226bf5e6a",
    "sample": "| File:line | Vai trò | Đổi? |\n|---|---|---|\n| `src/state/retro-pool.mjs:12,21` | `isRetrospectiveReady`: `item.status === 'retrospective'` literal | **KHÔNG đổi — xác nhận trực ti",
    "identityFingerprint": "f0115848472a403f971c3403524291369afa16e25d54c873d9a5f0bff557e1f5",
    "ancestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Consumer Audit",
      "0027 Audit 5 Other Domain-Agnostic Mechanisms"
    ],
    "text": "| File:line | Vai trò | Đổi? |\n|---|---|---|\n| `src/state/retro-pool.mjs:12,21` | `isRetrospectiveReady`: `item.status === 'retrospective'` literal | **KHÔNG đổi — xác nhận trực tiếp** (\"`retro-pool.mjs`'s literal `status === 'retrospective'` đúng mãi mãi, không cần đổi\") |\n| `src/intake/discovery.mjs:128,649,651,674-690` | `statusAtAsk`/ask-answer gate đọc `work.status` (`todo`/`doing`/`awaiting-human`) để resume đúng chỗ | Đoạn đầu — domain-owned; cơ chế bản thân domain-agnostic (mirror `status-fsm.mjs`'s async-human-gate), nên về sau nên đọc category thay vì literal 3 tên này |\n| `docs/reference/triage-table-columns.md:18` | Bảng cột hiển thị CLI liệt kê CHỈ 7 status cũ (`todo`/`doing`/`blocked`/`awaiting-human`/`awaiting-approval`/`done`), \"rendered as-is\" — literal, đã lệch 10 status thật hôm nay (thiếu `delivered`/`retrospective`/`cleanup`/`wontfix`) | **Gap có thật, ĐỘC LẬP với quyết định category** (DISCUSSION.md §3 #6) — cần sửa dù thiết kế category chốt kiểu gì; hiển thị \"as-is\" hôm nay đã ngầm giả định 1 domain, sẽ hiện sai khi domain khác dùng nhãn khác cho cùng category |\n| `packages/herdr-fgos-common/rust/src/fgos.rs:46,101,110,203-272` | Tiến trình Rust NGOÀI runtime Node — parse `fgos list --all --json` stdout, lọc `item.status == \"doing\" \\|\\| item.status == \"awaiting-approval\"` (tsk-4vo) để hiển thị pane \"in-process\" | **Consumer NGOÀI biên `src/`/`bin/`, qua ranh giới CLI/JSON** — domain-owned, đọc literal string coding hôm nay; nếu domain khác đổi nhãn 2 status này, `herdr-dashboard` vỡ ngầm trừ khi tự đọc `statusCategory` thay literal — phải liệt vào backlog migrate-consumer của `tsk-38t-3` (consumer-migration), không chỉ audit mã nguồn `.mjs` |"
  },
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Weak-exact",
    "reason": "ancestor headings differ; document exact share below one half",
    "targetUnit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-81",
      "githubAnchor": "unheaded-block-81",
      "stableAnchor": "unheaded-block-81",
      "title": "Unheaded block 81",
      "startLine": 721,
      "endLine": 726,
      "textDigest": "fa83039437009e5f88a38c2bc19014eb481d33e6f82c491aeee4e2b226bf5e6a",
      "sample": "| File:line | Vai trò | Đổi? |\n|---|---|---|\n| `src/state/retro-pool.mjs:12,21` | `isRetrospectiveReady`: `item.status === 'retrospective'` literal | **KHÔNG đổi — xác nhận trực ti",
      "identityFingerprint": "f0115848472a403f971c3403524291369afa16e25d54c873d9a5f0bff557e1f5",
      "ancestry": [
        "Retired Decision History: Work State",
        "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
        "0027 Consumer Audit",
        "0027 Audit 5 Other Domain-Agnostic Mechanisms"
      ],
      "text": "| File:line | Vai trò | Đổi? |\n|---|---|---|\n| `src/state/retro-pool.mjs:12,21` | `isRetrospectiveReady`: `item.status === 'retrospective'` literal | **KHÔNG đổi — xác nhận trực tiếp** (\"`retro-pool.mjs`'s literal `status === 'retrospective'` đúng mãi mãi, không cần đổi\") |\n| `src/intake/discovery.mjs:128,649,651,674-690` | `statusAtAsk`/ask-answer gate đọc `work.status` (`todo`/`doing`/`awaiting-human`) để resume đúng chỗ | Đoạn đầu — domain-owned; cơ chế bản thân domain-agnostic (mirror `status-fsm.mjs`'s async-human-gate), nên về sau nên đọc category thay vì literal 3 tên này |\n| `docs/reference/triage-table-columns.md:18` | Bảng cột hiển thị CLI liệt kê CHỈ 7 status cũ (`todo`/`doing`/`blocked`/`awaiting-human`/`awaiting-approval`/`done`), \"rendered as-is\" — literal, đã lệch 10 status thật hôm nay (thiếu `delivered`/`retrospective`/`cleanup`/`wontfix`) | **Gap có thật, ĐỘC LẬP với quyết định category** (DISCUSSION.md §3 #6) — cần sửa dù thiết kế category chốt kiểu gì; hiển thị \"as-is\" hôm nay đã ngầm giả định 1 domain, sẽ hiện sai khi domain khác dùng nhãn khác cho cùng category |\n| `packages/herdr-fgos-common/rust/src/fgos.rs:46,101,110,203-272` | Tiến trình Rust NGOÀI runtime Node — parse `fgos list --all --json` stdout, lọc `item.status == \"doing\" \\|\\| item.status == \"awaiting-approval\"` (tsk-4vo) để hiển thị pane \"in-process\" | **Consumer NGOÀI biên `src/`/`bin/`, qua ranh giới CLI/JSON** — domain-owned, đọc literal string coding hôm nay; nếu domain khác đổi nhãn 2 status này, `herdr-dashboard` vỡ ngầm trừ khi tự đọc `statusCategory` thay literal — phải liệt vào backlog migrate-consumer của `tsk-38t-3` (consumer-migration), không chỉ audit mã nguồn `.mjs` |"
    }
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_042b85c001dab92b6ae561f89eac6337"
}
```

## Entry claim_3fbb7ac76d27f06cc8e095a1d0e6b88e

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_3fbb7ac76d27f06cc8e095a1d0e6b88e",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "b-decisions-second",
  "before": {
    "claimId": "claim_3fbb7ac76d27f06cc8e095a1d0e6b88e",
    "sourceUnitDigest": "a2754368a8483a13",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "0027-audit-6-adjacent-gaps",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Source H5 \"6. Gap liên quan ...\" is carried as H4 \"0027 Audit 6 Adjacent Gaps\"; title and level changed.",
    "reviewedBy": "independent reviewer (review-b-decisions-second)",
    "reviewedAt": "2026-10-07",
    "targetUnitDigest": "379c5e08a01f354caaa42087399545a3"
  },
  "currentDecision": {
    "claimId": "claim_3fbb7ac76d27f06cc8e095a1d0e6b88e",
    "sourceUnitDigest": "a2754368a8483a13",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "0027-audit-6-adjacent-gaps",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "Source H5 \"6. Gap liên quan ...\" is carried as H4 \"0027 Audit 6 Adjacent Gaps\"; title and level changed. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
    "targetUnitDigest": "379c5e08a01f354caaa42087399545a3e49c45edece199864baa00f02e0a7bbc",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Consumer Audit"
    ],
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried."
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/specs/work-state.md",
    "unitDigest": "a9909d31dfa471e19ace36ccb564b65da61a8e61fb6ee7791231d51c4cfbce28",
    "identityFingerprint": "478d13c9962601eb2aaeddf8c803d16fcb47d872498cb6ba2d57f85b1cff31af",
    "claimId": "claim_3fbb7ac76d27f06cc8e095a1d0e6b88e",
    "sourceAnchor": "6-gap-liên-quan-nhưng-không-phải-phạm-vi-audit-status-literal-ghi-nhận-để-không-lặp-lại-công-sức",
    "unitKind": "heading",
    "sourceUnitDigest": "a2754368a8483a13afd1ca546a21025987ca1532c56e60f9c1d2634630716325",
    "claimKind": "specification",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "heading",
      "level": 5,
      "title": "6. Gap liên quan nhưng KHÔNG phải phạm vi audit status literal (ghi nhận để không lặp lại công sức)",
      "anchor": "6-gap-liên-quan-nhưng-không-phải-phạm-vi-audit-status-literal-ghi-nhận-để-không-lặp-lại-công-sức",
      "githubAnchor": "6-gap-liên-quan-nhưng-không-phải-phạm-vi-audit-status-literal-ghi-nhận-để-không-lặp-lại-công-sức",
      "stableAnchor": "h-a388ddbd5da4",
      "startLine": 2071,
      "endLine": 2071,
      "textDigest": "a2754368a8483a13afd1ca546a21025987ca1532c56e60f9c1d2634630716325",
      "sample": "6. Gap liên quan nhưng KHÔNG phải phạm vi audit status literal (ghi nhận để không lặp lại công sức)",
      "sectionPayloadDigest": "d398e694ec2837bbe5052cfea277526dd887042f9bcc401bea01cd63b3d42971",
      "followingBlockDigest": "d398e694ec2837bbe5052cfea277526dd887042f9bcc401bea01cd63b3d42971",
      "identityFingerprint": "478d13c9962601eb2aaeddf8c803d16fcb47d872498cb6ba2d57f85b1cff31af",
      "ancestry": [
        "0002 — Mô hình việc phẳng",
        "0027 — Domain sở hữu vocabulary/transition status đoạn TRƯỚC `delivered` (supersede base-workflow-model)",
        "Audit: mọi consumer thật của `status-fsm.mjs`/`STATUSES`/`TRANSITIONS`/literal status hôm nay"
      ],
      "text": "##### 6. Gap liên quan nhưng KHÔNG phải phạm vi audit status literal (ghi nhận để không lặp lại công sức)",
      "sectionText": "##### 6. Gap liên quan nhưng KHÔNG phải phạm vi audit status literal (ghi nhận để không lặp lại công sức)\n\n`fgos-coding-compounding` bị gọi CỨNG cho mọi item tới `retrospective`\n(`src/state/retro-pool.mjs`, `bin/fgos.mjs:1012,1088`) — không tham số hoá\ntheo domain. Đây là gap đã chốt hướng xử lý (mở rộng `skillMap` sang key\n`retrospective`) nhưng CHƯA code — thuộc `tsk-38t` decompose kế tiếp, không\nphải một \"consumer literal status\" cần audit ở record này."
    }
  },
  "currentTarget": {
    "unitKind": "heading",
    "level": 4,
    "title": "0027 Audit 6 Adjacent Gaps",
    "anchor": "0027-audit-6-adjacent-gaps",
    "githubAnchor": "0027-audit-6-adjacent-gaps",
    "stableAnchor": "h-9b5a76e9b9c6",
    "startLine": 728,
    "endLine": 728,
    "textDigest": "379c5e08a01f354caaa42087399545a3e49c45edece199864baa00f02e0a7bbc",
    "sample": "0027 Audit 6 Adjacent Gaps",
    "sectionPayloadDigest": "d398e694ec2837bbe5052cfea277526dd887042f9bcc401bea01cd63b3d42971",
    "followingBlockDigest": "d398e694ec2837bbe5052cfea277526dd887042f9bcc401bea01cd63b3d42971",
    "identityFingerprint": "08e1d7a72f09fe3839bffb43e173985e2dfa941ce507c117ff1745b18df09411",
    "ancestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Consumer Audit"
    ],
    "text": "#### 0027 Audit 6 Adjacent Gaps",
    "sectionText": "#### 0027 Audit 6 Adjacent Gaps\n\n`fgos-coding-compounding` bị gọi CỨNG cho mọi item tới `retrospective`\n(`src/state/retro-pool.mjs`, `bin/fgos.mjs:1012,1088`) — không tham số hoá\ntheo domain. Đây là gap đã chốt hướng xử lý (mở rộng `skillMap` sang key\n`retrospective`) nhưng CHƯA code — thuộc `tsk-38t` decompose kế tiếp, không\nphải một \"consumer literal status\" cần audit ở record này."
  },
  "sourceTargetDigestsUnequal": true,
  "classObservation": {
    "class": "Judgment",
    "reason": "no target digest match",
    "targetUnit": null
  },
  "mechanicalRequired": true,
  "deepRequired": true,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_3fbb7ac76d27f06cc8e095a1d0e6b88e"
}
```

## Entry claim_c5f9a98133b0fd6692dd0c7555d775e1

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_c5f9a98133b0fd6692dd0c7555d775e1",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "b-decisions-second",
  "before": {
    "claimId": "claim_c5f9a98133b0fd6692dd0c7555d775e1",
    "sourceUnitDigest": "d398e694ec2837bb",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-82",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Audit 6 note that fgos-coding-compounding is called hard for every retrospective item; carried verbatim.",
    "reviewedBy": "independent reviewer (review-b-decisions-second)",
    "reviewedAt": "2026-10-07",
    "targetUnitDigest": "d398e694ec2837bbe5052cfea277526d"
  },
  "currentDecision": {
    "claimId": "claim_c5f9a98133b0fd6692dd0c7555d775e1",
    "sourceUnitDigest": "d398e694ec2837bb",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-82",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "Audit 6 note that fgos-coding-compounding is called hard for every retrospective item; carried verbatim. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
    "targetUnitDigest": "d398e694ec2837bbe5052cfea277526dd887042f9bcc401bea01cd63b3d42971",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Consumer Audit",
      "0027 Audit 6 Adjacent Gaps"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/specs/work-state.md",
    "unitDigest": "e3d7c7d23dc2e736bfc45ceb01bd10119b0f8729081bd46cb0df0176de1f53a8",
    "identityFingerprint": "e3d7c7d23dc2e736bfc45ceb01bd10119b0f8729081bd46cb0df0176de1f53a8",
    "claimId": "claim_c5f9a98133b0fd6692dd0c7555d775e1",
    "sourceAnchor": "unheaded-block-192",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "d398e694ec2837bbe5052cfea277526dd887042f9bcc401bea01cd63b3d42971",
    "claimKind": "specification",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-192",
      "githubAnchor": "unheaded-block-192",
      "stableAnchor": "unheaded-block-192",
      "title": "Unheaded block 192",
      "startLine": 2073,
      "endLine": 2077,
      "textDigest": "d398e694ec2837bbe5052cfea277526dd887042f9bcc401bea01cd63b3d42971",
      "sample": "`fgos-coding-compounding` bị gọi CỨNG cho mọi item tới `retrospective`\n(`src/state/retro-pool.mjs`, `bin/fgos.mjs:1012,1088`) — không tham số hoá\ntheo domain. Đây là gap đã chốt hư",
      "identityFingerprint": "e3d7c7d23dc2e736bfc45ceb01bd10119b0f8729081bd46cb0df0176de1f53a8",
      "ancestry": [
        "0002 — Mô hình việc phẳng",
        "0027 — Domain sở hữu vocabulary/transition status đoạn TRƯỚC `delivered` (supersede base-workflow-model)",
        "Audit: mọi consumer thật của `status-fsm.mjs`/`STATUSES`/`TRANSITIONS`/literal status hôm nay",
        "6. Gap liên quan nhưng KHÔNG phải phạm vi audit status literal (ghi nhận để không lặp lại công sức)"
      ],
      "text": "`fgos-coding-compounding` bị gọi CỨNG cho mọi item tới `retrospective`\n(`src/state/retro-pool.mjs`, `bin/fgos.mjs:1012,1088`) — không tham số hoá\ntheo domain. Đây là gap đã chốt hướng xử lý (mở rộng `skillMap` sang key\n`retrospective`) nhưng CHƯA code — thuộc `tsk-38t` decompose kế tiếp, không\nphải một \"consumer literal status\" cần audit ở record này."
    }
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-82",
    "githubAnchor": "unheaded-block-82",
    "stableAnchor": "unheaded-block-82",
    "title": "Unheaded block 82",
    "startLine": 730,
    "endLine": 734,
    "textDigest": "d398e694ec2837bbe5052cfea277526dd887042f9bcc401bea01cd63b3d42971",
    "sample": "`fgos-coding-compounding` bị gọi CỨNG cho mọi item tới `retrospective`\n(`src/state/retro-pool.mjs`, `bin/fgos.mjs:1012,1088`) — không tham số hoá\ntheo domain. Đây là gap đã chốt hư",
    "identityFingerprint": "e3d7c7d23dc2e736bfc45ceb01bd10119b0f8729081bd46cb0df0176de1f53a8",
    "ancestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Consumer Audit",
      "0027 Audit 6 Adjacent Gaps"
    ],
    "text": "`fgos-coding-compounding` bị gọi CỨNG cho mọi item tới `retrospective`\n(`src/state/retro-pool.mjs`, `bin/fgos.mjs:1012,1088`) — không tham số hoá\ntheo domain. Đây là gap đã chốt hướng xử lý (mở rộng `skillMap` sang key\n`retrospective`) nhưng CHƯA code — thuộc `tsk-38t` decompose kế tiếp, không\nphải một \"consumer literal status\" cần audit ở record này."
  },
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Weak-exact",
    "reason": "ancestor headings differ; document exact share below one half",
    "targetUnit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-82",
      "githubAnchor": "unheaded-block-82",
      "stableAnchor": "unheaded-block-82",
      "title": "Unheaded block 82",
      "startLine": 730,
      "endLine": 734,
      "textDigest": "d398e694ec2837bbe5052cfea277526dd887042f9bcc401bea01cd63b3d42971",
      "sample": "`fgos-coding-compounding` bị gọi CỨNG cho mọi item tới `retrospective`\n(`src/state/retro-pool.mjs`, `bin/fgos.mjs:1012,1088`) — không tham số hoá\ntheo domain. Đây là gap đã chốt hư",
      "identityFingerprint": "e3d7c7d23dc2e736bfc45ceb01bd10119b0f8729081bd46cb0df0176de1f53a8",
      "ancestry": [
        "Retired Decision History: Work State",
        "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
        "0027 Consumer Audit",
        "0027 Audit 6 Adjacent Gaps"
      ],
      "text": "`fgos-coding-compounding` bị gọi CỨNG cho mọi item tới `retrospective`\n(`src/state/retro-pool.mjs`, `bin/fgos.mjs:1012,1088`) — không tham số hoá\ntheo domain. Đây là gap đã chốt hướng xử lý (mở rộng `skillMap` sang key\n`retrospective`) nhưng CHƯA code — thuộc `tsk-38t` decompose kế tiếp, không\nphải một \"consumer literal status\" cần audit ở record này."
    }
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_c5f9a98133b0fd6692dd0c7555d775e1"
}
```

## Entry claim_e2d3709ee991f35ec6153e7e84c46e2f

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_e2d3709ee991f35ec6153e7e84c46e2f",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "b-decisions-second",
  "before": {
    "claimId": "claim_e2d3709ee991f35ec6153e7e84c46e2f",
    "sourceUnitDigest": "d35b961952abd6b3",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "0027-consequences",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Source H4 \"Hệ quả\" of ADR 0027 is carried as H3 \"0027 Consequences\"; title differs, heading-only unit.",
    "reviewedBy": "independent reviewer (review-b-decisions-second)",
    "reviewedAt": "2026-10-07",
    "targetUnitDigest": "7729270993aaa029e4ceb8b643006703"
  },
  "currentDecision": {
    "claimId": "claim_e2d3709ee991f35ec6153e7e84c46e2f",
    "sourceUnitDigest": "d35b961952abd6b3",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "0027-consequences",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "Source H4 \"Hệ quả\" of ADR 0027 is carried as H3 \"0027 Consequences\"; title differs, heading-only unit. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
    "targetUnitDigest": "7729270993aaa029e4ceb8b64300670303de6930bf6412bd3c8097b7dac134ba",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/specs/work-state.md",
    "unitDigest": "650bb44d4145ed0692de308ac884f2247cc150116fe9b7dca58b5320648be1b3",
    "identityFingerprint": "f73a2c6c3d4f10d28119ea7e85415203913b60440d5a4b070401ff5a4432665e",
    "claimId": "claim_e2d3709ee991f35ec6153e7e84c46e2f",
    "sourceAnchor": "hệ-quả-10",
    "unitKind": "heading",
    "sourceUnitDigest": "d35b961952abd6b36b76ada556f74a2030bcfe670cbe03c89c6005d0ca313a2c",
    "claimKind": "specification",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "heading",
      "level": 4,
      "title": "Hệ quả",
      "anchor": "hệ-quả-10",
      "githubAnchor": "hệ-quả-10",
      "stableAnchor": "h-35a3070cc17d",
      "startLine": 2079,
      "endLine": 2079,
      "textDigest": "d35b961952abd6b36b76ada556f74a2030bcfe670cbe03c89c6005d0ca313a2c",
      "sample": "Hệ quả",
      "sectionPayloadDigest": "e12e5b17bd0afd2f30ca5edac6ad58cfea0a5dce8eab8429d40b6eb688a3eba0",
      "followingBlockDigest": "e12e5b17bd0afd2f30ca5edac6ad58cfea0a5dce8eab8429d40b6eb688a3eba0",
      "identityFingerprint": "f73a2c6c3d4f10d28119ea7e85415203913b60440d5a4b070401ff5a4432665e",
      "ancestry": [
        "0002 — Mô hình việc phẳng",
        "0027 — Domain sở hữu vocabulary/transition status đoạn TRƯỚC `delivered` (supersede base-workflow-model)"
      ],
      "text": "#### Hệ quả",
      "sectionText": "#### Hệ quả\n\n- **Record này là tiền điều kiện bắt buộc cho `tsk-38t-2` đến `tsk-38t-7`**\n  (schema `statusCategory`/`STATUS_CATEGORIES`, migration backfill,\n  consumer-migration theo audit ở trên, `skillMap.retrospective`,\n  `domainFields`/`fieldSchema`, domain giả lập thứ hai THẬT có bảng\n  transition khác coding để chứng minh thiết kế) — **không phần nào trong số\n  đó được bắt đầu code trước khi file này tồn tại**, đúng yêu cầu acceptance\n  gốc của `tsk-38t` (\"cần decision record mới đúng khuôn 0024 supersede 0006,\n  viết TRƯỚC khi code\").\n- `base-workflow-model` (`2ae492d8`) KHÔNG bị sửa tại chỗ — nguyên văn\n  của nó vẫn đúng lịch sử; record này chỉ supersede đúng phạm vi status/domain\n  đã nêu, không phải toàn bộ ngữ cảnh `base-workflow-model` (S1/S2 domain\n  registry cho `stage` vẫn đứng nguyên, không bị chạm).\n- `RESOLVED_STATUSES` (`frontier.mjs:186`) và mọi consumer của nó (§2 ở trên)\n  là điểm rủi ro tập trung nhất khi hiện thực hoá — nó là tập string viết tay\n  DUY NHẤT hôm nay trộn cả 2 nhóm đầu/đuôi; sửa sai chỗ này lan ra ít nhất 7\n  file khác (`graph-metrics.mjs`, `graph-harness.mjs`, `drift-status.mjs`,\n  `impact.mjs`, `claim-port.mjs`, `entropy.mjs`, `bin/fgos.mjs`) chỉ vì chúng\n  gọi `.has` trên đúng 1 Set dùng chung.\n  `entropy.mjs`/`bin/fgos.mjs`'s `FINAL_STATUSES` cục bộ là 2 bản sao ĐÃ LỆCH\n  nghĩa nhau (khác tập con) — cần rà đồng thời, không chỉ theo dấu\n  `RESOLVED_STATUSES`.\n- `packages/herdr-fgos-common/rust/src/fgos.rs` xác nhận việc audit \"consumer của status\" không\n  dừng ở biên `src/`/`bin/` của repo Node — bất kỳ tiến trình ngoài nào đọc\n  `fgos list --all --json` cũng là 1 consumer thật của vocabulary status, cần\n  đưa vào phạm vi khi `tsk-38t-3` (consumer-migration) thực thi.\n- `docs/reference/triage-table-columns.md` lệch code (7 vs 10 status thật) là\n  gap có thật nhưng ĐỘC LẬP khỏi quyết định category — không chặn record này,\n  nhưng nên sửa cùng đợt `tsk-38t-3` để tránh phải quét lại 2 lần."
    }
  },
  "currentTarget": {
    "unitKind": "heading",
    "level": 3,
    "title": "0027 Consequences",
    "anchor": "0027-consequences",
    "githubAnchor": "0027-consequences",
    "stableAnchor": "h-2090ddd0328b",
    "startLine": 736,
    "endLine": 736,
    "textDigest": "7729270993aaa029e4ceb8b64300670303de6930bf6412bd3c8097b7dac134ba",
    "sample": "0027 Consequences",
    "sectionPayloadDigest": "e12e5b17bd0afd2f30ca5edac6ad58cfea0a5dce8eab8429d40b6eb688a3eba0",
    "followingBlockDigest": "e12e5b17bd0afd2f30ca5edac6ad58cfea0a5dce8eab8429d40b6eb688a3eba0",
    "identityFingerprint": "dcd341101d3e6f2429063573f73b3709d73902e9f7937e0e04970c8cf3c9dfd3",
    "ancestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary"
    ],
    "text": "### 0027 Consequences",
    "sectionText": "### 0027 Consequences\n\n- **Record này là tiền điều kiện bắt buộc cho `tsk-38t-2` đến `tsk-38t-7`**\n  (schema `statusCategory`/`STATUS_CATEGORIES`, migration backfill,\n  consumer-migration theo audit ở trên, `skillMap.retrospective`,\n  `domainFields`/`fieldSchema`, domain giả lập thứ hai THẬT có bảng\n  transition khác coding để chứng minh thiết kế) — **không phần nào trong số\n  đó được bắt đầu code trước khi file này tồn tại**, đúng yêu cầu acceptance\n  gốc của `tsk-38t` (\"cần decision record mới đúng khuôn 0024 supersede 0006,\n  viết TRƯỚC khi code\").\n- `base-workflow-model` (`2ae492d8`) KHÔNG bị sửa tại chỗ — nguyên văn\n  của nó vẫn đúng lịch sử; record này chỉ supersede đúng phạm vi status/domain\n  đã nêu, không phải toàn bộ ngữ cảnh `base-workflow-model` (S1/S2 domain\n  registry cho `stage` vẫn đứng nguyên, không bị chạm).\n- `RESOLVED_STATUSES` (`frontier.mjs:186`) và mọi consumer của nó (§2 ở trên)\n  là điểm rủi ro tập trung nhất khi hiện thực hoá — nó là tập string viết tay\n  DUY NHẤT hôm nay trộn cả 2 nhóm đầu/đuôi; sửa sai chỗ này lan ra ít nhất 7\n  file khác (`graph-metrics.mjs`, `graph-harness.mjs`, `drift-status.mjs`,\n  `impact.mjs`, `claim-port.mjs`, `entropy.mjs`, `bin/fgos.mjs`) chỉ vì chúng\n  gọi `.has` trên đúng 1 Set dùng chung.\n  `entropy.mjs`/`bin/fgos.mjs`'s `FINAL_STATUSES` cục bộ là 2 bản sao ĐÃ LỆCH\n  nghĩa nhau (khác tập con) — cần rà đồng thời, không chỉ theo dấu\n  `RESOLVED_STATUSES`.\n- `packages/herdr-fgos-common/rust/src/fgos.rs` xác nhận việc audit \"consumer của status\" không\n  dừng ở biên `src/`/`bin/` của repo Node — bất kỳ tiến trình ngoài nào đọc\n  `fgos list --all --json` cũng là 1 consumer thật của vocabulary status, cần\n  đưa vào phạm vi khi `tsk-38t-3` (consumer-migration) thực thi.\n- `docs/reference/triage-table-columns.md` lệch code (7 vs 10 status thật) là\n  gap có thật nhưng ĐỘC LẬP khỏi quyết định category — không chặn record này,\n  nhưng nên sửa cùng đợt `tsk-38t-3` để tránh phải quét lại 2 lần."
  },
  "sourceTargetDigestsUnequal": true,
  "classObservation": {
    "class": "Judgment",
    "reason": "no target digest match",
    "targetUnit": null
  },
  "mechanicalRequired": true,
  "deepRequired": true,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_e2d3709ee991f35ec6153e7e84c46e2f"
}
```

## Entry claim_8eeec687713e79da23a9339df1179b60

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_8eeec687713e79da23a9339df1179b60",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "b-decisions-second",
  "before": {
    "claimId": "claim_8eeec687713e79da23a9339df1179b60",
    "sourceUnitDigest": "e12e5b17bd0afd2f",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-83",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "ADR 0027 consequences list (precondition for the multi-domain schema work and follow-ups); carried verbatim.",
    "reviewedBy": "independent reviewer (review-b-decisions-second)",
    "reviewedAt": "2026-10-07",
    "targetUnitDigest": "e12e5b17bd0afd2f30ca5edac6ad58cf"
  },
  "currentDecision": {
    "claimId": "claim_8eeec687713e79da23a9339df1179b60",
    "sourceUnitDigest": "e12e5b17bd0afd2f",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-83",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "ADR 0027 consequences list (precondition for the multi-domain schema work and follow-ups); carried verbatim. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
    "targetUnitDigest": "e12e5b17bd0afd2f30ca5edac6ad58cfea0a5dce8eab8429d40b6eb688a3eba0",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Consequences"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/specs/work-state.md",
    "unitDigest": "108dc1e528b0ddb7315f9915beb3bd2e9fc01958ad10f16c061a1cd20b7e69f2",
    "identityFingerprint": "108dc1e528b0ddb7315f9915beb3bd2e9fc01958ad10f16c061a1cd20b7e69f2",
    "claimId": "claim_8eeec687713e79da23a9339df1179b60",
    "sourceAnchor": "unheaded-block-193",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "e12e5b17bd0afd2f30ca5edac6ad58cfea0a5dce8eab8429d40b6eb688a3eba0",
    "claimKind": "contract",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-193",
      "githubAnchor": "unheaded-block-193",
      "stableAnchor": "unheaded-block-193",
      "title": "Unheaded block 193",
      "startLine": 2081,
      "endLine": 2108,
      "textDigest": "e12e5b17bd0afd2f30ca5edac6ad58cfea0a5dce8eab8429d40b6eb688a3eba0",
      "sample": "- **Record này là tiền điều kiện bắt buộc cho `tsk-38t-2` đến `tsk-38t-7`**\n  (schema `statusCategory`/`STATUS_CATEGORIES`, migration backfill,\n  consumer-migration theo audit ở tr",
      "identityFingerprint": "108dc1e528b0ddb7315f9915beb3bd2e9fc01958ad10f16c061a1cd20b7e69f2",
      "ancestry": [
        "0002 — Mô hình việc phẳng",
        "0027 — Domain sở hữu vocabulary/transition status đoạn TRƯỚC `delivered` (supersede base-workflow-model)",
        "Hệ quả"
      ],
      "text": "- **Record này là tiền điều kiện bắt buộc cho `tsk-38t-2` đến `tsk-38t-7`**\n  (schema `statusCategory`/`STATUS_CATEGORIES`, migration backfill,\n  consumer-migration theo audit ở trên, `skillMap.retrospective`,\n  `domainFields`/`fieldSchema`, domain giả lập thứ hai THẬT có bảng\n  transition khác coding để chứng minh thiết kế) — **không phần nào trong số\n  đó được bắt đầu code trước khi file này tồn tại**, đúng yêu cầu acceptance\n  gốc của `tsk-38t` (\"cần decision record mới đúng khuôn 0024 supersede 0006,\n  viết TRƯỚC khi code\").\n- `base-workflow-model` (`2ae492d8`) KHÔNG bị sửa tại chỗ — nguyên văn\n  của nó vẫn đúng lịch sử; record này chỉ supersede đúng phạm vi status/domain\n  đã nêu, không phải toàn bộ ngữ cảnh `base-workflow-model` (S1/S2 domain\n  registry cho `stage` vẫn đứng nguyên, không bị chạm).\n- `RESOLVED_STATUSES` (`frontier.mjs:186`) và mọi consumer của nó (§2 ở trên)\n  là điểm rủi ro tập trung nhất khi hiện thực hoá — nó là tập string viết tay\n  DUY NHẤT hôm nay trộn cả 2 nhóm đầu/đuôi; sửa sai chỗ này lan ra ít nhất 7\n  file khác (`graph-metrics.mjs`, `graph-harness.mjs`, `drift-status.mjs`,\n  `impact.mjs`, `claim-port.mjs`, `entropy.mjs`, `bin/fgos.mjs`) chỉ vì chúng\n  gọi `.has` trên đúng 1 Set dùng chung.\n  `entropy.mjs`/`bin/fgos.mjs`'s `FINAL_STATUSES` cục bộ là 2 bản sao ĐÃ LỆCH\n  nghĩa nhau (khác tập con) — cần rà đồng thời, không chỉ theo dấu\n  `RESOLVED_STATUSES`.\n- `packages/herdr-fgos-common/rust/src/fgos.rs` xác nhận việc audit \"consumer của status\" không\n  dừng ở biên `src/`/`bin/` của repo Node — bất kỳ tiến trình ngoài nào đọc\n  `fgos list --all --json` cũng là 1 consumer thật của vocabulary status, cần\n  đưa vào phạm vi khi `tsk-38t-3` (consumer-migration) thực thi.\n- `docs/reference/triage-table-columns.md` lệch code (7 vs 10 status thật) là\n  gap có thật nhưng ĐỘC LẬP khỏi quyết định category — không chặn record này,\n  nhưng nên sửa cùng đợt `tsk-38t-3` để tránh phải quét lại 2 lần."
    }
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-83",
    "githubAnchor": "unheaded-block-83",
    "stableAnchor": "unheaded-block-83",
    "title": "Unheaded block 83",
    "startLine": 738,
    "endLine": 765,
    "textDigest": "e12e5b17bd0afd2f30ca5edac6ad58cfea0a5dce8eab8429d40b6eb688a3eba0",
    "sample": "- **Record này là tiền điều kiện bắt buộc cho `tsk-38t-2` đến `tsk-38t-7`**\n  (schema `statusCategory`/`STATUS_CATEGORIES`, migration backfill,\n  consumer-migration theo audit ở tr",
    "identityFingerprint": "108dc1e528b0ddb7315f9915beb3bd2e9fc01958ad10f16c061a1cd20b7e69f2",
    "ancestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Consequences"
    ],
    "text": "- **Record này là tiền điều kiện bắt buộc cho `tsk-38t-2` đến `tsk-38t-7`**\n  (schema `statusCategory`/`STATUS_CATEGORIES`, migration backfill,\n  consumer-migration theo audit ở trên, `skillMap.retrospective`,\n  `domainFields`/`fieldSchema`, domain giả lập thứ hai THẬT có bảng\n  transition khác coding để chứng minh thiết kế) — **không phần nào trong số\n  đó được bắt đầu code trước khi file này tồn tại**, đúng yêu cầu acceptance\n  gốc của `tsk-38t` (\"cần decision record mới đúng khuôn 0024 supersede 0006,\n  viết TRƯỚC khi code\").\n- `base-workflow-model` (`2ae492d8`) KHÔNG bị sửa tại chỗ — nguyên văn\n  của nó vẫn đúng lịch sử; record này chỉ supersede đúng phạm vi status/domain\n  đã nêu, không phải toàn bộ ngữ cảnh `base-workflow-model` (S1/S2 domain\n  registry cho `stage` vẫn đứng nguyên, không bị chạm).\n- `RESOLVED_STATUSES` (`frontier.mjs:186`) và mọi consumer của nó (§2 ở trên)\n  là điểm rủi ro tập trung nhất khi hiện thực hoá — nó là tập string viết tay\n  DUY NHẤT hôm nay trộn cả 2 nhóm đầu/đuôi; sửa sai chỗ này lan ra ít nhất 7\n  file khác (`graph-metrics.mjs`, `graph-harness.mjs`, `drift-status.mjs`,\n  `impact.mjs`, `claim-port.mjs`, `entropy.mjs`, `bin/fgos.mjs`) chỉ vì chúng\n  gọi `.has` trên đúng 1 Set dùng chung.\n  `entropy.mjs`/`bin/fgos.mjs`'s `FINAL_STATUSES` cục bộ là 2 bản sao ĐÃ LỆCH\n  nghĩa nhau (khác tập con) — cần rà đồng thời, không chỉ theo dấu\n  `RESOLVED_STATUSES`.\n- `packages/herdr-fgos-common/rust/src/fgos.rs` xác nhận việc audit \"consumer của status\" không\n  dừng ở biên `src/`/`bin/` của repo Node — bất kỳ tiến trình ngoài nào đọc\n  `fgos list --all --json` cũng là 1 consumer thật của vocabulary status, cần\n  đưa vào phạm vi khi `tsk-38t-3` (consumer-migration) thực thi.\n- `docs/reference/triage-table-columns.md` lệch code (7 vs 10 status thật) là\n  gap có thật nhưng ĐỘC LẬP khỏi quyết định category — không chặn record này,\n  nhưng nên sửa cùng đợt `tsk-38t-3` để tránh phải quét lại 2 lần."
  },
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Weak-exact",
    "reason": "ancestor headings differ; document exact share below one half",
    "targetUnit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-83",
      "githubAnchor": "unheaded-block-83",
      "stableAnchor": "unheaded-block-83",
      "title": "Unheaded block 83",
      "startLine": 738,
      "endLine": 765,
      "textDigest": "e12e5b17bd0afd2f30ca5edac6ad58cfea0a5dce8eab8429d40b6eb688a3eba0",
      "sample": "- **Record này là tiền điều kiện bắt buộc cho `tsk-38t-2` đến `tsk-38t-7`**\n  (schema `statusCategory`/`STATUS_CATEGORIES`, migration backfill,\n  consumer-migration theo audit ở tr",
      "identityFingerprint": "108dc1e528b0ddb7315f9915beb3bd2e9fc01958ad10f16c061a1cd20b7e69f2",
      "ancestry": [
        "Retired Decision History: Work State",
        "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
        "0027 Consequences"
      ],
      "text": "- **Record này là tiền điều kiện bắt buộc cho `tsk-38t-2` đến `tsk-38t-7`**\n  (schema `statusCategory`/`STATUS_CATEGORIES`, migration backfill,\n  consumer-migration theo audit ở trên, `skillMap.retrospective`,\n  `domainFields`/`fieldSchema`, domain giả lập thứ hai THẬT có bảng\n  transition khác coding để chứng minh thiết kế) — **không phần nào trong số\n  đó được bắt đầu code trước khi file này tồn tại**, đúng yêu cầu acceptance\n  gốc của `tsk-38t` (\"cần decision record mới đúng khuôn 0024 supersede 0006,\n  viết TRƯỚC khi code\").\n- `base-workflow-model` (`2ae492d8`) KHÔNG bị sửa tại chỗ — nguyên văn\n  của nó vẫn đúng lịch sử; record này chỉ supersede đúng phạm vi status/domain\n  đã nêu, không phải toàn bộ ngữ cảnh `base-workflow-model` (S1/S2 domain\n  registry cho `stage` vẫn đứng nguyên, không bị chạm).\n- `RESOLVED_STATUSES` (`frontier.mjs:186`) và mọi consumer của nó (§2 ở trên)\n  là điểm rủi ro tập trung nhất khi hiện thực hoá — nó là tập string viết tay\n  DUY NHẤT hôm nay trộn cả 2 nhóm đầu/đuôi; sửa sai chỗ này lan ra ít nhất 7\n  file khác (`graph-metrics.mjs`, `graph-harness.mjs`, `drift-status.mjs`,\n  `impact.mjs`, `claim-port.mjs`, `entropy.mjs`, `bin/fgos.mjs`) chỉ vì chúng\n  gọi `.has` trên đúng 1 Set dùng chung.\n  `entropy.mjs`/`bin/fgos.mjs`'s `FINAL_STATUSES` cục bộ là 2 bản sao ĐÃ LỆCH\n  nghĩa nhau (khác tập con) — cần rà đồng thời, không chỉ theo dấu\n  `RESOLVED_STATUSES`.\n- `packages/herdr-fgos-common/rust/src/fgos.rs` xác nhận việc audit \"consumer của status\" không\n  dừng ở biên `src/`/`bin/` của repo Node — bất kỳ tiến trình ngoài nào đọc\n  `fgos list --all --json` cũng là 1 consumer thật của vocabulary status, cần\n  đưa vào phạm vi khi `tsk-38t-3` (consumer-migration) thực thi.\n- `docs/reference/triage-table-columns.md` lệch code (7 vs 10 status thật) là\n  gap có thật nhưng ĐỘC LẬP khỏi quyết định category — không chặn record này,\n  nhưng nên sửa cùng đợt `tsk-38t-3` để tránh phải quét lại 2 lần."
    }
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_8eeec687713e79da23a9339df1179b60"
}
```

## Entry claim_217bf9908c0941c13b1eaf2f7a2d9d64

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_217bf9908c0941c13b1eaf2f7a2d9d64",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "b-decisions-second",
  "before": {
    "claimId": "claim_217bf9908c0941c13b1eaf2f7a2d9d64",
    "sourceUnitDigest": "f617f1c06417c2f7",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "13-adr-0032-multi-role-team-harness",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Source H3 \"0032 — Multi-role Team Harness: trục role/holder ...\" is carried as H2 \"13. ADR 0032 Multi-Role Team Harness\"; title shortened and translated.",
    "reviewedBy": "independent reviewer (review-b-decisions-second)",
    "reviewedAt": "2026-10-07",
    "targetUnitDigest": "adc471524e7f457d3d74097885286fe9"
  },
  "currentDecision": {
    "claimId": "claim_217bf9908c0941c13b1eaf2f7a2d9d64",
    "sourceUnitDigest": "f617f1c06417c2f7",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "13-adr-0032-multi-role-team-harness",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "Source H3 \"0032 — Multi-role Team Harness: trục role/holder ...\" is carried as H2 \"13. ADR 0032 Multi-Role Team Harness\"; title shortened and translated. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
    "targetUnitDigest": "adc471524e7f457d3d74097885286fe95536a2bcb0db955d80faa15452aad116",
    "targetAncestry": [
      "Retired Decision History: Work State"
    ],
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried."
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/specs/work-state.md",
    "unitDigest": "f9c73be034311cf42fda32baa735adcaaabbb74484e6e743a945b286622cf83c",
    "identityFingerprint": "ca7f0b6fed4f8a343e1253f956db2736a6fbca2ef8a6d42030e13693f00e3030",
    "claimId": "claim_217bf9908c0941c13b1eaf2f7a2d9d64",
    "sourceAnchor": "0032-multi-role-team-harness-trục-roleholder-handoff-và-marketing-cockpit-absorption",
    "unitKind": "heading",
    "sourceUnitDigest": "f617f1c06417c2f7984c2c37a8b6d06c85bdc662faa1bb373adac1858eb519d8",
    "claimKind": "specification",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "heading",
      "level": 3,
      "title": "0032 — Multi-role Team Harness: trục role/holder, handoff, và marketing-cockpit absorption",
      "anchor": "0032-multi-role-team-harness-trục-roleholder-handoff-và-marketing-cockpit-absorption",
      "githubAnchor": "0032-multi-role-team-harness-trục-roleholder-handoff-và-marketing-cockpit-absorption",
      "stableAnchor": "h-e8d052d27e8b",
      "startLine": 2110,
      "endLine": 2110,
      "textDigest": "f617f1c06417c2f7984c2c37a8b6d06c85bdc662faa1bb373adac1858eb519d8",
      "sample": "0032 — Multi-role Team Harness: trục role/holder, handoff, và marketing-cockpit absorption",
      "sectionPayloadDigest": "6f54e9c73c49cc06bd93ba1401ddb0bdefda6e4c89e62bfc55be6fd092514bb6",
      "followingBlockDigest": "6f54e9c73c49cc06bd93ba1401ddb0bdefda6e4c89e62bfc55be6fd092514bb6",
      "identityFingerprint": "ca7f0b6fed4f8a343e1253f956db2736a6fbca2ef8a6d42030e13693f00e3030",
      "ancestry": [
        "0002 — Mô hình việc phẳng"
      ],
      "text": "### 0032 — Multi-role Team Harness: trục role/holder, handoff, và marketing-cockpit absorption",
      "sectionText": "### 0032 — Multi-role Team Harness: trục role/holder, handoff, và marketing-cockpit absorption\n\n> Bằng chứng distill của 24 vòng thảo luận (2026-08-15, item `tsk-2t9c`),\n> người dùng duyệt từng cụm qua các vòng và duyệt bản distill này ở vòng\n> 21 (mục Artifact-schema bổ sung ở vòng 24). Nguồn chi tiết: `docs/history/fgos-\n> marketing-domain-foundation/DISCUSSION.md` (Q&A log + §6 synthesis),\n> `CONTEXT.md` (bảng đầy đủ các quyết định), `plan.md` (spec 3\n> mảnh triển khai, chi tiết per-file).\n> Mỗi D-ID dưới đây có bản ghi máy tương ứng qua `fgos decision`\n> (event seq ghi kèm) — ba nguồn phải luôn khớp nhau. File này là bản\n> copy đã đóng dấu quyết định (nguồn sống, đầy đủ nhất vẫn là\n> `docs/history/fgos-marketing-domain-foundation/`)."
    }
  },
  "currentTarget": {
    "unitKind": "heading",
    "level": 2,
    "title": "13. ADR 0032 Multi-Role Team Harness",
    "anchor": "13-adr-0032-multi-role-team-harness",
    "githubAnchor": "13-adr-0032-multi-role-team-harness",
    "stableAnchor": "h-f3aee361fe3f",
    "startLine": 767,
    "endLine": 767,
    "textDigest": "adc471524e7f457d3d74097885286fe95536a2bcb0db955d80faa15452aad116",
    "sample": "13. ADR 0032 Multi-Role Team Harness",
    "sectionPayloadDigest": "6f54e9c73c49cc06bd93ba1401ddb0bdefda6e4c89e62bfc55be6fd092514bb6",
    "followingBlockDigest": "6f54e9c73c49cc06bd93ba1401ddb0bdefda6e4c89e62bfc55be6fd092514bb6",
    "identityFingerprint": "701200f8c1d0f2b90e96dbabc9e673a157050432db43323424f4b86921ac1a41",
    "ancestry": [
      "Retired Decision History: Work State"
    ],
    "text": "## 13. ADR 0032 Multi-Role Team Harness",
    "sectionText": "## 13. ADR 0032 Multi-Role Team Harness\n\n> Bằng chứng distill của 24 vòng thảo luận (2026-08-15, item `tsk-2t9c`),\n> người dùng duyệt từng cụm qua các vòng và duyệt bản distill này ở vòng\n> 21 (mục Artifact-schema bổ sung ở vòng 24). Nguồn chi tiết: `docs/history/fgos-\n> marketing-domain-foundation/DISCUSSION.md` (Q&A log + §6 synthesis),\n> `CONTEXT.md` (bảng đầy đủ các quyết định), `plan.md` (spec 3\n> mảnh triển khai, chi tiết per-file).\n> Mỗi D-ID dưới đây có bản ghi máy tương ứng qua `fgos decision`\n> (event seq ghi kèm) — ba nguồn phải luôn khớp nhau. File này là bản\n> copy đã đóng dấu quyết định (nguồn sống, đầy đủ nhất vẫn là\n> `docs/history/fgos-marketing-domain-foundation/`)."
  },
  "sourceTargetDigestsUnequal": true,
  "classObservation": {
    "class": "Judgment",
    "reason": "no target digest match",
    "targetUnit": null
  },
  "mechanicalRequired": true,
  "deepRequired": true,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_217bf9908c0941c13b1eaf2f7a2d9d64"
}
```

## Entry claim_63db75c2d22d1861c69845d62518ee60

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_63db75c2d22d1861c69845d62518ee60",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "b-decisions-second",
  "before": {
    "claimId": "claim_63db75c2d22d1861c69845d62518ee60",
    "sourceUnitDigest": "6f54e9c73c49cc06",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-84",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Distill-evidence blockquote opening ADR 0032 (24 discussion rounds, 2026-08-15); carried verbatim under the 0032 H2.",
    "reviewedBy": "independent reviewer (review-b-decisions-second)",
    "reviewedAt": "2026-10-07",
    "targetUnitDigest": "6f54e9c73c49cc06bd93ba1401ddb0bd"
  },
  "currentDecision": {
    "claimId": "claim_63db75c2d22d1861c69845d62518ee60",
    "sourceUnitDigest": "6f54e9c73c49cc06",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-84",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "Distill-evidence blockquote opening ADR 0032 (24 discussion rounds, 2026-08-15); carried verbatim under the 0032 H2. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
    "targetUnitDigest": "6f54e9c73c49cc06bd93ba1401ddb0bdefda6e4c89e62bfc55be6fd092514bb6",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "13. ADR 0032 Multi-Role Team Harness"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/specs/work-state.md",
    "unitDigest": "8b84949c87f3dbc2fce46968c9ce33008d4287ab0f58c7b0ec87f442532e4416",
    "identityFingerprint": "8b84949c87f3dbc2fce46968c9ce33008d4287ab0f58c7b0ec87f442532e4416",
    "claimId": "claim_63db75c2d22d1861c69845d62518ee60",
    "sourceAnchor": "unheaded-block-194",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "6f54e9c73c49cc06bd93ba1401ddb0bdefda6e4c89e62bfc55be6fd092514bb6",
    "claimKind": "contract",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-194",
      "githubAnchor": "unheaded-block-194",
      "stableAnchor": "unheaded-block-194",
      "title": "Unheaded block 194",
      "startLine": 2112,
      "endLine": 2121,
      "textDigest": "6f54e9c73c49cc06bd93ba1401ddb0bdefda6e4c89e62bfc55be6fd092514bb6",
      "sample": "> Bằng chứng distill của 24 vòng thảo luận (2026-08-15, item `tsk-2t9c`),\n> người dùng duyệt từng cụm qua các vòng và duyệt bản distill này ở vòng\n> 21 (mục Artifact-schema bổ sung",
      "identityFingerprint": "8b84949c87f3dbc2fce46968c9ce33008d4287ab0f58c7b0ec87f442532e4416",
      "ancestry": [
        "0002 — Mô hình việc phẳng",
        "0032 — Multi-role Team Harness: trục role/holder, handoff, và marketing-cockpit absorption"
      ],
      "text": "> Bằng chứng distill của 24 vòng thảo luận (2026-08-15, item `tsk-2t9c`),\n> người dùng duyệt từng cụm qua các vòng và duyệt bản distill này ở vòng\n> 21 (mục Artifact-schema bổ sung ở vòng 24). Nguồn chi tiết: `docs/history/fgos-\n> marketing-domain-foundation/DISCUSSION.md` (Q&A log + §6 synthesis),\n> `CONTEXT.md` (bảng đầy đủ các quyết định), `plan.md` (spec 3\n> mảnh triển khai, chi tiết per-file).\n> Mỗi D-ID dưới đây có bản ghi máy tương ứng qua `fgos decision`\n> (event seq ghi kèm) — ba nguồn phải luôn khớp nhau. File này là bản\n> copy đã đóng dấu quyết định (nguồn sống, đầy đủ nhất vẫn là\n> `docs/history/fgos-marketing-domain-foundation/`)."
    }
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-84",
    "githubAnchor": "unheaded-block-84",
    "stableAnchor": "unheaded-block-84",
    "title": "Unheaded block 84",
    "startLine": 769,
    "endLine": 778,
    "textDigest": "6f54e9c73c49cc06bd93ba1401ddb0bdefda6e4c89e62bfc55be6fd092514bb6",
    "sample": "> Bằng chứng distill của 24 vòng thảo luận (2026-08-15, item `tsk-2t9c`),\n> người dùng duyệt từng cụm qua các vòng và duyệt bản distill này ở vòng\n> 21 (mục Artifact-schema bổ sung",
    "identityFingerprint": "8b84949c87f3dbc2fce46968c9ce33008d4287ab0f58c7b0ec87f442532e4416",
    "ancestry": [
      "Retired Decision History: Work State",
      "13. ADR 0032 Multi-Role Team Harness"
    ],
    "text": "> Bằng chứng distill của 24 vòng thảo luận (2026-08-15, item `tsk-2t9c`),\n> người dùng duyệt từng cụm qua các vòng và duyệt bản distill này ở vòng\n> 21 (mục Artifact-schema bổ sung ở vòng 24). Nguồn chi tiết: `docs/history/fgos-\n> marketing-domain-foundation/DISCUSSION.md` (Q&A log + §6 synthesis),\n> `CONTEXT.md` (bảng đầy đủ các quyết định), `plan.md` (spec 3\n> mảnh triển khai, chi tiết per-file).\n> Mỗi D-ID dưới đây có bản ghi máy tương ứng qua `fgos decision`\n> (event seq ghi kèm) — ba nguồn phải luôn khớp nhau. File này là bản\n> copy đã đóng dấu quyết định (nguồn sống, đầy đủ nhất vẫn là\n> `docs/history/fgos-marketing-domain-foundation/`)."
  },
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Weak-exact",
    "reason": "ancestor headings differ; document exact share below one half",
    "targetUnit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-84",
      "githubAnchor": "unheaded-block-84",
      "stableAnchor": "unheaded-block-84",
      "title": "Unheaded block 84",
      "startLine": 769,
      "endLine": 778,
      "textDigest": "6f54e9c73c49cc06bd93ba1401ddb0bdefda6e4c89e62bfc55be6fd092514bb6",
      "sample": "> Bằng chứng distill của 24 vòng thảo luận (2026-08-15, item `tsk-2t9c`),\n> người dùng duyệt từng cụm qua các vòng và duyệt bản distill này ở vòng\n> 21 (mục Artifact-schema bổ sung",
      "identityFingerprint": "8b84949c87f3dbc2fce46968c9ce33008d4287ab0f58c7b0ec87f442532e4416",
      "ancestry": [
        "Retired Decision History: Work State",
        "13. ADR 0032 Multi-Role Team Harness"
      ],
      "text": "> Bằng chứng distill của 24 vòng thảo luận (2026-08-15, item `tsk-2t9c`),\n> người dùng duyệt từng cụm qua các vòng và duyệt bản distill này ở vòng\n> 21 (mục Artifact-schema bổ sung ở vòng 24). Nguồn chi tiết: `docs/history/fgos-\n> marketing-domain-foundation/DISCUSSION.md` (Q&A log + §6 synthesis),\n> `CONTEXT.md` (bảng đầy đủ các quyết định), `plan.md` (spec 3\n> mảnh triển khai, chi tiết per-file).\n> Mỗi D-ID dưới đây có bản ghi máy tương ứng qua `fgos decision`\n> (event seq ghi kèm) — ba nguồn phải luôn khớp nhau. File này là bản\n> copy đã đóng dấu quyết định (nguồn sống, đầy đủ nhất vẫn là\n> `docs/history/fgos-marketing-domain-foundation/`)."
    }
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_63db75c2d22d1861c69845d62518ee60"
}
```

## Entry claim_e6ae96517c239248948c36255ae4dcac

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_e6ae96517c239248948c36255ae4dcac",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "b-decisions-second",
  "before": {
    "claimId": "claim_e6ae96517c239248948c36255ae4dcac",
    "sourceUnitDigest": "8f1228fba7212659",
    "targetOwner": "docs/platform/work-state/history/multi-role-harness-distill-record.md",
    "targetAnchor": "2-distill-journey",
    "claimKind": "historical-context",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Source H4 \"Hành trình\" is carried as H2 \"2. Distill Journey\" in the history document, not in the decision record; title differs.",
    "reviewedBy": "independent reviewer (review-b-decisions-second)",
    "reviewedAt": "2026-10-07",
    "targetUnitDigest": "8cb65c5075a2a4c13e78b4300f757cfe"
  },
  "currentDecision": {
    "claimId": "claim_e6ae96517c239248948c36255ae4dcac",
    "sourceUnitDigest": "8f1228fba7212659",
    "targetOwner": "docs/platform/work-state/history/multi-role-harness-distill-record.md",
    "targetAnchor": "2-distill-journey",
    "claimKind": "historical-context",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "Source H4 \"Hành trình\" is carried as H2 \"2. Distill Journey\" in the history document, not in the decision record; title differs. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
    "targetUnitDigest": "8cb65c5075a2a4c13e78b4300f757cfeb334104a6783d6f9c1e6c60f44515274",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetAncestry": [
      "Multi-Role Harness Distill Record"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/specs/work-state.md",
    "unitDigest": "b2c8dea6216aecc483de267d0821d278c527821fa6e65a5e8ff7777bf8fdc7a7",
    "identityFingerprint": "26170eb4d2a54e3a4d897e06a5d880c48ecef24c33cb45ffc6e07980ec33affc",
    "claimId": "claim_e6ae96517c239248948c36255ae4dcac",
    "sourceAnchor": "hành-trình",
    "unitKind": "heading",
    "sourceUnitDigest": "8f1228fba721265945a07108259062804b98237bd0e778925cc20893b9af31f4",
    "claimKind": "specification",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "heading",
      "level": 4,
      "title": "Hành trình",
      "anchor": "hành-trình",
      "githubAnchor": "hành-trình",
      "stableAnchor": "h-49f06bcdf263",
      "startLine": 2123,
      "endLine": 2123,
      "textDigest": "8f1228fba721265945a07108259062804b98237bd0e778925cc20893b9af31f4",
      "sample": "Hành trình",
      "sectionPayloadDigest": "9f9c5aa1e0bc5a1c034b9356fe0d0dc2f659f3bb7202679d3db53ba250b1b5eb",
      "followingBlockDigest": "9f9c5aa1e0bc5a1c034b9356fe0d0dc2f659f3bb7202679d3db53ba250b1b5eb",
      "identityFingerprint": "26170eb4d2a54e3a4d897e06a5d880c48ecef24c33cb45ffc6e07980ec33affc",
      "ancestry": [
        "0002 — Mô hình việc phẳng",
        "0032 — Multi-role Team Harness: trục role/holder, handoff, và marketing-cockpit absorption"
      ],
      "text": "#### Hành trình",
      "sectionText": "#### Hành trình\n\nXuất phát từ yêu cầu so sánh cơ chế điều phối fgOS vs marketing-cockpit\n(2 scout haiku + phản biện fable, vòng 1–2), thảo luận mở rộng thành\nthiết kế **core harness tổng quát cho team agent đa role** — absorption\ncockpit trở thành *khách hàng đầu tiên* của harness thay vì mục tiêu duy\nnhất. Hội tụ lần 1 ở vòng 8 (exploring + planning đã chạy), người\ndùng dừng trước implement rồi đào sâu thêm 16 vòng ra, và\nplanning chi tiết per-file (vòng 22)."
    }
  },
  "currentTarget": {
    "unitKind": "heading",
    "level": 2,
    "title": "2. Distill Journey",
    "anchor": "2-distill-journey",
    "githubAnchor": "2-distill-journey",
    "stableAnchor": "h-23d19d3273c7",
    "startLine": 19,
    "endLine": 19,
    "textDigest": "8cb65c5075a2a4c13e78b4300f757cfeb334104a6783d6f9c1e6c60f44515274",
    "sample": "2. Distill Journey",
    "sectionPayloadDigest": "9f9c5aa1e0bc5a1c034b9356fe0d0dc2f659f3bb7202679d3db53ba250b1b5eb",
    "followingBlockDigest": "9f9c5aa1e0bc5a1c034b9356fe0d0dc2f659f3bb7202679d3db53ba250b1b5eb",
    "identityFingerprint": "3ad7ec83f0b227060217831efad4904a72d516dc0907a9648c1ef38d6271e6c4",
    "ancestry": [
      "Multi-Role Harness Distill Record"
    ],
    "text": "## 2. Distill Journey",
    "sectionText": "## 2. Distill Journey\n\nXuất phát từ yêu cầu so sánh cơ chế điều phối fgOS vs marketing-cockpit\n(2 scout haiku + phản biện fable, vòng 1–2), thảo luận mở rộng thành\nthiết kế **core harness tổng quát cho team agent đa role** — absorption\ncockpit trở thành *khách hàng đầu tiên* của harness thay vì mục tiêu duy\nnhất. Hội tụ lần 1 ở vòng 8 (exploring + planning đã chạy), người\ndùng dừng trước implement rồi đào sâu thêm 16 vòng ra, và\nplanning chi tiết per-file (vòng 22)."
  },
  "sourceTargetDigestsUnequal": true,
  "classObservation": {
    "class": "Judgment",
    "reason": "no target digest match",
    "targetUnit": null
  },
  "mechanicalRequired": true,
  "deepRequired": true,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_e6ae96517c239248948c36255ae4dcac"
}
```

## Entry claim_634d509e158ed8fc22f610e4c51030ba

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_634d509e158ed8fc22f610e4c51030ba",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "b-decisions-second",
  "before": {
    "claimId": "claim_634d509e158ed8fc22f610e4c51030ba",
    "sourceUnitDigest": "9f9c5aa1e0bc5a1c",
    "targetOwner": "docs/platform/work-state/history/multi-role-harness-distill-record.md",
    "targetAnchor": "unheaded-block-3",
    "claimKind": "historical-context",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Dated distill-journey narrative (comparison request and the scouting rounds); carried verbatim into the history document, classified historical-context rather than decision.",
    "reviewedBy": "independent reviewer (review-b-decisions-second)",
    "reviewedAt": "2026-10-07",
    "targetUnitDigest": "9f9c5aa1e0bc5a1c034b9356fe0d0dc2"
  },
  "currentDecision": {
    "claimId": "claim_634d509e158ed8fc22f610e4c51030ba",
    "sourceUnitDigest": "9f9c5aa1e0bc5a1c",
    "targetOwner": "docs/platform/work-state/history/multi-role-harness-distill-record.md",
    "targetAnchor": "unheaded-block-3",
    "claimKind": "historical-context",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "Dated distill-journey narrative (comparison request and the scouting rounds); carried verbatim into the history document, classified historical-context rather than decision. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
    "targetUnitDigest": "9f9c5aa1e0bc5a1c034b9356fe0d0dc2f659f3bb7202679d3db53ba250b1b5eb",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetAncestry": [
      "Multi-Role Harness Distill Record",
      "2. Distill Journey"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/specs/work-state.md",
    "unitDigest": "5d0d2649706284727ce9d8d7bdfba062bf01b01145339a57f9d76ff9a1e383f5",
    "identityFingerprint": "5d0d2649706284727ce9d8d7bdfba062bf01b01145339a57f9d76ff9a1e383f5",
    "claimId": "claim_634d509e158ed8fc22f610e4c51030ba",
    "sourceAnchor": "unheaded-block-195",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "9f9c5aa1e0bc5a1c034b9356fe0d0dc2f659f3bb7202679d3db53ba250b1b5eb",
    "claimKind": "specification",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-195",
      "githubAnchor": "unheaded-block-195",
      "stableAnchor": "unheaded-block-195",
      "title": "Unheaded block 195",
      "startLine": 2125,
      "endLine": 2131,
      "textDigest": "9f9c5aa1e0bc5a1c034b9356fe0d0dc2f659f3bb7202679d3db53ba250b1b5eb",
      "sample": "Xuất phát từ yêu cầu so sánh cơ chế điều phối fgOS vs marketing-cockpit\n(2 scout haiku + phản biện fable, vòng 1–2), thảo luận mở rộng thành\nthiết kế **core harness tổng quát cho t",
      "identityFingerprint": "5d0d2649706284727ce9d8d7bdfba062bf01b01145339a57f9d76ff9a1e383f5",
      "ancestry": [
        "0002 — Mô hình việc phẳng",
        "0032 — Multi-role Team Harness: trục role/holder, handoff, và marketing-cockpit absorption",
        "Hành trình"
      ],
      "text": "Xuất phát từ yêu cầu so sánh cơ chế điều phối fgOS vs marketing-cockpit\n(2 scout haiku + phản biện fable, vòng 1–2), thảo luận mở rộng thành\nthiết kế **core harness tổng quát cho team agent đa role** — absorption\ncockpit trở thành *khách hàng đầu tiên* của harness thay vì mục tiêu duy\nnhất. Hội tụ lần 1 ở vòng 8 (exploring + planning đã chạy), người\ndùng dừng trước implement rồi đào sâu thêm 16 vòng ra, và\nplanning chi tiết per-file (vòng 22)."
    }
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-3",
    "githubAnchor": "unheaded-block-3",
    "stableAnchor": "unheaded-block-3",
    "title": "Unheaded block 3",
    "startLine": 21,
    "endLine": 27,
    "textDigest": "9f9c5aa1e0bc5a1c034b9356fe0d0dc2f659f3bb7202679d3db53ba250b1b5eb",
    "sample": "Xuất phát từ yêu cầu so sánh cơ chế điều phối fgOS vs marketing-cockpit\n(2 scout haiku + phản biện fable, vòng 1–2), thảo luận mở rộng thành\nthiết kế **core harness tổng quát cho t",
    "identityFingerprint": "5d0d2649706284727ce9d8d7bdfba062bf01b01145339a57f9d76ff9a1e383f5",
    "ancestry": [
      "Multi-Role Harness Distill Record",
      "2. Distill Journey"
    ],
    "text": "Xuất phát từ yêu cầu so sánh cơ chế điều phối fgOS vs marketing-cockpit\n(2 scout haiku + phản biện fable, vòng 1–2), thảo luận mở rộng thành\nthiết kế **core harness tổng quát cho team agent đa role** — absorption\ncockpit trở thành *khách hàng đầu tiên* của harness thay vì mục tiêu duy\nnhất. Hội tụ lần 1 ở vòng 8 (exploring + planning đã chạy), người\ndùng dừng trước implement rồi đào sâu thêm 16 vòng ra, và\nplanning chi tiết per-file (vòng 22)."
  },
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Weak-exact",
    "reason": "ancestor headings differ; document exact share below one half",
    "targetUnit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-3",
      "githubAnchor": "unheaded-block-3",
      "stableAnchor": "unheaded-block-3",
      "title": "Unheaded block 3",
      "startLine": 21,
      "endLine": 27,
      "textDigest": "9f9c5aa1e0bc5a1c034b9356fe0d0dc2f659f3bb7202679d3db53ba250b1b5eb",
      "sample": "Xuất phát từ yêu cầu so sánh cơ chế điều phối fgOS vs marketing-cockpit\n(2 scout haiku + phản biện fable, vòng 1–2), thảo luận mở rộng thành\nthiết kế **core harness tổng quát cho t",
      "identityFingerprint": "5d0d2649706284727ce9d8d7bdfba062bf01b01145339a57f9d76ff9a1e383f5",
      "ancestry": [
        "Multi-Role Harness Distill Record",
        "2. Distill Journey"
      ],
      "text": "Xuất phát từ yêu cầu so sánh cơ chế điều phối fgOS vs marketing-cockpit\n(2 scout haiku + phản biện fable, vòng 1–2), thảo luận mở rộng thành\nthiết kế **core harness tổng quát cho team agent đa role** — absorption\ncockpit trở thành *khách hàng đầu tiên* của harness thay vì mục tiêu duy\nnhất. Hội tụ lần 1 ở vòng 8 (exploring + planning đã chạy), người\ndùng dừng trước implement rồi đào sâu thêm 16 vòng ra, và\nplanning chi tiết per-file (vòng 22)."
    }
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_634d509e158ed8fc22f610e4c51030ba"
}
```

## Entry claim_7e0016df70b7640b0337c5daf5f80e90

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_7e0016df70b7640b0337c5daf5f80e90",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "b-decisions-second",
  "before": {
    "claimId": "claim_7e0016df70b7640b0337c5daf5f80e90",
    "sourceUnitDigest": "18b3552e741e5967",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "0032-foundation-architecture",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Source H4 \"I. Kiến trúc nền (seq ...)\" is carried as H3 \"0032 Foundation Architecture\"; title translated and seq references dropped.",
    "reviewedBy": "independent reviewer (review-b-decisions-second)",
    "reviewedAt": "2026-10-07",
    "targetUnitDigest": "43773d8a795297806063bf0a0df747a4"
  },
  "currentDecision": {
    "claimId": "claim_7e0016df70b7640b0337c5daf5f80e90",
    "sourceUnitDigest": "18b3552e741e5967",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "0032-foundation-architecture",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "Source H4 \"I. Kiến trúc nền (seq ...)\" is carried as H3 \"0032 Foundation Architecture\"; title translated and seq references dropped. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
    "targetUnitDigest": "43773d8a795297806063bf0a0df747a426a048d010c7835e6a4c364f948e25e9",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "13. ADR 0032 Multi-Role Team Harness"
    ],
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried."
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/specs/work-state.md",
    "unitDigest": "5dfe2bc1d8aabb9fed539c23a8576d9f6b2b2d59f2e3f81df663d1c09d236b63",
    "identityFingerprint": "42cc0c11faaec8db60fe948cd6376dfaaacfd0e4e5d215dfd9e34845bae3c1bb",
    "claimId": "claim_7e0016df70b7640b0337c5daf5f80e90",
    "sourceAnchor": "i-kiến-trúc-nền-seq-18029-18031",
    "unitKind": "heading",
    "sourceUnitDigest": "18b3552e741e5967638a6d0f6fb9d1fad995dba304c5da7b97064c41da301ab7",
    "claimKind": "specification",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "heading",
      "level": 4,
      "title": "I. Kiến trúc nền (seq 18029, 18031)",
      "anchor": "i-kiến-trúc-nền-seq-18029-18031",
      "githubAnchor": "i-kiến-trúc-nền-seq-18029-18031",
      "stableAnchor": "h-b8ac2db5a3ee",
      "startLine": 2133,
      "endLine": 2133,
      "textDigest": "18b3552e741e5967638a6d0f6fb9d1fad995dba304c5da7b97064c41da301ab7",
      "sample": "I. Kiến trúc nền (seq 18029, 18031)",
      "sectionPayloadDigest": "2a1722766193d70b5f41165f820655b64f3c7ce5a79b105d57af313ff03ffe9e",
      "followingBlockDigest": "2a1722766193d70b5f41165f820655b64f3c7ce5a79b105d57af313ff03ffe9e",
      "identityFingerprint": "42cc0c11faaec8db60fe948cd6376dfaaacfd0e4e5d215dfd9e34845bae3c1bb",
      "ancestry": [
        "0002 — Mô hình việc phẳng",
        "0032 — Multi-role Team Harness: trục role/holder, handoff, và marketing-cockpit absorption"
      ],
      "text": "#### I. Kiến trúc nền (seq 18029, 18031)",
      "sectionText": "#### I. Kiến trúc nền (seq 18029, 18031)\n\n- **Mechanism vs Policy**: harness (cơ học) chỉ gác legality + ghi sự\n  thật vào event log + đánh thức đúng vai — *không bao giờ phán đoán*.\n  Soul (agent-type) hiểu vai trò, hiểu vấn đề, biết cần ai support — *tự\n  chọn* edge hợp lệ. Route bậy → REFUSED kèm danh sách edge hợp lệ\n  (chặn và dạy tại chỗ).\n- **Ba trục trực giao trên work item**: `status` (lifecycle phổ quát, 11\n  trạng thái — giữ nguyên) × `stage` (thuộc workflow đã chọn) ×\n  `role/holder` (mới, opt-in per-domain qua `roleGraph`).\n- **Ba tầng điều phối không giẫm nhau**: Router/Driver (who/what-next —\n  `fgos-routing`, `fgos-coding-driving`) / Guard (legality — FSM +\n  roleGraph + gates) / Dispatch (executor nào chạy —\n  `src/runner/dispatch.mjs` decide/execute, một cửa)."
    }
  },
  "currentTarget": {
    "unitKind": "heading",
    "level": 3,
    "title": "0032 Foundation Architecture",
    "anchor": "0032-foundation-architecture",
    "githubAnchor": "0032-foundation-architecture",
    "stableAnchor": "h-8d05c65b2a5e",
    "startLine": 780,
    "endLine": 780,
    "textDigest": "43773d8a795297806063bf0a0df747a426a048d010c7835e6a4c364f948e25e9",
    "sample": "0032 Foundation Architecture",
    "sectionPayloadDigest": "2a1722766193d70b5f41165f820655b64f3c7ce5a79b105d57af313ff03ffe9e",
    "followingBlockDigest": "2a1722766193d70b5f41165f820655b64f3c7ce5a79b105d57af313ff03ffe9e",
    "identityFingerprint": "de53b14662ffdea810767853c1690a1916d25cf7d7362f257b19f446fee15ef8",
    "ancestry": [
      "Retired Decision History: Work State",
      "13. ADR 0032 Multi-Role Team Harness"
    ],
    "text": "### 0032 Foundation Architecture",
    "sectionText": "### 0032 Foundation Architecture\n\n- **Mechanism vs Policy**: harness (cơ học) chỉ gác legality + ghi sự\n  thật vào event log + đánh thức đúng vai — *không bao giờ phán đoán*.\n  Soul (agent-type) hiểu vai trò, hiểu vấn đề, biết cần ai support — *tự\n  chọn* edge hợp lệ. Route bậy → REFUSED kèm danh sách edge hợp lệ\n  (chặn và dạy tại chỗ).\n- **Ba trục trực giao trên work item**: `status` (lifecycle phổ quát, 11\n  trạng thái — giữ nguyên) × `stage` (thuộc workflow đã chọn) ×\n  `role/holder` (mới, opt-in per-domain qua `roleGraph`).\n- **Ba tầng điều phối không giẫm nhau**: Router/Driver (who/what-next —\n  `fgos-routing`, `fgos-coding-driving`) / Guard (legality — FSM +\n  roleGraph + gates) / Dispatch (executor nào chạy —\n  `src/runner/dispatch.mjs` decide/execute, một cửa)."
  },
  "sourceTargetDigestsUnequal": true,
  "classObservation": {
    "class": "Judgment",
    "reason": "no target digest match",
    "targetUnit": null
  },
  "mechanicalRequired": true,
  "deepRequired": true,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_7e0016df70b7640b0337c5daf5f80e90"
}
```

## Entry claim_a9be2da803446c73efbfcac40ee82637

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_a9be2da803446c73efbfcac40ee82637",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "b-decisions-second",
  "before": {
    "claimId": "claim_a9be2da803446c73efbfcac40ee82637",
    "sourceUnitDigest": "2a1722766193d70b",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-85",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "ADR 0032 foundation list (mechanism vs policy and related axes); carried verbatim.",
    "reviewedBy": "independent reviewer (review-b-decisions-second)",
    "reviewedAt": "2026-10-07",
    "targetUnitDigest": "2a1722766193d70b5f41165f820655b6"
  },
  "currentDecision": {
    "claimId": "claim_a9be2da803446c73efbfcac40ee82637",
    "sourceUnitDigest": "2a1722766193d70b",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-85",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "ADR 0032 foundation list (mechanism vs policy and related axes); carried verbatim. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
    "targetUnitDigest": "2a1722766193d70b5f41165f820655b64f3c7ce5a79b105d57af313ff03ffe9e",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "13. ADR 0032 Multi-Role Team Harness",
      "0032 Foundation Architecture"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/specs/work-state.md",
    "unitDigest": "5cba86034be0896871dc24730d12d04db2dac38e7e585929f4bddeddda99eceb",
    "identityFingerprint": "5cba86034be0896871dc24730d12d04db2dac38e7e585929f4bddeddda99eceb",
    "claimId": "claim_a9be2da803446c73efbfcac40ee82637",
    "sourceAnchor": "unheaded-block-196",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "2a1722766193d70b5f41165f820655b64f3c7ce5a79b105d57af313ff03ffe9e",
    "claimKind": "specification",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-196",
      "githubAnchor": "unheaded-block-196",
      "stableAnchor": "unheaded-block-196",
      "title": "Unheaded block 196",
      "startLine": 2135,
      "endLine": 2146,
      "textDigest": "2a1722766193d70b5f41165f820655b64f3c7ce5a79b105d57af313ff03ffe9e",
      "sample": "- **Mechanism vs Policy**: harness (cơ học) chỉ gác legality + ghi sự\n  thật vào event log + đánh thức đúng vai — *không bao giờ phán đoán*.\n  Soul (agent-type) hiểu vai trò, hiểu ",
      "identityFingerprint": "5cba86034be0896871dc24730d12d04db2dac38e7e585929f4bddeddda99eceb",
      "ancestry": [
        "0002 — Mô hình việc phẳng",
        "0032 — Multi-role Team Harness: trục role/holder, handoff, và marketing-cockpit absorption",
        "I. Kiến trúc nền (seq 18029, 18031)"
      ],
      "text": "- **Mechanism vs Policy**: harness (cơ học) chỉ gác legality + ghi sự\n  thật vào event log + đánh thức đúng vai — *không bao giờ phán đoán*.\n  Soul (agent-type) hiểu vai trò, hiểu vấn đề, biết cần ai support — *tự\n  chọn* edge hợp lệ. Route bậy → REFUSED kèm danh sách edge hợp lệ\n  (chặn và dạy tại chỗ).\n- **Ba trục trực giao trên work item**: `status` (lifecycle phổ quát, 11\n  trạng thái — giữ nguyên) × `stage` (thuộc workflow đã chọn) ×\n  `role/holder` (mới, opt-in per-domain qua `roleGraph`).\n- **Ba tầng điều phối không giẫm nhau**: Router/Driver (who/what-next —\n  `fgos-routing`, `fgos-coding-driving`) / Guard (legality — FSM +\n  roleGraph + gates) / Dispatch (executor nào chạy —\n  `src/runner/dispatch.mjs` decide/execute, một cửa)."
    }
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-85",
    "githubAnchor": "unheaded-block-85",
    "stableAnchor": "unheaded-block-85",
    "title": "Unheaded block 85",
    "startLine": 782,
    "endLine": 793,
    "textDigest": "2a1722766193d70b5f41165f820655b64f3c7ce5a79b105d57af313ff03ffe9e",
    "sample": "- **Mechanism vs Policy**: harness (cơ học) chỉ gác legality + ghi sự\n  thật vào event log + đánh thức đúng vai — *không bao giờ phán đoán*.\n  Soul (agent-type) hiểu vai trò, hiểu ",
    "identityFingerprint": "5cba86034be0896871dc24730d12d04db2dac38e7e585929f4bddeddda99eceb",
    "ancestry": [
      "Retired Decision History: Work State",
      "13. ADR 0032 Multi-Role Team Harness",
      "0032 Foundation Architecture"
    ],
    "text": "- **Mechanism vs Policy**: harness (cơ học) chỉ gác legality + ghi sự\n  thật vào event log + đánh thức đúng vai — *không bao giờ phán đoán*.\n  Soul (agent-type) hiểu vai trò, hiểu vấn đề, biết cần ai support — *tự\n  chọn* edge hợp lệ. Route bậy → REFUSED kèm danh sách edge hợp lệ\n  (chặn và dạy tại chỗ).\n- **Ba trục trực giao trên work item**: `status` (lifecycle phổ quát, 11\n  trạng thái — giữ nguyên) × `stage` (thuộc workflow đã chọn) ×\n  `role/holder` (mới, opt-in per-domain qua `roleGraph`).\n- **Ba tầng điều phối không giẫm nhau**: Router/Driver (who/what-next —\n  `fgos-routing`, `fgos-coding-driving`) / Guard (legality — FSM +\n  roleGraph + gates) / Dispatch (executor nào chạy —\n  `src/runner/dispatch.mjs` decide/execute, một cửa)."
  },
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Weak-exact",
    "reason": "ancestor headings differ; document exact share below one half",
    "targetUnit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-85",
      "githubAnchor": "unheaded-block-85",
      "stableAnchor": "unheaded-block-85",
      "title": "Unheaded block 85",
      "startLine": 782,
      "endLine": 793,
      "textDigest": "2a1722766193d70b5f41165f820655b64f3c7ce5a79b105d57af313ff03ffe9e",
      "sample": "- **Mechanism vs Policy**: harness (cơ học) chỉ gác legality + ghi sự\n  thật vào event log + đánh thức đúng vai — *không bao giờ phán đoán*.\n  Soul (agent-type) hiểu vai trò, hiểu ",
      "identityFingerprint": "5cba86034be0896871dc24730d12d04db2dac38e7e585929f4bddeddda99eceb",
      "ancestry": [
        "Retired Decision History: Work State",
        "13. ADR 0032 Multi-Role Team Harness",
        "0032 Foundation Architecture"
      ],
      "text": "- **Mechanism vs Policy**: harness (cơ học) chỉ gác legality + ghi sự\n  thật vào event log + đánh thức đúng vai — *không bao giờ phán đoán*.\n  Soul (agent-type) hiểu vai trò, hiểu vấn đề, biết cần ai support — *tự\n  chọn* edge hợp lệ. Route bậy → REFUSED kèm danh sách edge hợp lệ\n  (chặn và dạy tại chỗ).\n- **Ba trục trực giao trên work item**: `status` (lifecycle phổ quát, 11\n  trạng thái — giữ nguyên) × `stage` (thuộc workflow đã chọn) ×\n  `role/holder` (mới, opt-in per-domain qua `roleGraph`).\n- **Ba tầng điều phối không giẫm nhau**: Router/Driver (who/what-next —\n  `fgos-routing`, `fgos-coding-driving`) / Guard (legality — FSM +\n  roleGraph + gates) / Dispatch (executor nào chạy —\n  `src/runner/dispatch.mjs` decide/execute, một cửa)."
    }
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_a9be2da803446c73efbfcac40ee82637"
}
```

## Entry claim_f30f58465c33adf6343057d6c3fcb2b3

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_f30f58465c33adf6343057d6c3fcb2b3",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "b-decisions-second",
  "before": {
    "claimId": "claim_f30f58465c33adf6343057d6c3fcb2b3",
    "sourceUnitDigest": "bade02e702bb44fe",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "0032-handoff",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Source H4 \"II. Handoff ...\" is carried as H3 \"0032 Handoff\"; title shortened and seq references dropped.",
    "reviewedBy": "independent reviewer (review-b-decisions-second)",
    "reviewedAt": "2026-10-07",
    "targetUnitDigest": "6b297c17245b7ff04f30f0e8abc72bbb"
  },
  "currentDecision": {
    "claimId": "claim_f30f58465c33adf6343057d6c3fcb2b3",
    "sourceUnitDigest": "bade02e702bb44fe",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "0032-handoff",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "Source H4 \"II. Handoff ...\" is carried as H3 \"0032 Handoff\"; title shortened and seq references dropped. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
    "targetUnitDigest": "6b297c17245b7ff04f30f0e8abc72bbb41907953c204d3469f8896771b5e88e0",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "13. ADR 0032 Multi-Role Team Harness"
    ],
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried."
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/specs/work-state.md",
    "unitDigest": "be32fc2895d166370f93ffbb1c37ee0c3d92163101c57ad91c3c29c08e2a3f80",
    "identityFingerprint": "aa6f9f5bbe5a6fbc11588c410ff4567b92b6fc5258a9a26477607184b1f0ecde",
    "claimId": "claim_f30f58465c33adf6343057d6c3fcb2b3",
    "sourceAnchor": "ii-handoff-trái-tim-của-tính-uyển-chuyển-seq-18032-18070-18058",
    "unitKind": "heading",
    "sourceUnitDigest": "bade02e702bb44fecb5168e34ecf4a5dfa1fa0c37d8af333ae496d147be72054",
    "claimKind": "specification",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "heading",
      "level": 4,
      "title": "II. Handoff — trái tim của tính uyển chuyển (seq 18032, 18070, 18058)",
      "anchor": "ii-handoff-trái-tim-của-tính-uyển-chuyển-seq-18032-18070-18058",
      "githubAnchor": "ii-handoff-trái-tim-của-tính-uyển-chuyển-seq-18032-18070-18058",
      "stableAnchor": "h-56cdbec1858c",
      "startLine": 2148,
      "endLine": 2148,
      "textDigest": "bade02e702bb44fecb5168e34ecf4a5dfa1fa0c37d8af333ae496d147be72054",
      "sample": "II. Handoff — trái tim của tính uyển chuyển (seq 18032, 18070, 18058)",
      "sectionPayloadDigest": "dce677680de09c58dce4e54b16850671db81f3e54202b29d8adc8e9c2f358bae",
      "followingBlockDigest": "dce677680de09c58dce4e54b16850671db81f3e54202b29d8adc8e9c2f358bae",
      "identityFingerprint": "aa6f9f5bbe5a6fbc11588c410ff4567b92b6fc5258a9a26477607184b1f0ecde",
      "ancestry": [
        "0002 — Mô hình việc phẳng",
        "0032 — Multi-role Team Harness: trục role/holder, handoff, và marketing-cockpit absorption"
      ],
      "text": "#### II. Handoff — trái tim của tính uyển chuyển (seq 18032, 18070, 18058)",
      "sectionText": "#### II. Handoff — trái tim của tính uyển chuyển (seq 18032, 18070, 18058)\n\n- **Hai loại handoff**: **Call** (round-trip, bóng về người gửi) với 4\n  reason do người dùng định nghĩa: `advise` / `assist` (tay chân) /\n  `review` (phản biện) / `consult` (chuyên môn) — tổng quát hoá\n  `fgos ask/answer` sẵn có. **Pass** (chuyển giao một chiều theo stage).\n  Ranh giới: cùng item → handoff; khác item/cây → signal.\n- **Call lồng được, trần callstack** (mặc định 3, config override — con\n  số cụ thể do planning quyết, người dùng chốt nguyên tắc vòng 5).\n- **Ghi log hai mức**: async call = handoff event đầy đủ, holder\n  đổi; sync call trong-session (subagent) = một event `call-summary`\n  gọn, holder giữ nguyên. Invariant: *holder chỉ đổi qua async handoff*.\n  Mỗi handoff = một checkpoint hạt mịn tự nhiên (context snapshot trong\n  event + worktree commit cho artifact) — không cần checkpoint machinery\n  riêng như cockpit.\n- **Gate hard/soft**: hard một-chiều ⟺ side effect vượt ranh giới\n  item/worktree (merge main CTR005, publish ra ngoài, terminal\n  done/wontfix, cleanup đã xoá worktree; vùng hậu-merge một chiều —\n  rework = item mới). Mọi gate nội bộ item = soft: quay lại được nhưng\n  *bắt buộc ghi reason* → rework thành tín hiệu compound-learn. Áp\n  nguyên xi cho marketing (publish = hard, editorial approval = soft)."
    }
  },
  "currentTarget": {
    "unitKind": "heading",
    "level": 3,
    "title": "0032 Handoff",
    "anchor": "0032-handoff",
    "githubAnchor": "0032-handoff",
    "stableAnchor": "h-b65711e965ee",
    "startLine": 795,
    "endLine": 795,
    "textDigest": "6b297c17245b7ff04f30f0e8abc72bbb41907953c204d3469f8896771b5e88e0",
    "sample": "0032 Handoff",
    "sectionPayloadDigest": "dce677680de09c58dce4e54b16850671db81f3e54202b29d8adc8e9c2f358bae",
    "followingBlockDigest": "dce677680de09c58dce4e54b16850671db81f3e54202b29d8adc8e9c2f358bae",
    "identityFingerprint": "214a55bbf069ad861ae5fdcec21c7b840b332ce02d26df030048ee56a28bcba0",
    "ancestry": [
      "Retired Decision History: Work State",
      "13. ADR 0032 Multi-Role Team Harness"
    ],
    "text": "### 0032 Handoff",
    "sectionText": "### 0032 Handoff\n\n- **Hai loại handoff**: **Call** (round-trip, bóng về người gửi) với 4\n  reason do người dùng định nghĩa: `advise` / `assist` (tay chân) /\n  `review` (phản biện) / `consult` (chuyên môn) — tổng quát hoá\n  `fgos ask/answer` sẵn có. **Pass** (chuyển giao một chiều theo stage).\n  Ranh giới: cùng item → handoff; khác item/cây → signal.\n- **Call lồng được, trần callstack** (mặc định 3, config override — con\n  số cụ thể do planning quyết, người dùng chốt nguyên tắc vòng 5).\n- **Ghi log hai mức**: async call = handoff event đầy đủ, holder\n  đổi; sync call trong-session (subagent) = một event `call-summary`\n  gọn, holder giữ nguyên. Invariant: *holder chỉ đổi qua async handoff*.\n  Mỗi handoff = một checkpoint hạt mịn tự nhiên (context snapshot trong\n  event + worktree commit cho artifact) — không cần checkpoint machinery\n  riêng như cockpit.\n- **Gate hard/soft**: hard một-chiều ⟺ side effect vượt ranh giới\n  item/worktree (merge main CTR005, publish ra ngoài, terminal\n  done/wontfix, cleanup đã xoá worktree; vùng hậu-merge một chiều —\n  rework = item mới). Mọi gate nội bộ item = soft: quay lại được nhưng\n  *bắt buộc ghi reason* → rework thành tín hiệu compound-learn. Áp\n  nguyên xi cho marketing (publish = hard, editorial approval = soft)."
  },
  "sourceTargetDigestsUnequal": true,
  "classObservation": {
    "class": "Judgment",
    "reason": "no target digest match",
    "targetUnit": null
  },
  "mechanicalRequired": true,
  "deepRequired": true,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_f30f58465c33adf6343057d6c3fcb2b3"
}
```

## Entry claim_6f7a10c04ee1414d39b0b2ef8d7d2d6d

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_6f7a10c04ee1414d39b0b2ef8d7d2d6d",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "b-decisions-second",
  "before": {
    "claimId": "claim_6f7a10c04ee1414d39b0b2ef8d7d2d6d",
    "sourceUnitDigest": "dce677680de09c58",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-86",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "ADR 0032 handoff list (Call vs hand-off kinds and rules); carried verbatim.",
    "reviewedBy": "independent reviewer (review-b-decisions-second)",
    "reviewedAt": "2026-10-07",
    "targetUnitDigest": "dce677680de09c58dce4e54b16850671"
  },
  "currentDecision": {
    "claimId": "claim_6f7a10c04ee1414d39b0b2ef8d7d2d6d",
    "sourceUnitDigest": "dce677680de09c58",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-86",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "ADR 0032 handoff list (Call vs hand-off kinds and rules); carried verbatim. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
    "targetUnitDigest": "dce677680de09c58dce4e54b16850671db81f3e54202b29d8adc8e9c2f358bae",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "13. ADR 0032 Multi-Role Team Harness",
      "0032 Handoff"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/specs/work-state.md",
    "unitDigest": "45b2df1946d8f6d7e6fe210dc84ce4d6e1763d4e35ab5ecc4a4f1e85cde0edea",
    "identityFingerprint": "45b2df1946d8f6d7e6fe210dc84ce4d6e1763d4e35ab5ecc4a4f1e85cde0edea",
    "claimId": "claim_6f7a10c04ee1414d39b0b2ef8d7d2d6d",
    "sourceAnchor": "unheaded-block-197",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "dce677680de09c58dce4e54b16850671db81f3e54202b29d8adc8e9c2f358bae",
    "claimKind": "specification",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-197",
      "githubAnchor": "unheaded-block-197",
      "stableAnchor": "unheaded-block-197",
      "title": "Unheaded block 197",
      "startLine": 2150,
      "endLine": 2168,
      "textDigest": "dce677680de09c58dce4e54b16850671db81f3e54202b29d8adc8e9c2f358bae",
      "sample": "- **Hai loại handoff**: **Call** (round-trip, bóng về người gửi) với 4\n  reason do người dùng định nghĩa: `advise` / `assist` (tay chân) /\n  `review` (phản biện) / `consult` (chuyê",
      "identityFingerprint": "45b2df1946d8f6d7e6fe210dc84ce4d6e1763d4e35ab5ecc4a4f1e85cde0edea",
      "ancestry": [
        "0002 — Mô hình việc phẳng",
        "0032 — Multi-role Team Harness: trục role/holder, handoff, và marketing-cockpit absorption",
        "II. Handoff — trái tim của tính uyển chuyển (seq 18032, 18070, 18058)"
      ],
      "text": "- **Hai loại handoff**: **Call** (round-trip, bóng về người gửi) với 4\n  reason do người dùng định nghĩa: `advise` / `assist` (tay chân) /\n  `review` (phản biện) / `consult` (chuyên môn) — tổng quát hoá\n  `fgos ask/answer` sẵn có. **Pass** (chuyển giao một chiều theo stage).\n  Ranh giới: cùng item → handoff; khác item/cây → signal.\n- **Call lồng được, trần callstack** (mặc định 3, config override — con\n  số cụ thể do planning quyết, người dùng chốt nguyên tắc vòng 5).\n- **Ghi log hai mức**: async call = handoff event đầy đủ, holder\n  đổi; sync call trong-session (subagent) = một event `call-summary`\n  gọn, holder giữ nguyên. Invariant: *holder chỉ đổi qua async handoff*.\n  Mỗi handoff = một checkpoint hạt mịn tự nhiên (context snapshot trong\n  event + worktree commit cho artifact) — không cần checkpoint machinery\n  riêng như cockpit.\n- **Gate hard/soft**: hard một-chiều ⟺ side effect vượt ranh giới\n  item/worktree (merge main CTR005, publish ra ngoài, terminal\n  done/wontfix, cleanup đã xoá worktree; vùng hậu-merge một chiều —\n  rework = item mới). Mọi gate nội bộ item = soft: quay lại được nhưng\n  *bắt buộc ghi reason* → rework thành tín hiệu compound-learn. Áp\n  nguyên xi cho marketing (publish = hard, editorial approval = soft)."
    }
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-86",
    "githubAnchor": "unheaded-block-86",
    "stableAnchor": "unheaded-block-86",
    "title": "Unheaded block 86",
    "startLine": 797,
    "endLine": 815,
    "textDigest": "dce677680de09c58dce4e54b16850671db81f3e54202b29d8adc8e9c2f358bae",
    "sample": "- **Hai loại handoff**: **Call** (round-trip, bóng về người gửi) với 4\n  reason do người dùng định nghĩa: `advise` / `assist` (tay chân) /\n  `review` (phản biện) / `consult` (chuyê",
    "identityFingerprint": "45b2df1946d8f6d7e6fe210dc84ce4d6e1763d4e35ab5ecc4a4f1e85cde0edea",
    "ancestry": [
      "Retired Decision History: Work State",
      "13. ADR 0032 Multi-Role Team Harness",
      "0032 Handoff"
    ],
    "text": "- **Hai loại handoff**: **Call** (round-trip, bóng về người gửi) với 4\n  reason do người dùng định nghĩa: `advise` / `assist` (tay chân) /\n  `review` (phản biện) / `consult` (chuyên môn) — tổng quát hoá\n  `fgos ask/answer` sẵn có. **Pass** (chuyển giao một chiều theo stage).\n  Ranh giới: cùng item → handoff; khác item/cây → signal.\n- **Call lồng được, trần callstack** (mặc định 3, config override — con\n  số cụ thể do planning quyết, người dùng chốt nguyên tắc vòng 5).\n- **Ghi log hai mức**: async call = handoff event đầy đủ, holder\n  đổi; sync call trong-session (subagent) = một event `call-summary`\n  gọn, holder giữ nguyên. Invariant: *holder chỉ đổi qua async handoff*.\n  Mỗi handoff = một checkpoint hạt mịn tự nhiên (context snapshot trong\n  event + worktree commit cho artifact) — không cần checkpoint machinery\n  riêng như cockpit.\n- **Gate hard/soft**: hard một-chiều ⟺ side effect vượt ranh giới\n  item/worktree (merge main CTR005, publish ra ngoài, terminal\n  done/wontfix, cleanup đã xoá worktree; vùng hậu-merge một chiều —\n  rework = item mới). Mọi gate nội bộ item = soft: quay lại được nhưng\n  *bắt buộc ghi reason* → rework thành tín hiệu compound-learn. Áp\n  nguyên xi cho marketing (publish = hard, editorial approval = soft)."
  },
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Weak-exact",
    "reason": "ancestor headings differ; document exact share below one half",
    "targetUnit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-86",
      "githubAnchor": "unheaded-block-86",
      "stableAnchor": "unheaded-block-86",
      "title": "Unheaded block 86",
      "startLine": 797,
      "endLine": 815,
      "textDigest": "dce677680de09c58dce4e54b16850671db81f3e54202b29d8adc8e9c2f358bae",
      "sample": "- **Hai loại handoff**: **Call** (round-trip, bóng về người gửi) với 4\n  reason do người dùng định nghĩa: `advise` / `assist` (tay chân) /\n  `review` (phản biện) / `consult` (chuyê",
      "identityFingerprint": "45b2df1946d8f6d7e6fe210dc84ce4d6e1763d4e35ab5ecc4a4f1e85cde0edea",
      "ancestry": [
        "Retired Decision History: Work State",
        "13. ADR 0032 Multi-Role Team Harness",
        "0032 Handoff"
      ],
      "text": "- **Hai loại handoff**: **Call** (round-trip, bóng về người gửi) với 4\n  reason do người dùng định nghĩa: `advise` / `assist` (tay chân) /\n  `review` (phản biện) / `consult` (chuyên môn) — tổng quát hoá\n  `fgos ask/answer` sẵn có. **Pass** (chuyển giao một chiều theo stage).\n  Ranh giới: cùng item → handoff; khác item/cây → signal.\n- **Call lồng được, trần callstack** (mặc định 3, config override — con\n  số cụ thể do planning quyết, người dùng chốt nguyên tắc vòng 5).\n- **Ghi log hai mức**: async call = handoff event đầy đủ, holder\n  đổi; sync call trong-session (subagent) = một event `call-summary`\n  gọn, holder giữ nguyên. Invariant: *holder chỉ đổi qua async handoff*.\n  Mỗi handoff = một checkpoint hạt mịn tự nhiên (context snapshot trong\n  event + worktree commit cho artifact) — không cần checkpoint machinery\n  riêng như cockpit.\n- **Gate hard/soft**: hard một-chiều ⟺ side effect vượt ranh giới\n  item/worktree (merge main CTR005, publish ra ngoài, terminal\n  done/wontfix, cleanup đã xoá worktree; vùng hậu-merge một chiều —\n  rework = item mới). Mọi gate nội bộ item = soft: quay lại được nhưng\n  *bắt buộc ghi reason* → rework thành tín hiệu compound-learn. Áp\n  nguyên xi cho marketing (publish = hard, editorial approval = soft)."
    }
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_6f7a10c04ee1414d39b0b2ef8d7d2d6d"
}
```

## Entry claim_45840c035132a9c46aa748567ae37648

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_45840c035132a9c46aa748567ae37648",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "b-decisions-second",
  "before": {
    "claimId": "claim_45840c035132a9c46aa748567ae37648",
    "sourceUnitDigest": "fe8801065e62f36e",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "0032-declarative-structure",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Source H4 \"III. Cấu trúc khai báo ...\" is carried as H3 \"0032 Declarative Structure\"; title translated and seq references dropped.",
    "reviewedBy": "independent reviewer (review-b-decisions-second)",
    "reviewedAt": "2026-10-07",
    "targetUnitDigest": "f13c8f30093babf6efcf6b2fbb0062ee"
  },
  "currentDecision": {
    "claimId": "claim_45840c035132a9c46aa748567ae37648",
    "sourceUnitDigest": "fe8801065e62f36e",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "0032-declarative-structure",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "Source H4 \"III. Cấu trúc khai báo ...\" is carried as H3 \"0032 Declarative Structure\"; title translated and seq references dropped. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
    "targetUnitDigest": "f13c8f30093babf6efcf6b2fbb0062eecfe81a6db5527e400d33b8c3167a4cc5",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "13. ADR 0032 Multi-Role Team Harness"
    ],
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried."
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/specs/work-state.md",
    "unitDigest": "6fd8fff7875e44972d2faeeefb5f6b8f3c34e91dc78b712d314d09da62a9dfe1",
    "identityFingerprint": "a11ce9c3003ca34b9b0563e7637d90e0647c167bdeb73775f20574c349dec4b2",
    "claimId": "claim_45840c035132a9c46aa748567ae37648",
    "sourceAnchor": "iii-cấu-trúc-khai-báo-seq-18059-18060-18110-18189-18232-18242",
    "unitKind": "heading",
    "sourceUnitDigest": "fe8801065e62f36ed531f0954d2c07dbc7dfe367c30b7bc5c0f0835e17515efc",
    "claimKind": "specification",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "heading",
      "level": 4,
      "title": "III. Cấu trúc khai báo (seq 18059, 18060, 18110, 18189, 18232, 18242)",
      "anchor": "iii-cấu-trúc-khai-báo-seq-18059-18060-18110-18189-18232-18242",
      "githubAnchor": "iii-cấu-trúc-khai-báo-seq-18059-18060-18110-18189-18232-18242",
      "stableAnchor": "h-2b1899920546",
      "startLine": 2170,
      "endLine": 2170,
      "textDigest": "fe8801065e62f36ed531f0954d2c07dbc7dfe367c30b7bc5c0f0835e17515efc",
      "sample": "III. Cấu trúc khai báo (seq 18059, 18060, 18110, 18189, 18232, 18242)",
      "sectionPayloadDigest": "7dfb88e6ee480189beccd2e878bedb9e493d9bad07a27830301fddd053040d70",
      "followingBlockDigest": "7dfb88e6ee480189beccd2e878bedb9e493d9bad07a27830301fddd053040d70",
      "identityFingerprint": "a11ce9c3003ca34b9b0563e7637d90e0647c167bdeb73775f20574c349dec4b2",
      "ancestry": [
        "0002 — Mô hình việc phẳng",
        "0032 — Multi-role Team Harness: trục role/holder, handoff, và marketing-cockpit absorption"
      ],
      "text": "#### III. Cấu trúc khai báo (seq 18059, 18060, 18110, 18189, 18232, 18242)",
      "sectionText": "#### III. Cấu trúc khai báo (seq 18059, 18060, 18110, 18189, 18232, 18242)\n\n- **Hierarchy: domain → N workflow → item**. Coding đang gộp 1\n  workflow (bằng chứng gồng: discovery-verdict skip là nhánh vá; luật\n  bug-prove-cause khác bản chất feature; docs/chore chịu ceremony thừa)\n  — un-gộp thành `feature` (graph hiện tại, default) / `bugfix` /\n  `lightweight`. Selector tái dùng `kind` qua map `workflowFor` có\n  default; item cũ fold về default, không migration. Phân biệt đóng\n  đinh: **workflow** = shape lifecycle MỘT item; **template**\n  (`fgos expand`) = composition NHIỀU item thành cây.\n- **Ontology 4 tầng**: **task-spec** (phiếu giao việc —\n  contract: input/output/gates/verify-template; bất biến theo người làm)\n  / **skill** (know-how — của executor, compound-learn rewrite tự do) /\n  **knowledge** (chuyên môn domain — coding phần lớn nằm trong model\n  weights, marketing là tài sản file thật của cockpit) / **context**\n  (bối cảnh instance — chính là refs/docsRef/docs/CONTEXT.md/memory sẵn\n  có, không xây gì mới). Lợi ích tách đã kiểm chứng: `review-item` có 3\n  executor ngay hôm nay (người + /code-review + reviewer-agent tương\n  lai); engine chỉ parse được contract (sự cố tsk-59a: contract `Mode:`\n  chôn trong skill prose, đổi văn phong gãy regex engine); tần suất đổi\n  khác nhau cần mức gate khác nhau; có-phiếu-trước-có-tay-nghề-sau khi\n  port cockpit. Nói thật cả case không đáng tách: 1 executor vĩnh viễn,\n  không engine coupling → A-lite không tách đại trà.\n- **Collaboration trigger**: mỗi task-spec bắt buộc có bảng\n  trigger-prose per call-edge, per (workflow × stage) — *khi nào gọi,\n  reason gì, tới ai, bóng về mang gì*. Đây là câu trả lời cho \"làm sao\n  agent biết khi nào nên hỏi gì và hỏi ai\". Prototype đã chạy thật ở\n  dạng ngầm: filter material/grounded/answerable của exploring = trigger\n  advise; description của fgos-researching = trigger consult. Phân công\n  runtime: **prose dạy — soul quyết — guard chặn**; lệch pattern hiện ra\n  ở compound-learn qua call-summary/handoff events.\n- **Position vs Agent-type**: roleGraph đóng ở **5\n  position** (implementer / researcher / reviewer / helper /\n  advisor) — nguyên tắc *nở task trước, nở role sau*\n  (security-auditor = Reviewer + phiếu `audit-security`, không phải role\n  mới). Chức danh (PO/PM/TechLead/SE/Tester) = **agent-type definition\n  sẵn có** (`.claude/agents/*.md`), khai eligibility bằng đúng **một\n  field frontmatter `claims: [phiếu]`** — positions suy ra từ phiếu.\n  *(Ghi chú: Field `claims:` trong D-12 đã bị đảo ngược bởi decision D-20 tại `docs/history/core-foundation-domain-boundary/DISCUSSION.md:461` và `assignable-to` được đổi tên thành `agent:` bởi decision D-26 tại `:467`. Mô hình hiện hành: agent-type khai báo `skills:` trên agent-type definition; task-spec khai báo `requires-skill:` hoặc chỉ định agent-type cụ thể qua `agent:`).*\n  Không roster file, không humans registry, không agent-pools: pool size\n  = worker-slots sẵn có; spawn-on-demand = runner/dispatch sẵn có; thẩm\n  quyền human = pull-door verbs sẵn có (approve/answer do người chạy).\n  PM cổ điển đã được máy hoá (frontier/triage/stale/merge) — đúng nghĩa\n  ưu tiên #2 \"release con người\". Coding có ~13 phiếu: 6 phiếu stage của\n  implementer + 7 phiếu call-target.\n- **Binding soul↔role (seq 18229)**: role là thuộc tính *per-item*,\n  không phải ghế team. Cross-item: nhiều soul cùng position chạy song\n  song (parallel claims sẵn có). Trong item: call nhắm `(position,\n  phiếu)` → rơi vào frontier như work-order nhỏ → session mang\n  agent-type có phiếu đó trong `claims` tự claim (**pull**, không\n  push-assign), claim event ghi (sessionId, agent-type); **sticky trong\n  một call-thread** (vòng sau về đúng soul giữ context); **targeted\n  call** (`--to-soul`) là ngoại lệ có chủ đích, ghi event cho\n  compound-learn soi. Soul instance là runtime record sinh lúc claim —\n  không phải config. Solo mode thoái hoá êm: một soul mang nhiều\n  agent-type, self-review vẫn hữu hình trong log.\n- **Artifact-schema (seq 18242)**: ép schema tách đôi — **harness**\n  cấp validator + chokepoint (validate TRƯỚC dispatch để không đẻ item con\n  mồ côi; lỗi trả về machine-readable để agent tự sửa; luôn có đường soft\n  ghi reason, không chặn cứng), **schema là domain data** khai cạnh\n  task-spec. Cockpit ship 41 file JSON-Schema draft-07 chia hai họ:\n  declaration (~8: agent/skill/workflow/runtime — học ngay dạng doctor\n  check) và artifact (~33: brief/slot/calendar/persona/brand-profile —\n  đi cùng port marketing). KHÔNG làm artifact-schema cho coding: artifact\n  coding là văn xuôi, không phải structured data. Việc cockpit thường\n  xuyên sai schema là bằng chứng ỦNG HỘ gate cơ học cho structured data do\n  LLM sinh, đồng thời cảnh báo enforcement không có đường sửa thì item\n  kẹt."
    }
  },
  "currentTarget": {
    "unitKind": "heading",
    "level": 3,
    "title": "0032 Declarative Structure",
    "anchor": "0032-declarative-structure",
    "githubAnchor": "0032-declarative-structure",
    "stableAnchor": "h-adf0ca3b0ac2",
    "startLine": 817,
    "endLine": 817,
    "textDigest": "f13c8f30093babf6efcf6b2fbb0062eecfe81a6db5527e400d33b8c3167a4cc5",
    "sample": "0032 Declarative Structure",
    "sectionPayloadDigest": "7dfb88e6ee480189beccd2e878bedb9e493d9bad07a27830301fddd053040d70",
    "followingBlockDigest": "7dfb88e6ee480189beccd2e878bedb9e493d9bad07a27830301fddd053040d70",
    "identityFingerprint": "7eac8316c3744518701cbef21b5601416df21868600e5d3a49d800d2a2b34fb4",
    "ancestry": [
      "Retired Decision History: Work State",
      "13. ADR 0032 Multi-Role Team Harness"
    ],
    "text": "### 0032 Declarative Structure",
    "sectionText": "### 0032 Declarative Structure\n\n- **Hierarchy: domain → N workflow → item**. Coding đang gộp 1\n  workflow (bằng chứng gồng: discovery-verdict skip là nhánh vá; luật\n  bug-prove-cause khác bản chất feature; docs/chore chịu ceremony thừa)\n  — un-gộp thành `feature` (graph hiện tại, default) / `bugfix` /\n  `lightweight`. Selector tái dùng `kind` qua map `workflowFor` có\n  default; item cũ fold về default, không migration. Phân biệt đóng\n  đinh: **workflow** = shape lifecycle MỘT item; **template**\n  (`fgos expand`) = composition NHIỀU item thành cây.\n- **Ontology 4 tầng**: **task-spec** (phiếu giao việc —\n  contract: input/output/gates/verify-template; bất biến theo người làm)\n  / **skill** (know-how — của executor, compound-learn rewrite tự do) /\n  **knowledge** (chuyên môn domain — coding phần lớn nằm trong model\n  weights, marketing là tài sản file thật của cockpit) / **context**\n  (bối cảnh instance — chính là refs/docsRef/docs/CONTEXT.md/memory sẵn\n  có, không xây gì mới). Lợi ích tách đã kiểm chứng: `review-item` có 3\n  executor ngay hôm nay (người + /code-review + reviewer-agent tương\n  lai); engine chỉ parse được contract (sự cố tsk-59a: contract `Mode:`\n  chôn trong skill prose, đổi văn phong gãy regex engine); tần suất đổi\n  khác nhau cần mức gate khác nhau; có-phiếu-trước-có-tay-nghề-sau khi\n  port cockpit. Nói thật cả case không đáng tách: 1 executor vĩnh viễn,\n  không engine coupling → A-lite không tách đại trà.\n- **Collaboration trigger**: mỗi task-spec bắt buộc có bảng\n  trigger-prose per call-edge, per (workflow × stage) — *khi nào gọi,\n  reason gì, tới ai, bóng về mang gì*. Đây là câu trả lời cho \"làm sao\n  agent biết khi nào nên hỏi gì và hỏi ai\". Prototype đã chạy thật ở\n  dạng ngầm: filter material/grounded/answerable của exploring = trigger\n  advise; description của fgos-researching = trigger consult. Phân công\n  runtime: **prose dạy — soul quyết — guard chặn**; lệch pattern hiện ra\n  ở compound-learn qua call-summary/handoff events.\n- **Position vs Agent-type**: roleGraph đóng ở **5\n  position** (implementer / researcher / reviewer / helper /\n  advisor) — nguyên tắc *nở task trước, nở role sau*\n  (security-auditor = Reviewer + phiếu `audit-security`, không phải role\n  mới). Chức danh (PO/PM/TechLead/SE/Tester) = **agent-type definition\n  sẵn có** (`.claude/agents/*.md`), khai eligibility bằng đúng **một\n  field frontmatter `claims: [phiếu]`** — positions suy ra từ phiếu.\n  *(Ghi chú: Field `claims:` trong D-12 đã bị đảo ngược bởi decision D-20 tại `docs/history/core-foundation-domain-boundary/DISCUSSION.md:461` và `assignable-to` được đổi tên thành `agent:` bởi decision D-26 tại `:467`. Mô hình hiện hành: agent-type khai báo `skills:` trên agent-type definition; task-spec khai báo `requires-skill:` hoặc chỉ định agent-type cụ thể qua `agent:`).*\n  Không roster file, không humans registry, không agent-pools: pool size\n  = worker-slots sẵn có; spawn-on-demand = runner/dispatch sẵn có; thẩm\n  quyền human = pull-door verbs sẵn có (approve/answer do người chạy).\n  PM cổ điển đã được máy hoá (frontier/triage/stale/merge) — đúng nghĩa\n  ưu tiên #2 \"release con người\". Coding có ~13 phiếu: 6 phiếu stage của\n  implementer + 7 phiếu call-target.\n- **Binding soul↔role (seq 18229)**: role là thuộc tính *per-item*,\n  không phải ghế team. Cross-item: nhiều soul cùng position chạy song\n  song (parallel claims sẵn có). Trong item: call nhắm `(position,\n  phiếu)` → rơi vào frontier như work-order nhỏ → session mang\n  agent-type có phiếu đó trong `claims` tự claim (**pull**, không\n  push-assign), claim event ghi (sessionId, agent-type); **sticky trong\n  một call-thread** (vòng sau về đúng soul giữ context); **targeted\n  call** (`--to-soul`) là ngoại lệ có chủ đích, ghi event cho\n  compound-learn soi. Soul instance là runtime record sinh lúc claim —\n  không phải config. Solo mode thoái hoá êm: một soul mang nhiều\n  agent-type, self-review vẫn hữu hình trong log.\n- **Artifact-schema (seq 18242)**: ép schema tách đôi — **harness**\n  cấp validator + chokepoint (validate TRƯỚC dispatch để không đẻ item con\n  mồ côi; lỗi trả về machine-readable để agent tự sửa; luôn có đường soft\n  ghi reason, không chặn cứng), **schema là domain data** khai cạnh\n  task-spec. Cockpit ship 41 file JSON-Schema draft-07 chia hai họ:\n  declaration (~8: agent/skill/workflow/runtime — học ngay dạng doctor\n  check) và artifact (~33: brief/slot/calendar/persona/brand-profile —\n  đi cùng port marketing). KHÔNG làm artifact-schema cho coding: artifact\n  coding là văn xuôi, không phải structured data. Việc cockpit thường\n  xuyên sai schema là bằng chứng ỦNG HỘ gate cơ học cho structured data do\n  LLM sinh, đồng thời cảnh báo enforcement không có đường sửa thì item\n  kẹt."
  },
  "sourceTargetDigestsUnequal": true,
  "classObservation": {
    "class": "Judgment",
    "reason": "no target digest match",
    "targetUnit": null
  },
  "mechanicalRequired": true,
  "deepRequired": true,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_45840c035132a9c46aa748567ae37648"
}
```

## Entry claim_10986602d5cab816cf923616dc6b58f8

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_10986602d5cab816cf923616dc6b58f8",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "b-decisions-second",
  "before": {
    "claimId": "claim_10986602d5cab816cf923616dc6b58f8",
    "sourceUnitDigest": "7dfb88e6ee480189",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-87",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Long ADR 0032 declarative-structure list (hierarchy domain, workflow, item and the declared structures); 66 lines carried verbatim as one block.",
    "reviewedBy": "independent reviewer (review-b-decisions-second)",
    "reviewedAt": "2026-10-07",
    "targetUnitDigest": "7dfb88e6ee480189beccd2e878bedb9e"
  },
  "currentDecision": {
    "claimId": "claim_10986602d5cab816cf923616dc6b58f8",
    "sourceUnitDigest": "7dfb88e6ee480189",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-87",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "Long ADR 0032 declarative-structure list (hierarchy domain, workflow, item and the declared structures); 66 lines carried verbatim as one block. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
    "targetUnitDigest": "7dfb88e6ee480189beccd2e878bedb9e493d9bad07a27830301fddd053040d70",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "13. ADR 0032 Multi-Role Team Harness",
      "0032 Declarative Structure"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/specs/work-state.md",
    "unitDigest": "7a07cb6281e531e23a10b3264904fc8a0468a3c799b1dec5e88489cd43335246",
    "identityFingerprint": "7a07cb6281e531e23a10b3264904fc8a0468a3c799b1dec5e88489cd43335246",
    "claimId": "claim_10986602d5cab816cf923616dc6b58f8",
    "sourceAnchor": "unheaded-block-198",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "7dfb88e6ee480189beccd2e878bedb9e493d9bad07a27830301fddd053040d70",
    "claimKind": "specification",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-198",
      "githubAnchor": "unheaded-block-198",
      "stableAnchor": "unheaded-block-198",
      "title": "Unheaded block 198",
      "startLine": 2172,
      "endLine": 2237,
      "textDigest": "7dfb88e6ee480189beccd2e878bedb9e493d9bad07a27830301fddd053040d70",
      "sample": "- **Hierarchy: domain → N workflow → item**. Coding đang gộp 1\n  workflow (bằng chứng gồng: discovery-verdict skip là nhánh vá; luật\n  bug-prove-cause khác bản chất feature; docs/c",
      "identityFingerprint": "7a07cb6281e531e23a10b3264904fc8a0468a3c799b1dec5e88489cd43335246",
      "ancestry": [
        "0002 — Mô hình việc phẳng",
        "0032 — Multi-role Team Harness: trục role/holder, handoff, và marketing-cockpit absorption",
        "III. Cấu trúc khai báo (seq 18059, 18060, 18110, 18189, 18232, 18242)"
      ],
      "text": "- **Hierarchy: domain → N workflow → item**. Coding đang gộp 1\n  workflow (bằng chứng gồng: discovery-verdict skip là nhánh vá; luật\n  bug-prove-cause khác bản chất feature; docs/chore chịu ceremony thừa)\n  — un-gộp thành `feature` (graph hiện tại, default) / `bugfix` /\n  `lightweight`. Selector tái dùng `kind` qua map `workflowFor` có\n  default; item cũ fold về default, không migration. Phân biệt đóng\n  đinh: **workflow** = shape lifecycle MỘT item; **template**\n  (`fgos expand`) = composition NHIỀU item thành cây.\n- **Ontology 4 tầng**: **task-spec** (phiếu giao việc —\n  contract: input/output/gates/verify-template; bất biến theo người làm)\n  / **skill** (know-how — của executor, compound-learn rewrite tự do) /\n  **knowledge** (chuyên môn domain — coding phần lớn nằm trong model\n  weights, marketing là tài sản file thật của cockpit) / **context**\n  (bối cảnh instance — chính là refs/docsRef/docs/CONTEXT.md/memory sẵn\n  có, không xây gì mới). Lợi ích tách đã kiểm chứng: `review-item` có 3\n  executor ngay hôm nay (người + /code-review + reviewer-agent tương\n  lai); engine chỉ parse được contract (sự cố tsk-59a: contract `Mode:`\n  chôn trong skill prose, đổi văn phong gãy regex engine); tần suất đổi\n  khác nhau cần mức gate khác nhau; có-phiếu-trước-có-tay-nghề-sau khi\n  port cockpit. Nói thật cả case không đáng tách: 1 executor vĩnh viễn,\n  không engine coupling → A-lite không tách đại trà.\n- **Collaboration trigger**: mỗi task-spec bắt buộc có bảng\n  trigger-prose per call-edge, per (workflow × stage) — *khi nào gọi,\n  reason gì, tới ai, bóng về mang gì*. Đây là câu trả lời cho \"làm sao\n  agent biết khi nào nên hỏi gì và hỏi ai\". Prototype đã chạy thật ở\n  dạng ngầm: filter material/grounded/answerable của exploring = trigger\n  advise; description của fgos-researching = trigger consult. Phân công\n  runtime: **prose dạy — soul quyết — guard chặn**; lệch pattern hiện ra\n  ở compound-learn qua call-summary/handoff events.\n- **Position vs Agent-type**: roleGraph đóng ở **5\n  position** (implementer / researcher / reviewer / helper /\n  advisor) — nguyên tắc *nở task trước, nở role sau*\n  (security-auditor = Reviewer + phiếu `audit-security`, không phải role\n  mới). Chức danh (PO/PM/TechLead/SE/Tester) = **agent-type definition\n  sẵn có** (`.claude/agents/*.md`), khai eligibility bằng đúng **một\n  field frontmatter `claims: [phiếu]`** — positions suy ra từ phiếu.\n  *(Ghi chú: Field `claims:` trong D-12 đã bị đảo ngược bởi decision D-20 tại `docs/history/core-foundation-domain-boundary/DISCUSSION.md:461` và `assignable-to` được đổi tên thành `agent:` bởi decision D-26 tại `:467`. Mô hình hiện hành: agent-type khai báo `skills:` trên agent-type definition; task-spec khai báo `requires-skill:` hoặc chỉ định agent-type cụ thể qua `agent:`).*\n  Không roster file, không humans registry, không agent-pools: pool size\n  = worker-slots sẵn có; spawn-on-demand = runner/dispatch sẵn có; thẩm\n  quyền human = pull-door verbs sẵn có (approve/answer do người chạy).\n  PM cổ điển đã được máy hoá (frontier/triage/stale/merge) — đúng nghĩa\n  ưu tiên #2 \"release con người\". Coding có ~13 phiếu: 6 phiếu stage của\n  implementer + 7 phiếu call-target.\n- **Binding soul↔role (seq 18229)**: role là thuộc tính *per-item*,\n  không phải ghế team. Cross-item: nhiều soul cùng position chạy song\n  song (parallel claims sẵn có). Trong item: call nhắm `(position,\n  phiếu)` → rơi vào frontier như work-order nhỏ → session mang\n  agent-type có phiếu đó trong `claims` tự claim (**pull**, không\n  push-assign), claim event ghi (sessionId, agent-type); **sticky trong\n  một call-thread** (vòng sau về đúng soul giữ context); **targeted\n  call** (`--to-soul`) là ngoại lệ có chủ đích, ghi event cho\n  compound-learn soi. Soul instance là runtime record sinh lúc claim —\n  không phải config. Solo mode thoái hoá êm: một soul mang nhiều\n  agent-type, self-review vẫn hữu hình trong log.\n- **Artifact-schema (seq 18242)**: ép schema tách đôi — **harness**\n  cấp validator + chokepoint (validate TRƯỚC dispatch để không đẻ item con\n  mồ côi; lỗi trả về machine-readable để agent tự sửa; luôn có đường soft\n  ghi reason, không chặn cứng), **schema là domain data** khai cạnh\n  task-spec. Cockpit ship 41 file JSON-Schema draft-07 chia hai họ:\n  declaration (~8: agent/skill/workflow/runtime — học ngay dạng doctor\n  check) và artifact (~33: brief/slot/calendar/persona/brand-profile —\n  đi cùng port marketing). KHÔNG làm artifact-schema cho coding: artifact\n  coding là văn xuôi, không phải structured data. Việc cockpit thường\n  xuyên sai schema là bằng chứng ỦNG HỘ gate cơ học cho structured data do\n  LLM sinh, đồng thời cảnh báo enforcement không có đường sửa thì item\n  kẹt."
    }
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-87",
    "githubAnchor": "unheaded-block-87",
    "stableAnchor": "unheaded-block-87",
    "title": "Unheaded block 87",
    "startLine": 819,
    "endLine": 884,
    "textDigest": "7dfb88e6ee480189beccd2e878bedb9e493d9bad07a27830301fddd053040d70",
    "sample": "- **Hierarchy: domain → N workflow → item**. Coding đang gộp 1\n  workflow (bằng chứng gồng: discovery-verdict skip là nhánh vá; luật\n  bug-prove-cause khác bản chất feature; docs/c",
    "identityFingerprint": "7a07cb6281e531e23a10b3264904fc8a0468a3c799b1dec5e88489cd43335246",
    "ancestry": [
      "Retired Decision History: Work State",
      "13. ADR 0032 Multi-Role Team Harness",
      "0032 Declarative Structure"
    ],
    "text": "- **Hierarchy: domain → N workflow → item**. Coding đang gộp 1\n  workflow (bằng chứng gồng: discovery-verdict skip là nhánh vá; luật\n  bug-prove-cause khác bản chất feature; docs/chore chịu ceremony thừa)\n  — un-gộp thành `feature` (graph hiện tại, default) / `bugfix` /\n  `lightweight`. Selector tái dùng `kind` qua map `workflowFor` có\n  default; item cũ fold về default, không migration. Phân biệt đóng\n  đinh: **workflow** = shape lifecycle MỘT item; **template**\n  (`fgos expand`) = composition NHIỀU item thành cây.\n- **Ontology 4 tầng**: **task-spec** (phiếu giao việc —\n  contract: input/output/gates/verify-template; bất biến theo người làm)\n  / **skill** (know-how — của executor, compound-learn rewrite tự do) /\n  **knowledge** (chuyên môn domain — coding phần lớn nằm trong model\n  weights, marketing là tài sản file thật của cockpit) / **context**\n  (bối cảnh instance — chính là refs/docsRef/docs/CONTEXT.md/memory sẵn\n  có, không xây gì mới). Lợi ích tách đã kiểm chứng: `review-item` có 3\n  executor ngay hôm nay (người + /code-review + reviewer-agent tương\n  lai); engine chỉ parse được contract (sự cố tsk-59a: contract `Mode:`\n  chôn trong skill prose, đổi văn phong gãy regex engine); tần suất đổi\n  khác nhau cần mức gate khác nhau; có-phiếu-trước-có-tay-nghề-sau khi\n  port cockpit. Nói thật cả case không đáng tách: 1 executor vĩnh viễn,\n  không engine coupling → A-lite không tách đại trà.\n- **Collaboration trigger**: mỗi task-spec bắt buộc có bảng\n  trigger-prose per call-edge, per (workflow × stage) — *khi nào gọi,\n  reason gì, tới ai, bóng về mang gì*. Đây là câu trả lời cho \"làm sao\n  agent biết khi nào nên hỏi gì và hỏi ai\". Prototype đã chạy thật ở\n  dạng ngầm: filter material/grounded/answerable của exploring = trigger\n  advise; description của fgos-researching = trigger consult. Phân công\n  runtime: **prose dạy — soul quyết — guard chặn**; lệch pattern hiện ra\n  ở compound-learn qua call-summary/handoff events.\n- **Position vs Agent-type**: roleGraph đóng ở **5\n  position** (implementer / researcher / reviewer / helper /\n  advisor) — nguyên tắc *nở task trước, nở role sau*\n  (security-auditor = Reviewer + phiếu `audit-security`, không phải role\n  mới). Chức danh (PO/PM/TechLead/SE/Tester) = **agent-type definition\n  sẵn có** (`.claude/agents/*.md`), khai eligibility bằng đúng **một\n  field frontmatter `claims: [phiếu]`** — positions suy ra từ phiếu.\n  *(Ghi chú: Field `claims:` trong D-12 đã bị đảo ngược bởi decision D-20 tại `docs/history/core-foundation-domain-boundary/DISCUSSION.md:461` và `assignable-to` được đổi tên thành `agent:` bởi decision D-26 tại `:467`. Mô hình hiện hành: agent-type khai báo `skills:` trên agent-type definition; task-spec khai báo `requires-skill:` hoặc chỉ định agent-type cụ thể qua `agent:`).*\n  Không roster file, không humans registry, không agent-pools: pool size\n  = worker-slots sẵn có; spawn-on-demand = runner/dispatch sẵn có; thẩm\n  quyền human = pull-door verbs sẵn có (approve/answer do người chạy).\n  PM cổ điển đã được máy hoá (frontier/triage/stale/merge) — đúng nghĩa\n  ưu tiên #2 \"release con người\". Coding có ~13 phiếu: 6 phiếu stage của\n  implementer + 7 phiếu call-target.\n- **Binding soul↔role (seq 18229)**: role là thuộc tính *per-item*,\n  không phải ghế team. Cross-item: nhiều soul cùng position chạy song\n  song (parallel claims sẵn có). Trong item: call nhắm `(position,\n  phiếu)` → rơi vào frontier như work-order nhỏ → session mang\n  agent-type có phiếu đó trong `claims` tự claim (**pull**, không\n  push-assign), claim event ghi (sessionId, agent-type); **sticky trong\n  một call-thread** (vòng sau về đúng soul giữ context); **targeted\n  call** (`--to-soul`) là ngoại lệ có chủ đích, ghi event cho\n  compound-learn soi. Soul instance là runtime record sinh lúc claim —\n  không phải config. Solo mode thoái hoá êm: một soul mang nhiều\n  agent-type, self-review vẫn hữu hình trong log.\n- **Artifact-schema (seq 18242)**: ép schema tách đôi — **harness**\n  cấp validator + chokepoint (validate TRƯỚC dispatch để không đẻ item con\n  mồ côi; lỗi trả về machine-readable để agent tự sửa; luôn có đường soft\n  ghi reason, không chặn cứng), **schema là domain data** khai cạnh\n  task-spec. Cockpit ship 41 file JSON-Schema draft-07 chia hai họ:\n  declaration (~8: agent/skill/workflow/runtime — học ngay dạng doctor\n  check) và artifact (~33: brief/slot/calendar/persona/brand-profile —\n  đi cùng port marketing). KHÔNG làm artifact-schema cho coding: artifact\n  coding là văn xuôi, không phải structured data. Việc cockpit thường\n  xuyên sai schema là bằng chứng ỦNG HỘ gate cơ học cho structured data do\n  LLM sinh, đồng thời cảnh báo enforcement không có đường sửa thì item\n  kẹt."
  },
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Weak-exact",
    "reason": "ancestor headings differ; document exact share below one half",
    "targetUnit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-87",
      "githubAnchor": "unheaded-block-87",
      "stableAnchor": "unheaded-block-87",
      "title": "Unheaded block 87",
      "startLine": 819,
      "endLine": 884,
      "textDigest": "7dfb88e6ee480189beccd2e878bedb9e493d9bad07a27830301fddd053040d70",
      "sample": "- **Hierarchy: domain → N workflow → item**. Coding đang gộp 1\n  workflow (bằng chứng gồng: discovery-verdict skip là nhánh vá; luật\n  bug-prove-cause khác bản chất feature; docs/c",
      "identityFingerprint": "7a07cb6281e531e23a10b3264904fc8a0468a3c799b1dec5e88489cd43335246",
      "ancestry": [
        "Retired Decision History: Work State",
        "13. ADR 0032 Multi-Role Team Harness",
        "0032 Declarative Structure"
      ],
      "text": "- **Hierarchy: domain → N workflow → item**. Coding đang gộp 1\n  workflow (bằng chứng gồng: discovery-verdict skip là nhánh vá; luật\n  bug-prove-cause khác bản chất feature; docs/chore chịu ceremony thừa)\n  — un-gộp thành `feature` (graph hiện tại, default) / `bugfix` /\n  `lightweight`. Selector tái dùng `kind` qua map `workflowFor` có\n  default; item cũ fold về default, không migration. Phân biệt đóng\n  đinh: **workflow** = shape lifecycle MỘT item; **template**\n  (`fgos expand`) = composition NHIỀU item thành cây.\n- **Ontology 4 tầng**: **task-spec** (phiếu giao việc —\n  contract: input/output/gates/verify-template; bất biến theo người làm)\n  / **skill** (know-how — của executor, compound-learn rewrite tự do) /\n  **knowledge** (chuyên môn domain — coding phần lớn nằm trong model\n  weights, marketing là tài sản file thật của cockpit) / **context**\n  (bối cảnh instance — chính là refs/docsRef/docs/CONTEXT.md/memory sẵn\n  có, không xây gì mới). Lợi ích tách đã kiểm chứng: `review-item` có 3\n  executor ngay hôm nay (người + /code-review + reviewer-agent tương\n  lai); engine chỉ parse được contract (sự cố tsk-59a: contract `Mode:`\n  chôn trong skill prose, đổi văn phong gãy regex engine); tần suất đổi\n  khác nhau cần mức gate khác nhau; có-phiếu-trước-có-tay-nghề-sau khi\n  port cockpit. Nói thật cả case không đáng tách: 1 executor vĩnh viễn,\n  không engine coupling → A-lite không tách đại trà.\n- **Collaboration trigger**: mỗi task-spec bắt buộc có bảng\n  trigger-prose per call-edge, per (workflow × stage) — *khi nào gọi,\n  reason gì, tới ai, bóng về mang gì*. Đây là câu trả lời cho \"làm sao\n  agent biết khi nào nên hỏi gì và hỏi ai\". Prototype đã chạy thật ở\n  dạng ngầm: filter material/grounded/answerable của exploring = trigger\n  advise; description của fgos-researching = trigger consult. Phân công\n  runtime: **prose dạy — soul quyết — guard chặn**; lệch pattern hiện ra\n  ở compound-learn qua call-summary/handoff events.\n- **Position vs Agent-type**: roleGraph đóng ở **5\n  position** (implementer / researcher / reviewer / helper /\n  advisor) — nguyên tắc *nở task trước, nở role sau*\n  (security-auditor = Reviewer + phiếu `audit-security`, không phải role\n  mới). Chức danh (PO/PM/TechLead/SE/Tester) = **agent-type definition\n  sẵn có** (`.claude/agents/*.md`), khai eligibility bằng đúng **một\n  field frontmatter `claims: [phiếu]`** — positions suy ra từ phiếu.\n  *(Ghi chú: Field `claims:` trong D-12 đã bị đảo ngược bởi decision D-20 tại `docs/history/core-foundation-domain-boundary/DISCUSSION.md:461` và `assignable-to` được đổi tên thành `agent:` bởi decision D-26 tại `:467`. Mô hình hiện hành: agent-type khai báo `skills:` trên agent-type definition; task-spec khai báo `requires-skill:` hoặc chỉ định agent-type cụ thể qua `agent:`).*\n  Không roster file, không humans registry, không agent-pools: pool size\n  = worker-slots sẵn có; spawn-on-demand = runner/dispatch sẵn có; thẩm\n  quyền human = pull-door verbs sẵn có (approve/answer do người chạy).\n  PM cổ điển đã được máy hoá (frontier/triage/stale/merge) — đúng nghĩa\n  ưu tiên #2 \"release con người\". Coding có ~13 phiếu: 6 phiếu stage của\n  implementer + 7 phiếu call-target.\n- **Binding soul↔role (seq 18229)**: role là thuộc tính *per-item*,\n  không phải ghế team. Cross-item: nhiều soul cùng position chạy song\n  song (parallel claims sẵn có). Trong item: call nhắm `(position,\n  phiếu)` → rơi vào frontier như work-order nhỏ → session mang\n  agent-type có phiếu đó trong `claims` tự claim (**pull**, không\n  push-assign), claim event ghi (sessionId, agent-type); **sticky trong\n  một call-thread** (vòng sau về đúng soul giữ context); **targeted\n  call** (`--to-soul`) là ngoại lệ có chủ đích, ghi event cho\n  compound-learn soi. Soul instance là runtime record sinh lúc claim —\n  không phải config. Solo mode thoái hoá êm: một soul mang nhiều\n  agent-type, self-review vẫn hữu hình trong log.\n- **Artifact-schema (seq 18242)**: ép schema tách đôi — **harness**\n  cấp validator + chokepoint (validate TRƯỚC dispatch để không đẻ item con\n  mồ côi; lỗi trả về machine-readable để agent tự sửa; luôn có đường soft\n  ghi reason, không chặn cứng), **schema là domain data** khai cạnh\n  task-spec. Cockpit ship 41 file JSON-Schema draft-07 chia hai họ:\n  declaration (~8: agent/skill/workflow/runtime — học ngay dạng doctor\n  check) và artifact (~33: brief/slot/calendar/persona/brand-profile —\n  đi cùng port marketing). KHÔNG làm artifact-schema cho coding: artifact\n  coding là văn xuôi, không phải structured data. Việc cockpit thường\n  xuyên sai schema là bằng chứng ỦNG HỘ gate cơ học cho structured data do\n  LLM sinh, đồng thời cảnh báo enforcement không có đường sửa thì item\n  kẹt."
    }
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_10986602d5cab816cf923616dc6b58f8"
}
```

## Entry claim_7baf6e6911d7bdc8cbb66425d0aff57a

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_7baf6e6911d7bdc8cbb66425d0aff57a",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "b-decisions-second",
  "before": {
    "claimId": "claim_7baf6e6911d7bdc8cbb66425d0aff57a",
    "sourceUnitDigest": "58d933902652fcbf",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "0032-implementation-sequence",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Source H4 \"IV. Trình tự triển khai (seq 18030)\" is carried as H3 \"0032 Implementation Sequence\"; title translated.",
    "reviewedBy": "independent reviewer (review-b-decisions-second)",
    "reviewedAt": "2026-10-07",
    "targetUnitDigest": "861c399f16053144093e08b8bf68e573"
  },
  "currentDecision": {
    "claimId": "claim_7baf6e6911d7bdc8cbb66425d0aff57a",
    "sourceUnitDigest": "58d933902652fcbf",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "0032-implementation-sequence",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "Source H4 \"IV. Trình tự triển khai (seq 18030)\" is carried as H3 \"0032 Implementation Sequence\"; title translated. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
    "targetUnitDigest": "861c399f16053144093e08b8bf68e573b9afa26758d326b719c0bb5ddcd0d88f",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "13. ADR 0032 Multi-Role Team Harness"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/specs/work-state.md",
    "unitDigest": "8e12a63985d112c05318ec00daa8c6af194adb0da87006a01f792ea5e1124e1d",
    "identityFingerprint": "61c037b4446b419d35351813e761ad99bee6bdecfbc70b6266de40c0ccf2a72a",
    "claimId": "claim_7baf6e6911d7bdc8cbb66425d0aff57a",
    "sourceAnchor": "iv-trình-tự-triển-khai-seq-18030",
    "unitKind": "heading",
    "sourceUnitDigest": "58d933902652fcbf9670c78092b0d222429d51933968062e729a6534b5ea3b40",
    "claimKind": "specification",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "heading",
      "level": 4,
      "title": "IV. Trình tự triển khai (seq 18030)",
      "anchor": "iv-trình-tự-triển-khai-seq-18030",
      "githubAnchor": "iv-trình-tự-triển-khai-seq-18030",
      "stableAnchor": "h-90b93e5c3cd8",
      "startLine": 2239,
      "endLine": 2239,
      "textDigest": "58d933902652fcbf9670c78092b0d222429d51933968062e729a6534b5ea3b40",
      "sample": "IV. Trình tự triển khai (seq 18030)",
      "sectionPayloadDigest": "4f8af599aa278a8c4d800f838bb81e1ab8ed7dc789bbfdd198ea361070618ad9",
      "followingBlockDigest": "4b806f05cc974fa81ae9b0ebd50789a568fb41a274c5ffb11865accbfb2ef9cd",
      "identityFingerprint": "61c037b4446b419d35351813e761ad99bee6bdecfbc70b6266de40c0ccf2a72a",
      "ancestry": [
        "0002 — Mô hình việc phẳng",
        "0032 — Multi-role Team Harness: trục role/holder, handoff, và marketing-cockpit absorption"
      ],
      "text": "#### IV. Trình tự triển khai (seq 18030)",
      "sectionText": "#### IV. Trình tự triển khai (seq 18030)\n\n**Coding trước** (quyết định người dùng, đảo đề xuất marketing-first ban\nđầu): coding đã chứa đủ 4 tương tác call ở dạng ngầm — chỉ nâng thành\nmove hữu hình, không phát minh tương tác mới:\n\n| Reason | Tương tác ngầm hiện có |\n|---|---|\n| consult | `fgos-researching` gọi giữa exploring/planning |\n| review | `code-review` / vòng approve-reject |\n| assist | subagent fanout (`fgos-fanout`, Agent tool) |\n| advise | `fgos ask`/`answer` + `awaiting-human` |\n\nThứ tự: ① role-axis + handoff đáp lên graph đơn hiện tại → ② un-gộp\ncoding thành 3 workflow → ③ task-spec A-lite (~13 phiếu, chạy song song\n①② được) → ④ marketing (DOMAINS entry + port + template + judge-gate)."
    }
  },
  "currentTarget": {
    "unitKind": "heading",
    "level": 3,
    "title": "0032 Implementation Sequence",
    "anchor": "0032-implementation-sequence",
    "githubAnchor": "0032-implementation-sequence",
    "stableAnchor": "h-dee19789986d",
    "startLine": 886,
    "endLine": 886,
    "textDigest": "861c399f16053144093e08b8bf68e573b9afa26758d326b719c0bb5ddcd0d88f",
    "sample": "0032 Implementation Sequence",
    "sectionPayloadDigest": "4f8af599aa278a8c4d800f838bb81e1ab8ed7dc789bbfdd198ea361070618ad9",
    "followingBlockDigest": "4b806f05cc974fa81ae9b0ebd50789a568fb41a274c5ffb11865accbfb2ef9cd",
    "identityFingerprint": "12d8d2f0e1542475d1b08907545f7fce69f48f2ee056ac4fa8c54a6f52229ba0",
    "ancestry": [
      "Retired Decision History: Work State",
      "13. ADR 0032 Multi-Role Team Harness"
    ],
    "text": "### 0032 Implementation Sequence",
    "sectionText": "### 0032 Implementation Sequence\n\n**Coding trước** (quyết định người dùng, đảo đề xuất marketing-first ban\nđầu): coding đã chứa đủ 4 tương tác call ở dạng ngầm — chỉ nâng thành\nmove hữu hình, không phát minh tương tác mới:\n\n| Reason | Tương tác ngầm hiện có |\n|---|---|\n| consult | `fgos-researching` gọi giữa exploring/planning |\n| review | `code-review` / vòng approve-reject |\n| assist | subagent fanout (`fgos-fanout`, Agent tool) |\n| advise | `fgos ask`/`answer` + `awaiting-human` |\n\nThứ tự: ① role-axis + handoff đáp lên graph đơn hiện tại → ② un-gộp\ncoding thành 3 workflow → ③ task-spec A-lite (~13 phiếu, chạy song song\n①② được) → ④ marketing (DOMAINS entry + port + template + judge-gate)."
  },
  "sourceTargetDigestsUnequal": true,
  "classObservation": {
    "class": "Judgment",
    "reason": "no target digest match",
    "targetUnit": null
  },
  "mechanicalRequired": true,
  "deepRequired": true,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_7baf6e6911d7bdc8cbb66425d0aff57a"
}
```

## Entry claim_2e0270967476b583f5548c2d0632c6f7

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_2e0270967476b583f5548c2d0632c6f7",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "b-decisions-second",
  "before": {
    "claimId": "claim_2e0270967476b583f5548c2d0632c6f7",
    "sourceUnitDigest": "4b806f05cc974fa8",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-88",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "ADR 0032 statement that coding goes first (user decision reversing the proposal); carried verbatim.",
    "reviewedBy": "independent reviewer (review-b-decisions-second)",
    "reviewedAt": "2026-10-07",
    "targetUnitDigest": "4b806f05cc974fa81ae9b0ebd50789a5"
  },
  "currentDecision": {
    "claimId": "claim_2e0270967476b583f5548c2d0632c6f7",
    "sourceUnitDigest": "4b806f05cc974fa8",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-88",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "ADR 0032 statement that coding goes first (user decision reversing the proposal); carried verbatim. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
    "targetUnitDigest": "4b806f05cc974fa81ae9b0ebd50789a568fb41a274c5ffb11865accbfb2ef9cd",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "13. ADR 0032 Multi-Role Team Harness",
      "0032 Implementation Sequence"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/specs/work-state.md",
    "unitDigest": "9baaf77c0bc77a04c6dea0de5e48abdbfcb4f9d06b6635727171d211f9f7d3da",
    "identityFingerprint": "9baaf77c0bc77a04c6dea0de5e48abdbfcb4f9d06b6635727171d211f9f7d3da",
    "claimId": "claim_2e0270967476b583f5548c2d0632c6f7",
    "sourceAnchor": "unheaded-block-199",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "4b806f05cc974fa81ae9b0ebd50789a568fb41a274c5ffb11865accbfb2ef9cd",
    "claimKind": "specification",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-199",
      "githubAnchor": "unheaded-block-199",
      "stableAnchor": "unheaded-block-199",
      "title": "Unheaded block 199",
      "startLine": 2241,
      "endLine": 2243,
      "textDigest": "4b806f05cc974fa81ae9b0ebd50789a568fb41a274c5ffb11865accbfb2ef9cd",
      "sample": "**Coding trước** (quyết định người dùng, đảo đề xuất marketing-first ban\nđầu): coding đã chứa đủ 4 tương tác call ở dạng ngầm — chỉ nâng thành\nmove hữu hình, không phát minh tương ",
      "identityFingerprint": "9baaf77c0bc77a04c6dea0de5e48abdbfcb4f9d06b6635727171d211f9f7d3da",
      "ancestry": [
        "0002 — Mô hình việc phẳng",
        "0032 — Multi-role Team Harness: trục role/holder, handoff, và marketing-cockpit absorption",
        "IV. Trình tự triển khai (seq 18030)"
      ],
      "text": "**Coding trước** (quyết định người dùng, đảo đề xuất marketing-first ban\nđầu): coding đã chứa đủ 4 tương tác call ở dạng ngầm — chỉ nâng thành\nmove hữu hình, không phát minh tương tác mới:"
    }
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-88",
    "githubAnchor": "unheaded-block-88",
    "stableAnchor": "unheaded-block-88",
    "title": "Unheaded block 88",
    "startLine": 888,
    "endLine": 890,
    "textDigest": "4b806f05cc974fa81ae9b0ebd50789a568fb41a274c5ffb11865accbfb2ef9cd",
    "sample": "**Coding trước** (quyết định người dùng, đảo đề xuất marketing-first ban\nđầu): coding đã chứa đủ 4 tương tác call ở dạng ngầm — chỉ nâng thành\nmove hữu hình, không phát minh tương ",
    "identityFingerprint": "9baaf77c0bc77a04c6dea0de5e48abdbfcb4f9d06b6635727171d211f9f7d3da",
    "ancestry": [
      "Retired Decision History: Work State",
      "13. ADR 0032 Multi-Role Team Harness",
      "0032 Implementation Sequence"
    ],
    "text": "**Coding trước** (quyết định người dùng, đảo đề xuất marketing-first ban\nđầu): coding đã chứa đủ 4 tương tác call ở dạng ngầm — chỉ nâng thành\nmove hữu hình, không phát minh tương tác mới:"
  },
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Weak-exact",
    "reason": "ancestor headings differ; document exact share below one half",
    "targetUnit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-88",
      "githubAnchor": "unheaded-block-88",
      "stableAnchor": "unheaded-block-88",
      "title": "Unheaded block 88",
      "startLine": 888,
      "endLine": 890,
      "textDigest": "4b806f05cc974fa81ae9b0ebd50789a568fb41a274c5ffb11865accbfb2ef9cd",
      "sample": "**Coding trước** (quyết định người dùng, đảo đề xuất marketing-first ban\nđầu): coding đã chứa đủ 4 tương tác call ở dạng ngầm — chỉ nâng thành\nmove hữu hình, không phát minh tương ",
      "identityFingerprint": "9baaf77c0bc77a04c6dea0de5e48abdbfcb4f9d06b6635727171d211f9f7d3da",
      "ancestry": [
        "Retired Decision History: Work State",
        "13. ADR 0032 Multi-Role Team Harness",
        "0032 Implementation Sequence"
      ],
      "text": "**Coding trước** (quyết định người dùng, đảo đề xuất marketing-first ban\nđầu): coding đã chứa đủ 4 tương tác call ở dạng ngầm — chỉ nâng thành\nmove hữu hình, không phát minh tương tác mới:"
    }
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_2e0270967476b583f5548c2d0632c6f7"
}
```

## Entry claim_b7d1849e7cde5d799b984dbf0ea3bcff

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_b7d1849e7cde5d799b984dbf0ea3bcff",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "b-decisions-second",
  "before": {
    "claimId": "claim_b7d1849e7cde5d799b984dbf0ea3bcff",
    "sourceUnitDigest": "d6ebd90319d8f7c2",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-89",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "ADR 0032 table of reason versus existing implicit interaction; carried verbatim.",
    "reviewedBy": "independent reviewer (review-b-decisions-second)",
    "reviewedAt": "2026-10-07",
    "targetUnitDigest": "d6ebd90319d8f7c2c586f0790b3649a8"
  },
  "currentDecision": {
    "claimId": "claim_b7d1849e7cde5d799b984dbf0ea3bcff",
    "sourceUnitDigest": "d6ebd90319d8f7c2",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-89",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "ADR 0032 table of reason versus existing implicit interaction; carried verbatim. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
    "targetUnitDigest": "d6ebd90319d8f7c2c586f0790b3649a8f9bad951d61aa6918d0aa40c7918483a",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "13. ADR 0032 Multi-Role Team Harness",
      "0032 Implementation Sequence"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/specs/work-state.md",
    "unitDigest": "6120d451f5fb283d6bd7f3b1686e31d8375f4bafed5e287390f3ed6ab65b38d6",
    "identityFingerprint": "6120d451f5fb283d6bd7f3b1686e31d8375f4bafed5e287390f3ed6ab65b38d6",
    "claimId": "claim_b7d1849e7cde5d799b984dbf0ea3bcff",
    "sourceAnchor": "unheaded-block-200",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "d6ebd90319d8f7c2c586f0790b3649a8f9bad951d61aa6918d0aa40c7918483a",
    "claimKind": "specification",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-200",
      "githubAnchor": "unheaded-block-200",
      "stableAnchor": "unheaded-block-200",
      "title": "Unheaded block 200",
      "startLine": 2245,
      "endLine": 2250,
      "textDigest": "d6ebd90319d8f7c2c586f0790b3649a8f9bad951d61aa6918d0aa40c7918483a",
      "sample": "| Reason | Tương tác ngầm hiện có |\n|---|---|\n| consult | `fgos-researching` gọi giữa exploring/planning |\n| review | `code-review` / vòng approve-reject |\n| assist | subagent fano",
      "identityFingerprint": "6120d451f5fb283d6bd7f3b1686e31d8375f4bafed5e287390f3ed6ab65b38d6",
      "ancestry": [
        "0002 — Mô hình việc phẳng",
        "0032 — Multi-role Team Harness: trục role/holder, handoff, và marketing-cockpit absorption",
        "IV. Trình tự triển khai (seq 18030)"
      ],
      "text": "| Reason | Tương tác ngầm hiện có |\n|---|---|\n| consult | `fgos-researching` gọi giữa exploring/planning |\n| review | `code-review` / vòng approve-reject |\n| assist | subagent fanout (`fgos-fanout`, Agent tool) |\n| advise | `fgos ask`/`answer` + `awaiting-human` |"
    }
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-89",
    "githubAnchor": "unheaded-block-89",
    "stableAnchor": "unheaded-block-89",
    "title": "Unheaded block 89",
    "startLine": 892,
    "endLine": 897,
    "textDigest": "d6ebd90319d8f7c2c586f0790b3649a8f9bad951d61aa6918d0aa40c7918483a",
    "sample": "| Reason | Tương tác ngầm hiện có |\n|---|---|\n| consult | `fgos-researching` gọi giữa exploring/planning |\n| review | `code-review` / vòng approve-reject |\n| assist | subagent fano",
    "identityFingerprint": "6120d451f5fb283d6bd7f3b1686e31d8375f4bafed5e287390f3ed6ab65b38d6",
    "ancestry": [
      "Retired Decision History: Work State",
      "13. ADR 0032 Multi-Role Team Harness",
      "0032 Implementation Sequence"
    ],
    "text": "| Reason | Tương tác ngầm hiện có |\n|---|---|\n| consult | `fgos-researching` gọi giữa exploring/planning |\n| review | `code-review` / vòng approve-reject |\n| assist | subagent fanout (`fgos-fanout`, Agent tool) |\n| advise | `fgos ask`/`answer` + `awaiting-human` |"
  },
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Weak-exact",
    "reason": "ancestor headings differ; document exact share below one half",
    "targetUnit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-89",
      "githubAnchor": "unheaded-block-89",
      "stableAnchor": "unheaded-block-89",
      "title": "Unheaded block 89",
      "startLine": 892,
      "endLine": 897,
      "textDigest": "d6ebd90319d8f7c2c586f0790b3649a8f9bad951d61aa6918d0aa40c7918483a",
      "sample": "| Reason | Tương tác ngầm hiện có |\n|---|---|\n| consult | `fgos-researching` gọi giữa exploring/planning |\n| review | `code-review` / vòng approve-reject |\n| assist | subagent fano",
      "identityFingerprint": "6120d451f5fb283d6bd7f3b1686e31d8375f4bafed5e287390f3ed6ab65b38d6",
      "ancestry": [
        "Retired Decision History: Work State",
        "13. ADR 0032 Multi-Role Team Harness",
        "0032 Implementation Sequence"
      ],
      "text": "| Reason | Tương tác ngầm hiện có |\n|---|---|\n| consult | `fgos-researching` gọi giữa exploring/planning |\n| review | `code-review` / vòng approve-reject |\n| assist | subagent fanout (`fgos-fanout`, Agent tool) |\n| advise | `fgos ask`/`answer` + `awaiting-human` |"
    }
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_b7d1849e7cde5d799b984dbf0ea3bcff"
}
```

## Entry claim_fd3c6c93c220012e1e08d65c9276ab24

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_fd3c6c93c220012e1e08d65c9276ab24",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "b-decisions-second",
  "before": {
    "claimId": "claim_fd3c6c93c220012e1e08d65c9276ab24",
    "sourceUnitDigest": "a53db20b6d5f1c2b",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-90",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "ADR 0032 ordering sentence for the three delivery pieces; carried verbatim.",
    "reviewedBy": "independent reviewer (review-b-decisions-second)",
    "reviewedAt": "2026-10-07",
    "targetUnitDigest": "a53db20b6d5f1c2bd15b3fee81feaa4d"
  },
  "currentDecision": {
    "claimId": "claim_fd3c6c93c220012e1e08d65c9276ab24",
    "sourceUnitDigest": "a53db20b6d5f1c2b",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-90",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "ADR 0032 ordering sentence for the three delivery pieces; carried verbatim. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
    "targetUnitDigest": "a53db20b6d5f1c2bd15b3fee81feaa4d33c20ab74c964495d03a27b1fddc30a2",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "13. ADR 0032 Multi-Role Team Harness",
      "0032 Implementation Sequence"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/specs/work-state.md",
    "unitDigest": "c76cd7d79eaca1a83395493c677b09843ffe49a9aead5c4d2daabdf24be60cf5",
    "identityFingerprint": "c76cd7d79eaca1a83395493c677b09843ffe49a9aead5c4d2daabdf24be60cf5",
    "claimId": "claim_fd3c6c93c220012e1e08d65c9276ab24",
    "sourceAnchor": "unheaded-block-201",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "a53db20b6d5f1c2bd15b3fee81feaa4d33c20ab74c964495d03a27b1fddc30a2",
    "claimKind": "specification",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-201",
      "githubAnchor": "unheaded-block-201",
      "stableAnchor": "unheaded-block-201",
      "title": "Unheaded block 201",
      "startLine": 2252,
      "endLine": 2254,
      "textDigest": "a53db20b6d5f1c2bd15b3fee81feaa4d33c20ab74c964495d03a27b1fddc30a2",
      "sample": "Thứ tự: ① role-axis + handoff đáp lên graph đơn hiện tại → ② un-gộp\ncoding thành 3 workflow → ③ task-spec A-lite (~13 phiếu, chạy song song\n①② được) → ④ marketing (DOMAINS entry + ",
      "identityFingerprint": "c76cd7d79eaca1a83395493c677b09843ffe49a9aead5c4d2daabdf24be60cf5",
      "ancestry": [
        "0002 — Mô hình việc phẳng",
        "0032 — Multi-role Team Harness: trục role/holder, handoff, và marketing-cockpit absorption",
        "IV. Trình tự triển khai (seq 18030)"
      ],
      "text": "Thứ tự: ① role-axis + handoff đáp lên graph đơn hiện tại → ② un-gộp\ncoding thành 3 workflow → ③ task-spec A-lite (~13 phiếu, chạy song song\n①② được) → ④ marketing (DOMAINS entry + port + template + judge-gate)."
    }
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-90",
    "githubAnchor": "unheaded-block-90",
    "stableAnchor": "unheaded-block-90",
    "title": "Unheaded block 90",
    "startLine": 899,
    "endLine": 901,
    "textDigest": "a53db20b6d5f1c2bd15b3fee81feaa4d33c20ab74c964495d03a27b1fddc30a2",
    "sample": "Thứ tự: ① role-axis + handoff đáp lên graph đơn hiện tại → ② un-gộp\ncoding thành 3 workflow → ③ task-spec A-lite (~13 phiếu, chạy song song\n①② được) → ④ marketing (DOMAINS entry + ",
    "identityFingerprint": "c76cd7d79eaca1a83395493c677b09843ffe49a9aead5c4d2daabdf24be60cf5",
    "ancestry": [
      "Retired Decision History: Work State",
      "13. ADR 0032 Multi-Role Team Harness",
      "0032 Implementation Sequence"
    ],
    "text": "Thứ tự: ① role-axis + handoff đáp lên graph đơn hiện tại → ② un-gộp\ncoding thành 3 workflow → ③ task-spec A-lite (~13 phiếu, chạy song song\n①② được) → ④ marketing (DOMAINS entry + port + template + judge-gate)."
  },
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Weak-exact",
    "reason": "ancestor headings differ; document exact share below one half",
    "targetUnit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-90",
      "githubAnchor": "unheaded-block-90",
      "stableAnchor": "unheaded-block-90",
      "title": "Unheaded block 90",
      "startLine": 899,
      "endLine": 901,
      "textDigest": "a53db20b6d5f1c2bd15b3fee81feaa4d33c20ab74c964495d03a27b1fddc30a2",
      "sample": "Thứ tự: ① role-axis + handoff đáp lên graph đơn hiện tại → ② un-gộp\ncoding thành 3 workflow → ③ task-spec A-lite (~13 phiếu, chạy song song\n①② được) → ④ marketing (DOMAINS entry + ",
      "identityFingerprint": "c76cd7d79eaca1a83395493c677b09843ffe49a9aead5c4d2daabdf24be60cf5",
      "ancestry": [
        "Retired Decision History: Work State",
        "13. ADR 0032 Multi-Role Team Harness",
        "0032 Implementation Sequence"
      ],
      "text": "Thứ tự: ① role-axis + handoff đáp lên graph đơn hiện tại → ② un-gộp\ncoding thành 3 workflow → ③ task-spec A-lite (~13 phiếu, chạy song song\n①② được) → ④ marketing (DOMAINS entry + port + template + judge-gate)."
    }
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_fd3c6c93c220012e1e08d65c9276ab24"
}
```

## Entry claim_963bf3272df983c42aead0351a429ce4

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_963bf3272df983c42aead0351a429ce4",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "b-decisions-second",
  "before": {
    "claimId": "claim_963bf3272df983c42aead0351a429ce4",
    "sourceUnitDigest": "7d8d4de935f8bf82",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "0032-marketing-cockpit-comparison-conclusion",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Source H4 \"V. Kết luận so sánh marketing-cockpit ...\" is carried as H3 \"0032 Marketing Cockpit Comparison Conclusion\"; title translated.",
    "reviewedBy": "independent reviewer (review-b-decisions-second)",
    "reviewedAt": "2026-10-07",
    "targetUnitDigest": "8a71adf68dd932df92f4e48b38dabd72"
  },
  "currentDecision": {
    "claimId": "claim_963bf3272df983c42aead0351a429ce4",
    "sourceUnitDigest": "7d8d4de935f8bf82",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "0032-marketing-cockpit-comparison-conclusion",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "Source H4 \"V. Kết luận so sánh marketing-cockpit ...\" is carried as H3 \"0032 Marketing Cockpit Comparison Conclusion\"; title translated. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
    "targetUnitDigest": "8a71adf68dd932df92f4e48b38dabd720531a798392f3d046c521c0cfb7ef4b7",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "13. ADR 0032 Multi-Role Team Harness"
    ],
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried."
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/specs/work-state.md",
    "unitDigest": "58246b3b170fa4e5affd0c78488baee51a03c37fa0dec050851c8e8f706119c4",
    "identityFingerprint": "51945e7c6f107c1a6fb9f1aa080285b4d19b4426019f557ef213a86f66e594e5",
    "claimId": "claim_963bf3272df983c42aead0351a429ce4",
    "sourceAnchor": "v-kết-luận-so-sánh-marketing-cockpit-vòng-fable-vẫn-đứng-vững",
    "unitKind": "heading",
    "sourceUnitDigest": "7d8d4de935f8bf823aac021f09fd624fb3d0ddbf230d363a630e5d9aa2532274",
    "claimKind": "specification",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "heading",
      "level": 4,
      "title": "V. Kết luận so sánh marketing-cockpit (vòng fable, vẫn đứng vững)",
      "anchor": "v-kết-luận-so-sánh-marketing-cockpit-vòng-fable-vẫn-đứng-vững",
      "githubAnchor": "v-kết-luận-so-sánh-marketing-cockpit-vòng-fable-vẫn-đứng-vững",
      "stableAnchor": "h-2bd9d8644279",
      "startLine": 2256,
      "endLine": 2256,
      "textDigest": "7d8d4de935f8bf823aac021f09fd624fb3d0ddbf230d363a630e5d9aa2532274",
      "sample": "V. Kết luận so sánh marketing-cockpit (vòng fable, vẫn đứng vững)",
      "sectionPayloadDigest": "0459f4934817b1e7ac224bcba8f692760aa13201dfae8a628d05728daa131b8c",
      "followingBlockDigest": "6bfb192eaa61ff2f393e5621a2ccb051f67179a9627e65c6d6fdb53ceb54fe51",
      "identityFingerprint": "51945e7c6f107c1a6fb9f1aa080285b4d19b4426019f557ef213a86f66e594e5",
      "ancestry": [
        "0002 — Mô hình việc phẳng",
        "0032 — Multi-role Team Harness: trục role/holder, handoff, và marketing-cockpit absorption"
      ],
      "text": "#### V. Kết luận so sánh marketing-cockpit (vòng fable, vẫn đứng vững)",
      "sectionText": "#### V. Kết luận so sánh marketing-cockpit (vòng fable, vẫn đứng vững)\n\n**Lấy về fgOS**: 39 skills + 30 task-spec (tài sản chính); signal →\nbiểu diễn lại thành event typed-payload + projection theo consumer\ncursor trên `.fgos/events.jsonl` (KHÔNG store thứ hai; phần engine thật\nduy nhất là frontier signal-readiness cho fan-out tới item chưa tồn tại\n— *hoãn* tới use-case thật); 25 workflow → phân về template stamper\n(`fgos expand`) hoặc per-item workflow tuỳ cái; 5 loại quality-gate →\nskill sau `fgos gate` CLI mỏng (chờ câu hỏi #7).\n\n**Quy tắc port tách-bốn** cho một task yaml của cockpit: schema/gates →\ntask-spec; process-steps → nguyên liệu seed skill; frameworks/formulas →\nknowledge; studio/brand → context.\n\n**Cockpit bỏ khi vào fgOS**: `run.yaml` per-run (source-of-truth kép —\nevent-sourced work item thay thế, phải giết đầu tiên); run FSM riêng\n(status FSM 11 trạng thái của fgOS bao trùm, có awaiting-human vs\nawaiting-approval vs retrospective mà cockpit không phân biệt); bộ 3\nfile routing/delegation/priority (protocol-not-engine, prose-enforced là\nliability — 1 DOMAINS entry engine-enforced thay thế); phần lớn\ncheckpoint machinery (có free từ event log + worktree commit); adapter\nđa nền tảng (scope cut ghi nhận tường minh — fgOS Claude-native trước)."
    }
  },
  "currentTarget": {
    "unitKind": "heading",
    "level": 3,
    "title": "0032 Marketing Cockpit Comparison Conclusion",
    "anchor": "0032-marketing-cockpit-comparison-conclusion",
    "githubAnchor": "0032-marketing-cockpit-comparison-conclusion",
    "stableAnchor": "h-3b8e785cc9c2",
    "startLine": 903,
    "endLine": 903,
    "textDigest": "8a71adf68dd932df92f4e48b38dabd720531a798392f3d046c521c0cfb7ef4b7",
    "sample": "0032 Marketing Cockpit Comparison Conclusion",
    "sectionPayloadDigest": "0459f4934817b1e7ac224bcba8f692760aa13201dfae8a628d05728daa131b8c",
    "followingBlockDigest": "6bfb192eaa61ff2f393e5621a2ccb051f67179a9627e65c6d6fdb53ceb54fe51",
    "identityFingerprint": "d02f78947b33a98964cb7e5ee48406d4f3806b9926499237d3b2f30667c3dbf5",
    "ancestry": [
      "Retired Decision History: Work State",
      "13. ADR 0032 Multi-Role Team Harness"
    ],
    "text": "### 0032 Marketing Cockpit Comparison Conclusion",
    "sectionText": "### 0032 Marketing Cockpit Comparison Conclusion\n\n**Lấy về fgOS**: 39 skills + 30 task-spec (tài sản chính); signal →\nbiểu diễn lại thành event typed-payload + projection theo consumer\ncursor trên `.fgos/events.jsonl` (KHÔNG store thứ hai; phần engine thật\nduy nhất là frontier signal-readiness cho fan-out tới item chưa tồn tại\n— *hoãn* tới use-case thật); 25 workflow → phân về template stamper\n(`fgos expand`) hoặc per-item workflow tuỳ cái; 5 loại quality-gate →\nskill sau `fgos gate` CLI mỏng (chờ câu hỏi #7).\n\n**Quy tắc port tách-bốn** cho một task yaml của cockpit: schema/gates →\ntask-spec; process-steps → nguyên liệu seed skill; frameworks/formulas →\nknowledge; studio/brand → context.\n\n**Cockpit bỏ khi vào fgOS**: `run.yaml` per-run (source-of-truth kép —\nevent-sourced work item thay thế, phải giết đầu tiên); run FSM riêng\n(status FSM 11 trạng thái của fgOS bao trùm, có awaiting-human vs\nawaiting-approval vs retrospective mà cockpit không phân biệt); bộ 3\nfile routing/delegation/priority (protocol-not-engine, prose-enforced là\nliability — 1 DOMAINS entry engine-enforced thay thế); phần lớn\ncheckpoint machinery (có free từ event log + worktree commit); adapter\nđa nền tảng (scope cut ghi nhận tường minh — fgOS Claude-native trước)."
  },
  "sourceTargetDigestsUnequal": true,
  "classObservation": {
    "class": "Judgment",
    "reason": "no target digest match",
    "targetUnit": null
  },
  "mechanicalRequired": true,
  "deepRequired": true,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_963bf3272df983c42aead0351a429ce4"
}
```

## Entry claim_68304d9e3c8f531fd5dcc25392c6d072

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_68304d9e3c8f531fd5dcc25392c6d072",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "b-decisions-second",
  "before": {
    "claimId": "claim_68304d9e3c8f531fd5dcc25392c6d072",
    "sourceUnitDigest": "6bfb192eaa61ff2f",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-91",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "ADR 0032 list of what is taken from the cockpit into fgOS; carried verbatim.",
    "reviewedBy": "independent reviewer (review-b-decisions-second)",
    "reviewedAt": "2026-10-07",
    "targetUnitDigest": "6bfb192eaa61ff2f393e5621a2ccb051"
  },
  "currentDecision": {
    "claimId": "claim_68304d9e3c8f531fd5dcc25392c6d072",
    "sourceUnitDigest": "6bfb192eaa61ff2f",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-91",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "ADR 0032 list of what is taken from the cockpit into fgOS; carried verbatim. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
    "targetUnitDigest": "6bfb192eaa61ff2f393e5621a2ccb051f67179a9627e65c6d6fdb53ceb54fe51",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "13. ADR 0032 Multi-Role Team Harness",
      "0032 Marketing Cockpit Comparison Conclusion"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/specs/work-state.md",
    "unitDigest": "c93b22683fd75f421df55ad7eb7c487d2dd1263ca51465c8500c64abb63b5985",
    "identityFingerprint": "c93b22683fd75f421df55ad7eb7c487d2dd1263ca51465c8500c64abb63b5985",
    "claimId": "claim_68304d9e3c8f531fd5dcc25392c6d072",
    "sourceAnchor": "unheaded-block-202",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "6bfb192eaa61ff2f393e5621a2ccb051f67179a9627e65c6d6fdb53ceb54fe51",
    "claimKind": "specification",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-202",
      "githubAnchor": "unheaded-block-202",
      "stableAnchor": "unheaded-block-202",
      "title": "Unheaded block 202",
      "startLine": 2258,
      "endLine": 2264,
      "textDigest": "6bfb192eaa61ff2f393e5621a2ccb051f67179a9627e65c6d6fdb53ceb54fe51",
      "sample": "**Lấy về fgOS**: 39 skills + 30 task-spec (tài sản chính); signal →\nbiểu diễn lại thành event typed-payload + projection theo consumer\ncursor trên `.fgos/events.jsonl` (KHÔNG store",
      "identityFingerprint": "c93b22683fd75f421df55ad7eb7c487d2dd1263ca51465c8500c64abb63b5985",
      "ancestry": [
        "0002 — Mô hình việc phẳng",
        "0032 — Multi-role Team Harness: trục role/holder, handoff, và marketing-cockpit absorption",
        "V. Kết luận so sánh marketing-cockpit (vòng fable, vẫn đứng vững)"
      ],
      "text": "**Lấy về fgOS**: 39 skills + 30 task-spec (tài sản chính); signal →\nbiểu diễn lại thành event typed-payload + projection theo consumer\ncursor trên `.fgos/events.jsonl` (KHÔNG store thứ hai; phần engine thật\nduy nhất là frontier signal-readiness cho fan-out tới item chưa tồn tại\n— *hoãn* tới use-case thật); 25 workflow → phân về template stamper\n(`fgos expand`) hoặc per-item workflow tuỳ cái; 5 loại quality-gate →\nskill sau `fgos gate` CLI mỏng (chờ câu hỏi #7)."
    }
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-91",
    "githubAnchor": "unheaded-block-91",
    "stableAnchor": "unheaded-block-91",
    "title": "Unheaded block 91",
    "startLine": 905,
    "endLine": 911,
    "textDigest": "6bfb192eaa61ff2f393e5621a2ccb051f67179a9627e65c6d6fdb53ceb54fe51",
    "sample": "**Lấy về fgOS**: 39 skills + 30 task-spec (tài sản chính); signal →\nbiểu diễn lại thành event typed-payload + projection theo consumer\ncursor trên `.fgos/events.jsonl` (KHÔNG store",
    "identityFingerprint": "c93b22683fd75f421df55ad7eb7c487d2dd1263ca51465c8500c64abb63b5985",
    "ancestry": [
      "Retired Decision History: Work State",
      "13. ADR 0032 Multi-Role Team Harness",
      "0032 Marketing Cockpit Comparison Conclusion"
    ],
    "text": "**Lấy về fgOS**: 39 skills + 30 task-spec (tài sản chính); signal →\nbiểu diễn lại thành event typed-payload + projection theo consumer\ncursor trên `.fgos/events.jsonl` (KHÔNG store thứ hai; phần engine thật\nduy nhất là frontier signal-readiness cho fan-out tới item chưa tồn tại\n— *hoãn* tới use-case thật); 25 workflow → phân về template stamper\n(`fgos expand`) hoặc per-item workflow tuỳ cái; 5 loại quality-gate →\nskill sau `fgos gate` CLI mỏng (chờ câu hỏi #7)."
  },
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Weak-exact",
    "reason": "ancestor headings differ; document exact share below one half",
    "targetUnit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-91",
      "githubAnchor": "unheaded-block-91",
      "stableAnchor": "unheaded-block-91",
      "title": "Unheaded block 91",
      "startLine": 905,
      "endLine": 911,
      "textDigest": "6bfb192eaa61ff2f393e5621a2ccb051f67179a9627e65c6d6fdb53ceb54fe51",
      "sample": "**Lấy về fgOS**: 39 skills + 30 task-spec (tài sản chính); signal →\nbiểu diễn lại thành event typed-payload + projection theo consumer\ncursor trên `.fgos/events.jsonl` (KHÔNG store",
      "identityFingerprint": "c93b22683fd75f421df55ad7eb7c487d2dd1263ca51465c8500c64abb63b5985",
      "ancestry": [
        "Retired Decision History: Work State",
        "13. ADR 0032 Multi-Role Team Harness",
        "0032 Marketing Cockpit Comparison Conclusion"
      ],
      "text": "**Lấy về fgOS**: 39 skills + 30 task-spec (tài sản chính); signal →\nbiểu diễn lại thành event typed-payload + projection theo consumer\ncursor trên `.fgos/events.jsonl` (KHÔNG store thứ hai; phần engine thật\nduy nhất là frontier signal-readiness cho fan-out tới item chưa tồn tại\n— *hoãn* tới use-case thật); 25 workflow → phân về template stamper\n(`fgos expand`) hoặc per-item workflow tuỳ cái; 5 loại quality-gate →\nskill sau `fgos gate` CLI mỏng (chờ câu hỏi #7)."
    }
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_68304d9e3c8f531fd5dcc25392c6d072"
}
```

## Entry claim_8d8de83dcecd115c8b517cbf12d08795

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_8d8de83dcecd115c8b517cbf12d08795",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "b-decisions-second",
  "before": {
    "claimId": "claim_8d8de83dcecd115c8b517cbf12d08795",
    "sourceUnitDigest": "a0a6b146892e904d",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-92",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "ADR 0032 four-way split port rule for a cockpit task yaml; carried verbatim.",
    "reviewedBy": "independent reviewer (review-b-decisions-second)",
    "reviewedAt": "2026-10-07",
    "targetUnitDigest": "a0a6b146892e904d63cafd64b0a130c3"
  },
  "currentDecision": {
    "claimId": "claim_8d8de83dcecd115c8b517cbf12d08795",
    "sourceUnitDigest": "a0a6b146892e904d",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-92",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "ADR 0032 four-way split port rule for a cockpit task yaml; carried verbatim. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
    "targetUnitDigest": "a0a6b146892e904d63cafd64b0a130c3c392e0a199fea7a9929b0f2006f7011d",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "13. ADR 0032 Multi-Role Team Harness",
      "0032 Marketing Cockpit Comparison Conclusion"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/specs/work-state.md",
    "unitDigest": "88d8cb4f7ac631e10cc0626b27ca74215ef27f335883c0fe8be928cea6c5efeb",
    "identityFingerprint": "88d8cb4f7ac631e10cc0626b27ca74215ef27f335883c0fe8be928cea6c5efeb",
    "claimId": "claim_8d8de83dcecd115c8b517cbf12d08795",
    "sourceAnchor": "unheaded-block-203",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "a0a6b146892e904d63cafd64b0a130c3c392e0a199fea7a9929b0f2006f7011d",
    "claimKind": "contract",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-203",
      "githubAnchor": "unheaded-block-203",
      "stableAnchor": "unheaded-block-203",
      "title": "Unheaded block 203",
      "startLine": 2266,
      "endLine": 2268,
      "textDigest": "a0a6b146892e904d63cafd64b0a130c3c392e0a199fea7a9929b0f2006f7011d",
      "sample": "**Quy tắc port tách-bốn** cho một task yaml của cockpit: schema/gates →\ntask-spec; process-steps → nguyên liệu seed skill; frameworks/formulas →\nknowledge; studio/brand → context.",
      "identityFingerprint": "88d8cb4f7ac631e10cc0626b27ca74215ef27f335883c0fe8be928cea6c5efeb",
      "ancestry": [
        "0002 — Mô hình việc phẳng",
        "0032 — Multi-role Team Harness: trục role/holder, handoff, và marketing-cockpit absorption",
        "V. Kết luận so sánh marketing-cockpit (vòng fable, vẫn đứng vững)"
      ],
      "text": "**Quy tắc port tách-bốn** cho một task yaml của cockpit: schema/gates →\ntask-spec; process-steps → nguyên liệu seed skill; frameworks/formulas →\nknowledge; studio/brand → context."
    }
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-92",
    "githubAnchor": "unheaded-block-92",
    "stableAnchor": "unheaded-block-92",
    "title": "Unheaded block 92",
    "startLine": 913,
    "endLine": 915,
    "textDigest": "a0a6b146892e904d63cafd64b0a130c3c392e0a199fea7a9929b0f2006f7011d",
    "sample": "**Quy tắc port tách-bốn** cho một task yaml của cockpit: schema/gates →\ntask-spec; process-steps → nguyên liệu seed skill; frameworks/formulas →\nknowledge; studio/brand → context.",
    "identityFingerprint": "88d8cb4f7ac631e10cc0626b27ca74215ef27f335883c0fe8be928cea6c5efeb",
    "ancestry": [
      "Retired Decision History: Work State",
      "13. ADR 0032 Multi-Role Team Harness",
      "0032 Marketing Cockpit Comparison Conclusion"
    ],
    "text": "**Quy tắc port tách-bốn** cho một task yaml của cockpit: schema/gates →\ntask-spec; process-steps → nguyên liệu seed skill; frameworks/formulas →\nknowledge; studio/brand → context."
  },
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Weak-exact",
    "reason": "ancestor headings differ; document exact share below one half",
    "targetUnit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-92",
      "githubAnchor": "unheaded-block-92",
      "stableAnchor": "unheaded-block-92",
      "title": "Unheaded block 92",
      "startLine": 913,
      "endLine": 915,
      "textDigest": "a0a6b146892e904d63cafd64b0a130c3c392e0a199fea7a9929b0f2006f7011d",
      "sample": "**Quy tắc port tách-bốn** cho một task yaml của cockpit: schema/gates →\ntask-spec; process-steps → nguyên liệu seed skill; frameworks/formulas →\nknowledge; studio/brand → context.",
      "identityFingerprint": "88d8cb4f7ac631e10cc0626b27ca74215ef27f335883c0fe8be928cea6c5efeb",
      "ancestry": [
        "Retired Decision History: Work State",
        "13. ADR 0032 Multi-Role Team Harness",
        "0032 Marketing Cockpit Comparison Conclusion"
      ],
      "text": "**Quy tắc port tách-bốn** cho một task yaml của cockpit: schema/gates →\ntask-spec; process-steps → nguyên liệu seed skill; frameworks/formulas →\nknowledge; studio/brand → context."
    }
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_8d8de83dcecd115c8b517cbf12d08795"
}
```

## Entry claim_331e9d0a3a7f29b20ec75ed8981f7fb7

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_331e9d0a3a7f29b20ec75ed8981f7fb7",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "b-decisions-second",
  "before": {
    "claimId": "claim_331e9d0a3a7f29b20ec75ed8981f7fb7",
    "sourceUnitDigest": "b18e4845b71df780",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-93",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "ADR 0032 list of what the cockpit drops on entry; carried verbatim.",
    "reviewedBy": "independent reviewer (review-b-decisions-second)",
    "reviewedAt": "2026-10-07",
    "targetUnitDigest": "b18e4845b71df780025ec4c6b82b4551"
  },
  "currentDecision": {
    "claimId": "claim_331e9d0a3a7f29b20ec75ed8981f7fb7",
    "sourceUnitDigest": "b18e4845b71df780",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-93",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "ADR 0032 list of what the cockpit drops on entry; carried verbatim. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
    "targetUnitDigest": "b18e4845b71df780025ec4c6b82b4551cf5916138dff3b17f3153700677909e5",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "13. ADR 0032 Multi-Role Team Harness",
      "0032 Marketing Cockpit Comparison Conclusion"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/specs/work-state.md",
    "unitDigest": "46d1b30a43d25b0e876bc6e982a47f419f2670dd46882b50d2d81488dfaa4bcf",
    "identityFingerprint": "46d1b30a43d25b0e876bc6e982a47f419f2670dd46882b50d2d81488dfaa4bcf",
    "claimId": "claim_331e9d0a3a7f29b20ec75ed8981f7fb7",
    "sourceAnchor": "unheaded-block-204",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "b18e4845b71df780025ec4c6b82b4551cf5916138dff3b17f3153700677909e5",
    "claimKind": "specification",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-204",
      "githubAnchor": "unheaded-block-204",
      "stableAnchor": "unheaded-block-204",
      "title": "Unheaded block 204",
      "startLine": 2270,
      "endLine": 2277,
      "textDigest": "b18e4845b71df780025ec4c6b82b4551cf5916138dff3b17f3153700677909e5",
      "sample": "**Cockpit bỏ khi vào fgOS**: `run.yaml` per-run (source-of-truth kép —\nevent-sourced work item thay thế, phải giết đầu tiên); run FSM riêng\n(status FSM 11 trạng thái của fgOS bao t",
      "identityFingerprint": "46d1b30a43d25b0e876bc6e982a47f419f2670dd46882b50d2d81488dfaa4bcf",
      "ancestry": [
        "0002 — Mô hình việc phẳng",
        "0032 — Multi-role Team Harness: trục role/holder, handoff, và marketing-cockpit absorption",
        "V. Kết luận so sánh marketing-cockpit (vòng fable, vẫn đứng vững)"
      ],
      "text": "**Cockpit bỏ khi vào fgOS**: `run.yaml` per-run (source-of-truth kép —\nevent-sourced work item thay thế, phải giết đầu tiên); run FSM riêng\n(status FSM 11 trạng thái của fgOS bao trùm, có awaiting-human vs\nawaiting-approval vs retrospective mà cockpit không phân biệt); bộ 3\nfile routing/delegation/priority (protocol-not-engine, prose-enforced là\nliability — 1 DOMAINS entry engine-enforced thay thế); phần lớn\ncheckpoint machinery (có free từ event log + worktree commit); adapter\nđa nền tảng (scope cut ghi nhận tường minh — fgOS Claude-native trước)."
    }
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-93",
    "githubAnchor": "unheaded-block-93",
    "stableAnchor": "unheaded-block-93",
    "title": "Unheaded block 93",
    "startLine": 917,
    "endLine": 924,
    "textDigest": "b18e4845b71df780025ec4c6b82b4551cf5916138dff3b17f3153700677909e5",
    "sample": "**Cockpit bỏ khi vào fgOS**: `run.yaml` per-run (source-of-truth kép —\nevent-sourced work item thay thế, phải giết đầu tiên); run FSM riêng\n(status FSM 11 trạng thái của fgOS bao t",
    "identityFingerprint": "46d1b30a43d25b0e876bc6e982a47f419f2670dd46882b50d2d81488dfaa4bcf",
    "ancestry": [
      "Retired Decision History: Work State",
      "13. ADR 0032 Multi-Role Team Harness",
      "0032 Marketing Cockpit Comparison Conclusion"
    ],
    "text": "**Cockpit bỏ khi vào fgOS**: `run.yaml` per-run (source-of-truth kép —\nevent-sourced work item thay thế, phải giết đầu tiên); run FSM riêng\n(status FSM 11 trạng thái của fgOS bao trùm, có awaiting-human vs\nawaiting-approval vs retrospective mà cockpit không phân biệt); bộ 3\nfile routing/delegation/priority (protocol-not-engine, prose-enforced là\nliability — 1 DOMAINS entry engine-enforced thay thế); phần lớn\ncheckpoint machinery (có free từ event log + worktree commit); adapter\nđa nền tảng (scope cut ghi nhận tường minh — fgOS Claude-native trước)."
  },
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Weak-exact",
    "reason": "ancestor headings differ; document exact share below one half",
    "targetUnit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-93",
      "githubAnchor": "unheaded-block-93",
      "stableAnchor": "unheaded-block-93",
      "title": "Unheaded block 93",
      "startLine": 917,
      "endLine": 924,
      "textDigest": "b18e4845b71df780025ec4c6b82b4551cf5916138dff3b17f3153700677909e5",
      "sample": "**Cockpit bỏ khi vào fgOS**: `run.yaml` per-run (source-of-truth kép —\nevent-sourced work item thay thế, phải giết đầu tiên); run FSM riêng\n(status FSM 11 trạng thái của fgOS bao t",
      "identityFingerprint": "46d1b30a43d25b0e876bc6e982a47f419f2670dd46882b50d2d81488dfaa4bcf",
      "ancestry": [
        "Retired Decision History: Work State",
        "13. ADR 0032 Multi-Role Team Harness",
        "0032 Marketing Cockpit Comparison Conclusion"
      ],
      "text": "**Cockpit bỏ khi vào fgOS**: `run.yaml` per-run (source-of-truth kép —\nevent-sourced work item thay thế, phải giết đầu tiên); run FSM riêng\n(status FSM 11 trạng thái của fgOS bao trùm, có awaiting-human vs\nawaiting-approval vs retrospective mà cockpit không phân biệt); bộ 3\nfile routing/delegation/priority (protocol-not-engine, prose-enforced là\nliability — 1 DOMAINS entry engine-enforced thay thế); phần lớn\ncheckpoint machinery (có free từ event log + worktree commit); adapter\nđa nền tảng (scope cut ghi nhận tường minh — fgOS Claude-native trước)."
    }
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_331e9d0a3a7f29b20ec75ed8981f7fb7"
}
```

## Entry claim_c696887f984b8248a620d445d341cf0b

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_c696887f984b8248a620d445d341cf0b",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "b-decisions-second",
  "before": {
    "claimId": "claim_c696887f984b8248a620d445d341cf0b",
    "sourceUnitDigest": "6c186518993aba9c",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "0032-deliberately-deferred-questions",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Source H4 \"VI. Treo có chủ đích (không phải quên)\" is carried as H3 \"0032 Deliberately Deferred Questions\"; title translated.",
    "reviewedBy": "independent reviewer (review-b-decisions-second)",
    "reviewedAt": "2026-10-07",
    "targetUnitDigest": "c71143d4c041f9d8943b66c9a1138bf3"
  },
  "currentDecision": {
    "claimId": "claim_c696887f984b8248a620d445d341cf0b",
    "sourceUnitDigest": "6c186518993aba9c",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "0032-deliberately-deferred-questions",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "Source H4 \"VI. Treo có chủ đích (không phải quên)\" is carried as H3 \"0032 Deliberately Deferred Questions\"; title translated. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
    "targetUnitDigest": "c71143d4c041f9d8943b66c9a1138bf3ce8e6f108c19234f9872579dc9eca773",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "13. ADR 0032 Multi-Role Team Harness"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/specs/work-state.md",
    "unitDigest": "559319f4532d8e1c6f19154e66add07170193fc273b03fc9fb47fcd6c099139b",
    "identityFingerprint": "1691d3ee83e26ea8863cffe5666c28aad18843ce85451eff91a62597a42b6e94",
    "claimId": "claim_c696887f984b8248a620d445d341cf0b",
    "sourceAnchor": "vi-treo-có-chủ-đích-không-phải-quên",
    "unitKind": "heading",
    "sourceUnitDigest": "6c186518993aba9c2fe311251b119425dfca052b2b34cb6dde932afad6c42da5",
    "claimKind": "specification",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "heading",
      "level": 4,
      "title": "VI. Treo có chủ đích (không phải quên)",
      "anchor": "vi-treo-có-chủ-đích-không-phải-quên",
      "githubAnchor": "vi-treo-có-chủ-đích-không-phải-quên",
      "stableAnchor": "h-6d363a89da55",
      "startLine": 2279,
      "endLine": 2279,
      "textDigest": "6c186518993aba9c2fe311251b119425dfca052b2b34cb6dde932afad6c42da5",
      "sample": "VI. Treo có chủ đích (không phải quên)",
      "sectionPayloadDigest": "2431462c129b13b99afc3b1e18061c825932a166ce50c26248dca7ce2905f946",
      "followingBlockDigest": "2431462c129b13b99afc3b1e18061c825932a166ce50c26248dca7ce2905f946",
      "identityFingerprint": "1691d3ee83e26ea8863cffe5666c28aad18843ce85451eff91a62597a42b6e94",
      "ancestry": [
        "0002 — Mô hình việc phẳng",
        "0032 — Multi-role Team Harness: trục role/holder, handoff, và marketing-cockpit absorption"
      ],
      "text": "#### VI. Treo có chủ đích (không phải quên)",
      "sectionText": "#### VI. Treo có chủ đích (không phải quên)\n\n1. **#7 — Judge-gate (LLM-graded rubric) có tính là \"proof\" theo luật L5\n   DoD không?** Rủi ro sắc nhất: nếu không chấp nhận, mọi item marketing\n   rơi về `awaiting-human`, frontier nghẽn ở người, ưu tiên #2 sụp đúng\n   domain vừa thêm. Quyết tường minh ở lượt marketing.\n2. **#15 — Team overlay trên domain** (2 team cùng domain khác shape) —\n   YAGNI, chưa xây.\n3. **Signal bus** — hoãn tới fan-out use-case thật (vd brand-voice\n   invalidation).\n4. **Scheduler** — cron ngoài gọi `fgos add` trước; trigger primitive\n   chỉ khi cron chứng minh thiếu.\n5. **Human modeling đa người** — pull-door verbs đủ cho tới khi có team\n   nhiều người thật."
    }
  },
  "currentTarget": {
    "unitKind": "heading",
    "level": 3,
    "title": "0032 Deliberately Deferred Questions",
    "anchor": "0032-deliberately-deferred-questions",
    "githubAnchor": "0032-deliberately-deferred-questions",
    "stableAnchor": "h-f3544e916a31",
    "startLine": 926,
    "endLine": 926,
    "textDigest": "c71143d4c041f9d8943b66c9a1138bf3ce8e6f108c19234f9872579dc9eca773",
    "sample": "0032 Deliberately Deferred Questions",
    "sectionPayloadDigest": "2431462c129b13b99afc3b1e18061c825932a166ce50c26248dca7ce2905f946",
    "followingBlockDigest": "2431462c129b13b99afc3b1e18061c825932a166ce50c26248dca7ce2905f946",
    "identityFingerprint": "182efedb061e3873c541375444bd54eb041b23b9cf3be04453a68d5606f991ff",
    "ancestry": [
      "Retired Decision History: Work State",
      "13. ADR 0032 Multi-Role Team Harness"
    ],
    "text": "### 0032 Deliberately Deferred Questions",
    "sectionText": "### 0032 Deliberately Deferred Questions\n\n1. **#7 — Judge-gate (LLM-graded rubric) có tính là \"proof\" theo luật L5\n   DoD không?** Rủi ro sắc nhất: nếu không chấp nhận, mọi item marketing\n   rơi về `awaiting-human`, frontier nghẽn ở người, ưu tiên #2 sụp đúng\n   domain vừa thêm. Quyết tường minh ở lượt marketing.\n2. **#15 — Team overlay trên domain** (2 team cùng domain khác shape) —\n   YAGNI, chưa xây.\n3. **Signal bus** — hoãn tới fan-out use-case thật (vd brand-voice\n   invalidation).\n4. **Scheduler** — cron ngoài gọi `fgos add` trước; trigger primitive\n   chỉ khi cron chứng minh thiếu.\n5. **Human modeling đa người** — pull-door verbs đủ cho tới khi có team\n   nhiều người thật."
  },
  "sourceTargetDigestsUnequal": true,
  "classObservation": {
    "class": "Judgment",
    "reason": "no target digest match",
    "targetUnit": null
  },
  "mechanicalRequired": true,
  "deepRequired": true,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_c696887f984b8248a620d445d341cf0b"
}
```

## Entry claim_092f7d288e8617bb3b8abff586e988f8

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_092f7d288e8617bb3b8abff586e988f8",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "b-decisions-second",
  "before": {
    "claimId": "claim_092f7d288e8617bb3b8abff586e988f8",
    "sourceUnitDigest": "2431462c129b13b9",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-94",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "ADR 0032 numbered list of deliberately deferred questions; carried verbatim.",
    "reviewedBy": "independent reviewer (review-b-decisions-second)",
    "reviewedAt": "2026-10-07",
    "targetUnitDigest": "2431462c129b13b99afc3b1e18061c82"
  },
  "currentDecision": {
    "claimId": "claim_092f7d288e8617bb3b8abff586e988f8",
    "sourceUnitDigest": "2431462c129b13b9",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-94",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "ADR 0032 numbered list of deliberately deferred questions; carried verbatim. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
    "targetUnitDigest": "2431462c129b13b99afc3b1e18061c825932a166ce50c26248dca7ce2905f946",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "13. ADR 0032 Multi-Role Team Harness",
      "0032 Deliberately Deferred Questions"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/specs/work-state.md",
    "unitDigest": "6c6f843a1a681e5496d8630778385622b136f2c4bcb5cc9383310be4439ad3a3",
    "identityFingerprint": "6c6f843a1a681e5496d8630778385622b136f2c4bcb5cc9383310be4439ad3a3",
    "claimId": "claim_092f7d288e8617bb3b8abff586e988f8",
    "sourceAnchor": "unheaded-block-205",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "2431462c129b13b99afc3b1e18061c825932a166ce50c26248dca7ce2905f946",
    "claimKind": "specification",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-205",
      "githubAnchor": "unheaded-block-205",
      "stableAnchor": "unheaded-block-205",
      "title": "Unheaded block 205",
      "startLine": 2281,
      "endLine": 2292,
      "textDigest": "2431462c129b13b99afc3b1e18061c825932a166ce50c26248dca7ce2905f946",
      "sample": "1. **#7 — Judge-gate (LLM-graded rubric) có tính là \"proof\" theo luật L5\n   DoD không?** Rủi ro sắc nhất: nếu không chấp nhận, mọi item marketing\n   rơi về `awaiting-human`, fronti",
      "identityFingerprint": "6c6f843a1a681e5496d8630778385622b136f2c4bcb5cc9383310be4439ad3a3",
      "ancestry": [
        "0002 — Mô hình việc phẳng",
        "0032 — Multi-role Team Harness: trục role/holder, handoff, và marketing-cockpit absorption",
        "VI. Treo có chủ đích (không phải quên)"
      ],
      "text": "1. **#7 — Judge-gate (LLM-graded rubric) có tính là \"proof\" theo luật L5\n   DoD không?** Rủi ro sắc nhất: nếu không chấp nhận, mọi item marketing\n   rơi về `awaiting-human`, frontier nghẽn ở người, ưu tiên #2 sụp đúng\n   domain vừa thêm. Quyết tường minh ở lượt marketing.\n2. **#15 — Team overlay trên domain** (2 team cùng domain khác shape) —\n   YAGNI, chưa xây.\n3. **Signal bus** — hoãn tới fan-out use-case thật (vd brand-voice\n   invalidation).\n4. **Scheduler** — cron ngoài gọi `fgos add` trước; trigger primitive\n   chỉ khi cron chứng minh thiếu.\n5. **Human modeling đa người** — pull-door verbs đủ cho tới khi có team\n   nhiều người thật."
    }
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-94",
    "githubAnchor": "unheaded-block-94",
    "stableAnchor": "unheaded-block-94",
    "title": "Unheaded block 94",
    "startLine": 928,
    "endLine": 939,
    "textDigest": "2431462c129b13b99afc3b1e18061c825932a166ce50c26248dca7ce2905f946",
    "sample": "1. **#7 — Judge-gate (LLM-graded rubric) có tính là \"proof\" theo luật L5\n   DoD không?** Rủi ro sắc nhất: nếu không chấp nhận, mọi item marketing\n   rơi về `awaiting-human`, fronti",
    "identityFingerprint": "6c6f843a1a681e5496d8630778385622b136f2c4bcb5cc9383310be4439ad3a3",
    "ancestry": [
      "Retired Decision History: Work State",
      "13. ADR 0032 Multi-Role Team Harness",
      "0032 Deliberately Deferred Questions"
    ],
    "text": "1. **#7 — Judge-gate (LLM-graded rubric) có tính là \"proof\" theo luật L5\n   DoD không?** Rủi ro sắc nhất: nếu không chấp nhận, mọi item marketing\n   rơi về `awaiting-human`, frontier nghẽn ở người, ưu tiên #2 sụp đúng\n   domain vừa thêm. Quyết tường minh ở lượt marketing.\n2. **#15 — Team overlay trên domain** (2 team cùng domain khác shape) —\n   YAGNI, chưa xây.\n3. **Signal bus** — hoãn tới fan-out use-case thật (vd brand-voice\n   invalidation).\n4. **Scheduler** — cron ngoài gọi `fgos add` trước; trigger primitive\n   chỉ khi cron chứng minh thiếu.\n5. **Human modeling đa người** — pull-door verbs đủ cho tới khi có team\n   nhiều người thật."
  },
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Weak-exact",
    "reason": "ancestor headings differ; document exact share below one half",
    "targetUnit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-94",
      "githubAnchor": "unheaded-block-94",
      "stableAnchor": "unheaded-block-94",
      "title": "Unheaded block 94",
      "startLine": 928,
      "endLine": 939,
      "textDigest": "2431462c129b13b99afc3b1e18061c825932a166ce50c26248dca7ce2905f946",
      "sample": "1. **#7 — Judge-gate (LLM-graded rubric) có tính là \"proof\" theo luật L5\n   DoD không?** Rủi ro sắc nhất: nếu không chấp nhận, mọi item marketing\n   rơi về `awaiting-human`, fronti",
      "identityFingerprint": "6c6f843a1a681e5496d8630778385622b136f2c4bcb5cc9383310be4439ad3a3",
      "ancestry": [
        "Retired Decision History: Work State",
        "13. ADR 0032 Multi-Role Team Harness",
        "0032 Deliberately Deferred Questions"
      ],
      "text": "1. **#7 — Judge-gate (LLM-graded rubric) có tính là \"proof\" theo luật L5\n   DoD không?** Rủi ro sắc nhất: nếu không chấp nhận, mọi item marketing\n   rơi về `awaiting-human`, frontier nghẽn ở người, ưu tiên #2 sụp đúng\n   domain vừa thêm. Quyết tường minh ở lượt marketing.\n2. **#15 — Team overlay trên domain** (2 team cùng domain khác shape) —\n   YAGNI, chưa xây.\n3. **Signal bus** — hoãn tới fan-out use-case thật (vd brand-voice\n   invalidation).\n4. **Scheduler** — cron ngoài gọi `fgos add` trước; trigger primitive\n   chỉ khi cron chứng minh thiếu.\n5. **Human modeling đa người** — pull-door verbs đủ cho tới khi có team\n   nhiều người thật."
    }
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_092f7d288e8617bb3b8abff586e988f8"
}
```

## Entry claim_cf9060b6664b21d6e5fac0b31aac0ff6

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_cf9060b6664b21d6e5fac0b31aac0ff6",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "b-decisions-second",
  "before": {
    "claimId": "claim_cf9060b6664b21d6e5fac0b31aac0ff6",
    "sourceUnitDigest": "a88af4784f074e4e",
    "targetOwner": "docs/platform/work-state/history/multi-role-harness-distill-record.md",
    "targetAnchor": "3-state-at-distill-time",
    "claimKind": "historical-context",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Source H4 \"VII. Trạng thái tại thời điểm distill (2026-08-15)\" is carried as H2 \"3. State At Distill Time\" in the history document; dated snapshot, title differs.",
    "reviewedBy": "independent reviewer (review-b-decisions-second)",
    "reviewedAt": "2026-10-07",
    "targetUnitDigest": "dda4c28cba5f1a13d782c50c996bc50d"
  },
  "currentDecision": {
    "claimId": "claim_cf9060b6664b21d6e5fac0b31aac0ff6",
    "sourceUnitDigest": "a88af4784f074e4e",
    "targetOwner": "docs/platform/work-state/history/multi-role-harness-distill-record.md",
    "targetAnchor": "3-state-at-distill-time",
    "claimKind": "historical-context",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "Source H4 \"VII. Trạng thái tại thời điểm distill (2026-08-15)\" is carried as H2 \"3. State At Distill Time\" in the history document; dated snapshot, title differs. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
    "targetUnitDigest": "dda4c28cba5f1a13d782c50c996bc50d5848d6d8172ecb38066a23e8e1c19023",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetAncestry": [
      "Multi-Role Harness Distill Record"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/specs/work-state.md",
    "unitDigest": "bb4590e377ab239420b452a59cc79e52d2f88f5ad6244fa71ae5ae6b6b67ed69",
    "identityFingerprint": "3bfef2e9d159aff36e0f13fa3f0d4cc8c6494c219757f24494fe0a69b5b0e7b4",
    "claimId": "claim_cf9060b6664b21d6e5fac0b31aac0ff6",
    "sourceAnchor": "vii-trạng-thái-tại-thời-điểm-distill-2026-08-15",
    "unitKind": "heading",
    "sourceUnitDigest": "a88af4784f074e4e1ddb17c6bd1df456ef5df67e0aad123b2f2cdca8014d9981",
    "claimKind": "specification",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "heading",
      "level": 4,
      "title": "VII. Trạng thái tại thời điểm distill (2026-08-15)",
      "anchor": "vii-trạng-thái-tại-thời-điểm-distill-2026-08-15",
      "githubAnchor": "vii-trạng-thái-tại-thời-điểm-distill-2026-08-15",
      "stableAnchor": "h-d280e09cd212",
      "startLine": 2294,
      "endLine": 2294,
      "textDigest": "a88af4784f074e4e1ddb17c6bd1df456ef5df67e0aad123b2f2cdca8014d9981",
      "sample": "VII. Trạng thái tại thời điểm distill (2026-08-15)",
      "sectionPayloadDigest": "09bb0ef5d78c9357cc67cc5622d215a494f8bcc8948a9b11a6287dd110b2fce9",
      "followingBlockDigest": "09bb0ef5d78c9357cc67cc5622d215a494f8bcc8948a9b11a6287dd110b2fce9",
      "identityFingerprint": "3bfef2e9d159aff36e0f13fa3f0d4cc8c6494c219757f24494fe0a69b5b0e7b4",
      "ancestry": [
        "0002 — Mô hình việc phẳng",
        "0032 — Multi-role Team Harness: trục role/holder, handoff, và marketing-cockpit absorption"
      ],
      "text": "#### VII. Trạng thái tại thời điểm distill (2026-08-15)",
      "sectionText": "#### VII. Trạng thái tại thời điểm distill (2026-08-15)\n\n- **Validating đã chạy xong**: reality gate 6/6 PASS, feasibility matrix\n  có bằng chứng thật từng dòng, verdict **READY WITH CONSTRAINTS**; gate\n  `validateApprove` hỏi người (`canAutoApprove: false` — hard-gate\n  keyword `schema`/`migration`, true positive), người dùng chọn\n  mechanism-first → **D7a** (seq 18248). `fgos plan --verdict decompose`\n  materialize **3 item con** ở stage `executing`: `tsk-2t9c-1` (role\n  axis, heavy), `tsk-2t9c-2` (workflow hierarchy, heavy, `deps:\n  [tsk-2t9c-1]`), `tsk-2t9c-3` (task-spec + doctor check, standard).\n- 13 D-ID khớp ở 3 nơi: event log, bảng §4 `DISCUSSION.md`,\n  bảng Locked decisions `CONTEXT.md`.\n- Hai bẫy ghi lại trong plan: `src/state/handoff.mjs` phải có row trong\n  `docs/architecture-manifest.json` (không thì `test/architecture.\n  test.mjs` đỏ), và file đó phải PURE (cap/depth do caller truyền —\n  khuôn `hasWorkerSlotRoom({ceiling})`)."
    }
  },
  "currentTarget": {
    "unitKind": "heading",
    "level": 2,
    "title": "3. State At Distill Time",
    "anchor": "3-state-at-distill-time",
    "githubAnchor": "3-state-at-distill-time",
    "stableAnchor": "h-903df990815c",
    "startLine": 29,
    "endLine": 29,
    "textDigest": "dda4c28cba5f1a13d782c50c996bc50d5848d6d8172ecb38066a23e8e1c19023",
    "sample": "3. State At Distill Time",
    "sectionPayloadDigest": "09bb0ef5d78c9357cc67cc5622d215a494f8bcc8948a9b11a6287dd110b2fce9",
    "followingBlockDigest": "09bb0ef5d78c9357cc67cc5622d215a494f8bcc8948a9b11a6287dd110b2fce9",
    "identityFingerprint": "2d5c13db4c7834db1d183150bcc2ef83dde49608f25e886d1f5c5a9c443a4080",
    "ancestry": [
      "Multi-Role Harness Distill Record"
    ],
    "text": "## 3. State At Distill Time",
    "sectionText": "## 3. State At Distill Time\n\n- **Validating đã chạy xong**: reality gate 6/6 PASS, feasibility matrix\n  có bằng chứng thật từng dòng, verdict **READY WITH CONSTRAINTS**; gate\n  `validateApprove` hỏi người (`canAutoApprove: false` — hard-gate\n  keyword `schema`/`migration`, true positive), người dùng chọn\n  mechanism-first → **D7a** (seq 18248). `fgos plan --verdict decompose`\n  materialize **3 item con** ở stage `executing`: `tsk-2t9c-1` (role\n  axis, heavy), `tsk-2t9c-2` (workflow hierarchy, heavy, `deps:\n  [tsk-2t9c-1]`), `tsk-2t9c-3` (task-spec + doctor check, standard).\n- 13 D-ID khớp ở 3 nơi: event log, bảng §4 `DISCUSSION.md`,\n  bảng Locked decisions `CONTEXT.md`.\n- Hai bẫy ghi lại trong plan: `src/state/handoff.mjs` phải có row trong\n  `docs/architecture-manifest.json` (không thì `test/architecture.\n  test.mjs` đỏ), và file đó phải PURE (cap/depth do caller truyền —\n  khuôn `hasWorkerSlotRoom({ceiling})`)."
  },
  "sourceTargetDigestsUnequal": true,
  "classObservation": {
    "class": "Judgment",
    "reason": "no target digest match",
    "targetUnit": null
  },
  "mechanicalRequired": true,
  "deepRequired": true,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_cf9060b6664b21d6e5fac0b31aac0ff6"
}
```

## Entry claim_be0cd74b4a0bd4c5860e9116aa8dd6c6

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_be0cd74b4a0bd4c5860e9116aa8dd6c6",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "b-decisions-second",
  "before": {
    "claimId": "claim_be0cd74b4a0bd4c5860e9116aa8dd6c6",
    "sourceUnitDigest": "09bb0ef5d78c9357",
    "targetOwner": "docs/platform/work-state/history/multi-role-harness-distill-record.md",
    "targetAnchor": "unheaded-block-4",
    "claimKind": "historical-context",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Dated state-at-distill list (validating finished, reality gate 6/6); carried verbatim into the history document as historical-context.",
    "reviewedBy": "independent reviewer (review-b-decisions-second)",
    "reviewedAt": "2026-10-07",
    "targetUnitDigest": "09bb0ef5d78c9357cc67cc5622d215a4"
  },
  "currentDecision": {
    "claimId": "claim_be0cd74b4a0bd4c5860e9116aa8dd6c6",
    "sourceUnitDigest": "09bb0ef5d78c9357",
    "targetOwner": "docs/platform/work-state/history/multi-role-harness-distill-record.md",
    "targetAnchor": "unheaded-block-4",
    "claimKind": "historical-context",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "Dated state-at-distill list (validating finished, reality gate 6/6); carried verbatim into the history document as historical-context. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
    "targetUnitDigest": "09bb0ef5d78c9357cc67cc5622d215a494f8bcc8948a9b11a6287dd110b2fce9",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetAncestry": [
      "Multi-Role Harness Distill Record",
      "3. State At Distill Time"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/specs/work-state.md",
    "unitDigest": "9a5b7664a872ad059b4c0756e463574e1dbb777fcf04e3d4f2b4e1be8b9be28b",
    "identityFingerprint": "9a5b7664a872ad059b4c0756e463574e1dbb777fcf04e3d4f2b4e1be8b9be28b",
    "claimId": "claim_be0cd74b4a0bd4c5860e9116aa8dd6c6",
    "sourceAnchor": "unheaded-block-206",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "09bb0ef5d78c9357cc67cc5622d215a494f8bcc8948a9b11a6287dd110b2fce9",
    "claimKind": "specification",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-206",
      "githubAnchor": "unheaded-block-206",
      "stableAnchor": "unheaded-block-206",
      "title": "Unheaded block 206",
      "startLine": 2296,
      "endLine": 2309,
      "textDigest": "09bb0ef5d78c9357cc67cc5622d215a494f8bcc8948a9b11a6287dd110b2fce9",
      "sample": "- **Validating đã chạy xong**: reality gate 6/6 PASS, feasibility matrix\n  có bằng chứng thật từng dòng, verdict **READY WITH CONSTRAINTS**; gate\n  `validateApprove` hỏi người (`ca",
      "identityFingerprint": "9a5b7664a872ad059b4c0756e463574e1dbb777fcf04e3d4f2b4e1be8b9be28b",
      "ancestry": [
        "0002 — Mô hình việc phẳng",
        "0032 — Multi-role Team Harness: trục role/holder, handoff, và marketing-cockpit absorption",
        "VII. Trạng thái tại thời điểm distill (2026-08-15)"
      ],
      "text": "- **Validating đã chạy xong**: reality gate 6/6 PASS, feasibility matrix\n  có bằng chứng thật từng dòng, verdict **READY WITH CONSTRAINTS**; gate\n  `validateApprove` hỏi người (`canAutoApprove: false` — hard-gate\n  keyword `schema`/`migration`, true positive), người dùng chọn\n  mechanism-first → **D7a** (seq 18248). `fgos plan --verdict decompose`\n  materialize **3 item con** ở stage `executing`: `tsk-2t9c-1` (role\n  axis, heavy), `tsk-2t9c-2` (workflow hierarchy, heavy, `deps:\n  [tsk-2t9c-1]`), `tsk-2t9c-3` (task-spec + doctor check, standard).\n- 13 D-ID khớp ở 3 nơi: event log, bảng §4 `DISCUSSION.md`,\n  bảng Locked decisions `CONTEXT.md`.\n- Hai bẫy ghi lại trong plan: `src/state/handoff.mjs` phải có row trong\n  `docs/architecture-manifest.json` (không thì `test/architecture.\n  test.mjs` đỏ), và file đó phải PURE (cap/depth do caller truyền —\n  khuôn `hasWorkerSlotRoom({ceiling})`)."
    }
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-4",
    "githubAnchor": "unheaded-block-4",
    "stableAnchor": "unheaded-block-4",
    "title": "Unheaded block 4",
    "startLine": 31,
    "endLine": 44,
    "textDigest": "09bb0ef5d78c9357cc67cc5622d215a494f8bcc8948a9b11a6287dd110b2fce9",
    "sample": "- **Validating đã chạy xong**: reality gate 6/6 PASS, feasibility matrix\n  có bằng chứng thật từng dòng, verdict **READY WITH CONSTRAINTS**; gate\n  `validateApprove` hỏi người (`ca",
    "identityFingerprint": "9a5b7664a872ad059b4c0756e463574e1dbb777fcf04e3d4f2b4e1be8b9be28b",
    "ancestry": [
      "Multi-Role Harness Distill Record",
      "3. State At Distill Time"
    ],
    "text": "- **Validating đã chạy xong**: reality gate 6/6 PASS, feasibility matrix\n  có bằng chứng thật từng dòng, verdict **READY WITH CONSTRAINTS**; gate\n  `validateApprove` hỏi người (`canAutoApprove: false` — hard-gate\n  keyword `schema`/`migration`, true positive), người dùng chọn\n  mechanism-first → **D7a** (seq 18248). `fgos plan --verdict decompose`\n  materialize **3 item con** ở stage `executing`: `tsk-2t9c-1` (role\n  axis, heavy), `tsk-2t9c-2` (workflow hierarchy, heavy, `deps:\n  [tsk-2t9c-1]`), `tsk-2t9c-3` (task-spec + doctor check, standard).\n- 13 D-ID khớp ở 3 nơi: event log, bảng §4 `DISCUSSION.md`,\n  bảng Locked decisions `CONTEXT.md`.\n- Hai bẫy ghi lại trong plan: `src/state/handoff.mjs` phải có row trong\n  `docs/architecture-manifest.json` (không thì `test/architecture.\n  test.mjs` đỏ), và file đó phải PURE (cap/depth do caller truyền —\n  khuôn `hasWorkerSlotRoom({ceiling})`)."
  },
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Weak-exact",
    "reason": "ancestor headings differ; document exact share below one half",
    "targetUnit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-4",
      "githubAnchor": "unheaded-block-4",
      "stableAnchor": "unheaded-block-4",
      "title": "Unheaded block 4",
      "startLine": 31,
      "endLine": 44,
      "textDigest": "09bb0ef5d78c9357cc67cc5622d215a494f8bcc8948a9b11a6287dd110b2fce9",
      "sample": "- **Validating đã chạy xong**: reality gate 6/6 PASS, feasibility matrix\n  có bằng chứng thật từng dòng, verdict **READY WITH CONSTRAINTS**; gate\n  `validateApprove` hỏi người (`ca",
      "identityFingerprint": "9a5b7664a872ad059b4c0756e463574e1dbb777fcf04e3d4f2b4e1be8b9be28b",
      "ancestry": [
        "Multi-Role Harness Distill Record",
        "3. State At Distill Time"
      ],
      "text": "- **Validating đã chạy xong**: reality gate 6/6 PASS, feasibility matrix\n  có bằng chứng thật từng dòng, verdict **READY WITH CONSTRAINTS**; gate\n  `validateApprove` hỏi người (`canAutoApprove: false` — hard-gate\n  keyword `schema`/`migration`, true positive), người dùng chọn\n  mechanism-first → **D7a** (seq 18248). `fgos plan --verdict decompose`\n  materialize **3 item con** ở stage `executing`: `tsk-2t9c-1` (role\n  axis, heavy), `tsk-2t9c-2` (workflow hierarchy, heavy, `deps:\n  [tsk-2t9c-1]`), `tsk-2t9c-3` (task-spec + doctor check, standard).\n- 13 D-ID khớp ở 3 nơi: event log, bảng §4 `DISCUSSION.md`,\n  bảng Locked decisions `CONTEXT.md`.\n- Hai bẫy ghi lại trong plan: `src/state/handoff.mjs` phải có row trong\n  `docs/architecture-manifest.json` (không thì `test/architecture.\n  test.mjs` đỏ), và file đó phải PURE (cap/depth do caller truyền —\n  khuôn `hasWorkerSlotRoom({ceiling})`)."
    }
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_be0cd74b4a0bd4c5860e9116aa8dd6c6"
}
```

## Entry claim_581643ec8243af5744e04c222f13c214

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_581643ec8243af5744e04c222f13c214",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "b-decisions-second",
  "before": {
    "claimId": "claim_581643ec8243af5744e04c222f13c214",
    "sourceUnitDigest": "a143984b5d286e28",
    "targetOwner": "docs/platform/work-state/history/multi-role-harness-distill-record.md",
    "targetAnchor": "4-implementation-review-and-verification-after-distill",
    "claimKind": "historical-context",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Source H4 \"VIII. Sau distill ...\" is carried as H2 \"4. Implementation Review And Verification After Distill\"; dated section, title translated.",
    "reviewedBy": "independent reviewer (review-b-decisions-second)",
    "reviewedAt": "2026-10-07",
    "targetUnitDigest": "a88add6a18b0023671d9f83c9261dfd5"
  },
  "currentDecision": {
    "claimId": "claim_581643ec8243af5744e04c222f13c214",
    "sourceUnitDigest": "a143984b5d286e28",
    "targetOwner": "docs/platform/work-state/history/multi-role-harness-distill-record.md",
    "targetAnchor": "4-implementation-review-and-verification-after-distill",
    "claimKind": "historical-context",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "Source H4 \"VIII. Sau distill ...\" is carried as H2 \"4. Implementation Review And Verification After Distill\"; dated section, title translated. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
    "targetUnitDigest": "a88add6a18b0023671d9f83c9261dfd52d1440fd05936db3be3acd430adb0b11",
    "targetAncestry": [
      "Multi-Role Harness Distill Record"
    ],
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried."
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/specs/work-state.md",
    "unitDigest": "2e40bb678018f39c2c581b049f3d6a1afe740c67c7e591b31963b9fffeca865f",
    "identityFingerprint": "64d14cf1ae7f69707dfbee6a85992f4868270afb6de2f7f09c58d15b1b657c65",
    "claimId": "claim_581643ec8243af5744e04c222f13c214",
    "sourceAnchor": "viii-sau-distill-implement-review-độc-lập-và-verify-thật-2026-08-1516",
    "unitKind": "heading",
    "sourceUnitDigest": "a143984b5d286e2892a0a62f7d7c28a16ab28cb4e21da75c590e1505c064bc73",
    "claimKind": "specification",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "heading",
      "level": 4,
      "title": "VIII. Sau distill — implement, review độc lập, và verify thật (2026-08-15/16)",
      "anchor": "viii-sau-distill-implement-review-độc-lập-và-verify-thật-2026-08-1516",
      "githubAnchor": "viii-sau-distill-implement-review-độc-lập-và-verify-thật-2026-08-1516",
      "stableAnchor": "h-ecbe7eabc6cf",
      "startLine": 2311,
      "endLine": 2311,
      "textDigest": "a143984b5d286e2892a0a62f7d7c28a16ab28cb4e21da75c590e1505c064bc73",
      "sample": "VIII. Sau distill — implement, review độc lập, và verify thật (2026-08-15/16)",
      "sectionPayloadDigest": "bb4e1481b6524c0c7c5d7b13382886f0f504e981ef7098c4c296e1ab7b2e2093",
      "followingBlockDigest": "721cb9fe837087d22e83ba6ac1761a6cf9c628a88e0445f49dd1bd26943a8ec9",
      "identityFingerprint": "64d14cf1ae7f69707dfbee6a85992f4868270afb6de2f7f09c58d15b1b657c65",
      "ancestry": [
        "0002 — Mô hình việc phẳng",
        "0032 — Multi-role Team Harness: trục role/holder, handoff, và marketing-cockpit absorption"
      ],
      "text": "#### VIII. Sau distill — implement, review độc lập, và verify thật (2026-08-15/16)",
      "sectionText": "#### VIII. Sau distill — implement, review độc lập, và verify thật (2026-08-15/16)\n\nPhần này KHÔNG có trong bản distill gốc — thêm khi copy sang\n`docs/decisions/` để bản ghi không đứng yên khi thực tế đã đi xa hơn.\nToàn bộ chi tiết per-D-ID, per-commit sống ở\n`docs/history/fgos-marketing-domain-foundation/CONTEXT.md` (bảng)\nvà `DISCUSSION.md` (Q&A theo round); đây chỉ là điểm mốc.\n\nBa mảnh ①②③ implement, test, tự review, commit tuần tự trên chính branch\n`fgw/tsk-2t9c` theo lệnh người dùng (\"mọi thứ tự quyết\"). Sau đó, theo\nyêu cầu review nghiêm túc của người dùng:\n\n- **Nối dây handoff thật**: 5 skill coding-domain (`fgos-coding-implement`/\n  `discovering`/`exploring`/`planning`/`validating`) nối dây thật vào\n  `handoff`/`handoff-return` — không chỉ có cơ chế, mà skill THẬT gọi nó.\n- **Review độc lập**: review độc lập (agent `code-reviewer` mới, không chia sẻ\n  context) tìm ra 2 lỗi HIGH + 3 MED + 4 LOW trong chính cách nối dây\n  handoff thật vừa làm ở trên — tất cả đã sửa (chi tiết: giữ role/holder axis nhất quán qua\n  reclaim lặp tới khi về `implementer`, `roleGraph` phủ cả stage\n  `decompose` legacy, v.v.).\n- **Khoá `kind` sau khi rời `todo`**: một câu hỏi kiến trúc của người dùng (\"`fgos-coding-driving`\n  có nên là cross-workflow router?\") dẫn tới tư vấn Opus độc lập, phát\n  hiện `kind` (field chọn workflow của item) sửa tự do không kiểm soát —\n  fix: khoá `kind` một khi `status` rời `todo`, không cần field\n  `workflow` riêng.\n- **Chuyển lệnh review vào ENGINE**: một lần chạy AGENT THẬT (không phải test đơn vị) theo đúng\n  prose của `fgos-coding-implement`, trên một item thật, phát hiện\n  handoff `review` KHÔNG bắn được trong thực tế dù prose ra lệnh rõ ràng\n  — nguyên nhân: lệnh nằm cuối, lặp lại 2 lần (return/catchup), không gì\n  kiểm tra khi bị bỏ sót. Fix: chuyển lệnh vào ENGINE (`moveWork` tự bắn\n  khi `status` chạm `awaiting-approval`), không còn phụ thuộc agent đọc\n  hết prose. Xác nhận lại bằng agent thật lần nữa (`tsk-3vk`,\n  2026-08-16): `work.handoff` với `reason: \"review\"` bắn đúng, agent\n  không hề tự gọi.\n\nBài học chung xuyên suốt ba mục trên: **test đơn vị/tích hợp chứng minh\nengine đúng, không chứng minh agent theo prose sẽ hành xử đúng** — chỉ\nmột lần chạy thật, agent thật, theo đúng hướng dẫn, trên item thật, mới\nlộ ra khoảng cách đó. Nơi khoảng cách này lặp lại (một hành vi bắt buộc\nnhưng không gì kiểm tra khi bị bỏ sót), hướng sửa đúng là chuyển bảo\nđảm vào engine, không phải viết prose mạnh hơn."
    }
  },
  "currentTarget": {
    "unitKind": "heading",
    "level": 2,
    "title": "4. Implementation Review And Verification After Distill",
    "anchor": "4-implementation-review-and-verification-after-distill",
    "githubAnchor": "4-implementation-review-and-verification-after-distill",
    "stableAnchor": "h-8714505a6de4",
    "startLine": 46,
    "endLine": 46,
    "textDigest": "a88add6a18b0023671d9f83c9261dfd52d1440fd05936db3be3acd430adb0b11",
    "sample": "4. Implementation Review And Verification After Distill",
    "sectionPayloadDigest": "bb4e1481b6524c0c7c5d7b13382886f0f504e981ef7098c4c296e1ab7b2e2093",
    "followingBlockDigest": "721cb9fe837087d22e83ba6ac1761a6cf9c628a88e0445f49dd1bd26943a8ec9",
    "identityFingerprint": "e3db0ca70041dbb6e85f6ef9c1c4b1f325702dcfdfd867d6df7c8a4f5d93f933",
    "ancestry": [
      "Multi-Role Harness Distill Record"
    ],
    "text": "## 4. Implementation Review And Verification After Distill",
    "sectionText": "## 4. Implementation Review And Verification After Distill\n\nPhần này KHÔNG có trong bản distill gốc — thêm khi copy sang\n`docs/decisions/` để bản ghi không đứng yên khi thực tế đã đi xa hơn.\nToàn bộ chi tiết per-D-ID, per-commit sống ở\n`docs/history/fgos-marketing-domain-foundation/CONTEXT.md` (bảng)\nvà `DISCUSSION.md` (Q&A theo round); đây chỉ là điểm mốc.\n\nBa mảnh ①②③ implement, test, tự review, commit tuần tự trên chính branch\n`fgw/tsk-2t9c` theo lệnh người dùng (\"mọi thứ tự quyết\"). Sau đó, theo\nyêu cầu review nghiêm túc của người dùng:\n\n- **Nối dây handoff thật**: 5 skill coding-domain (`fgos-coding-implement`/\n  `discovering`/`exploring`/`planning`/`validating`) nối dây thật vào\n  `handoff`/`handoff-return` — không chỉ có cơ chế, mà skill THẬT gọi nó.\n- **Review độc lập**: review độc lập (agent `code-reviewer` mới, không chia sẻ\n  context) tìm ra 2 lỗi HIGH + 3 MED + 4 LOW trong chính cách nối dây\n  handoff thật vừa làm ở trên — tất cả đã sửa (chi tiết: giữ role/holder axis nhất quán qua\n  reclaim lặp tới khi về `implementer`, `roleGraph` phủ cả stage\n  `decompose` legacy, v.v.).\n- **Khoá `kind` sau khi rời `todo`**: một câu hỏi kiến trúc của người dùng (\"`fgos-coding-driving`\n  có nên là cross-workflow router?\") dẫn tới tư vấn Opus độc lập, phát\n  hiện `kind` (field chọn workflow của item) sửa tự do không kiểm soát —\n  fix: khoá `kind` một khi `status` rời `todo`, không cần field\n  `workflow` riêng.\n- **Chuyển lệnh review vào ENGINE**: một lần chạy AGENT THẬT (không phải test đơn vị) theo đúng\n  prose của `fgos-coding-implement`, trên một item thật, phát hiện\n  handoff `review` KHÔNG bắn được trong thực tế dù prose ra lệnh rõ ràng\n  — nguyên nhân: lệnh nằm cuối, lặp lại 2 lần (return/catchup), không gì\n  kiểm tra khi bị bỏ sót. Fix: chuyển lệnh vào ENGINE (`moveWork` tự bắn\n  khi `status` chạm `awaiting-approval`), không còn phụ thuộc agent đọc\n  hết prose. Xác nhận lại bằng agent thật lần nữa (`tsk-3vk`,\n  2026-08-16): `work.handoff` với `reason: \"review\"` bắn đúng, agent\n  không hề tự gọi.\n\nBài học chung xuyên suốt ba mục trên: **test đơn vị/tích hợp chứng minh\nengine đúng, không chứng minh agent theo prose sẽ hành xử đúng** — chỉ\nmột lần chạy thật, agent thật, theo đúng hướng dẫn, trên item thật, mới\nlộ ra khoảng cách đó. Nơi khoảng cách này lặp lại (một hành vi bắt buộc\nnhưng không gì kiểm tra khi bị bỏ sót), hướng sửa đúng là chuyển bảo\nđảm vào engine, không phải viết prose mạnh hơn."
  },
  "sourceTargetDigestsUnequal": true,
  "classObservation": {
    "class": "Judgment",
    "reason": "no target digest match",
    "targetUnit": null
  },
  "mechanicalRequired": true,
  "deepRequired": true,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_581643ec8243af5744e04c222f13c214"
}
```

## Entry claim_690988881136792349476d55b83bd81d

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_690988881136792349476d55b83bd81d",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "b-decisions-second",
  "before": {
    "claimId": "claim_690988881136792349476d55b83bd81d",
    "sourceUnitDigest": "721cb9fe837087d2",
    "targetOwner": "docs/platform/work-state/history/multi-role-harness-distill-record.md",
    "targetAnchor": "unheaded-block-5",
    "claimKind": "historical-context",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Note that this section was not in the original distill and was added when copying to docs/decisions; carried verbatim.",
    "reviewedBy": "independent reviewer (review-b-decisions-second)",
    "reviewedAt": "2026-10-07",
    "targetUnitDigest": "721cb9fe837087d22e83ba6ac1761a6c"
  },
  "currentDecision": {
    "claimId": "claim_690988881136792349476d55b83bd81d",
    "sourceUnitDigest": "721cb9fe837087d2",
    "targetOwner": "docs/platform/work-state/history/multi-role-harness-distill-record.md",
    "targetAnchor": "unheaded-block-5",
    "claimKind": "historical-context",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "Note that this section was not in the original distill and was added when copying to docs/decisions; carried verbatim. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
    "targetUnitDigest": "721cb9fe837087d22e83ba6ac1761a6cf9c628a88e0445f49dd1bd26943a8ec9",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetAncestry": [
      "Multi-Role Harness Distill Record",
      "4. Implementation Review And Verification After Distill"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/specs/work-state.md",
    "unitDigest": "3da0a94058f50ca7c6fdc74dc1d3e4521a78b12ea20772eec7b1738eefc9b560",
    "identityFingerprint": "3da0a94058f50ca7c6fdc74dc1d3e4521a78b12ea20772eec7b1738eefc9b560",
    "claimId": "claim_690988881136792349476d55b83bd81d",
    "sourceAnchor": "unheaded-block-207",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "721cb9fe837087d22e83ba6ac1761a6cf9c628a88e0445f49dd1bd26943a8ec9",
    "claimKind": "specification",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-207",
      "githubAnchor": "unheaded-block-207",
      "stableAnchor": "unheaded-block-207",
      "title": "Unheaded block 207",
      "startLine": 2313,
      "endLine": 2317,
      "textDigest": "721cb9fe837087d22e83ba6ac1761a6cf9c628a88e0445f49dd1bd26943a8ec9",
      "sample": "Phần này KHÔNG có trong bản distill gốc — thêm khi copy sang\n`docs/decisions/` để bản ghi không đứng yên khi thực tế đã đi xa hơn.\nToàn bộ chi tiết per-D-ID, per-commit sống ở\n`doc",
      "identityFingerprint": "3da0a94058f50ca7c6fdc74dc1d3e4521a78b12ea20772eec7b1738eefc9b560",
      "ancestry": [
        "0002 — Mô hình việc phẳng",
        "0032 — Multi-role Team Harness: trục role/holder, handoff, và marketing-cockpit absorption",
        "VIII. Sau distill — implement, review độc lập, và verify thật (2026-08-15/16)"
      ],
      "text": "Phần này KHÔNG có trong bản distill gốc — thêm khi copy sang\n`docs/decisions/` để bản ghi không đứng yên khi thực tế đã đi xa hơn.\nToàn bộ chi tiết per-D-ID, per-commit sống ở\n`docs/history/fgos-marketing-domain-foundation/CONTEXT.md` (bảng)\nvà `DISCUSSION.md` (Q&A theo round); đây chỉ là điểm mốc."
    }
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-5",
    "githubAnchor": "unheaded-block-5",
    "stableAnchor": "unheaded-block-5",
    "title": "Unheaded block 5",
    "startLine": 48,
    "endLine": 52,
    "textDigest": "721cb9fe837087d22e83ba6ac1761a6cf9c628a88e0445f49dd1bd26943a8ec9",
    "sample": "Phần này KHÔNG có trong bản distill gốc — thêm khi copy sang\n`docs/decisions/` để bản ghi không đứng yên khi thực tế đã đi xa hơn.\nToàn bộ chi tiết per-D-ID, per-commit sống ở\n`doc",
    "identityFingerprint": "3da0a94058f50ca7c6fdc74dc1d3e4521a78b12ea20772eec7b1738eefc9b560",
    "ancestry": [
      "Multi-Role Harness Distill Record",
      "4. Implementation Review And Verification After Distill"
    ],
    "text": "Phần này KHÔNG có trong bản distill gốc — thêm khi copy sang\n`docs/decisions/` để bản ghi không đứng yên khi thực tế đã đi xa hơn.\nToàn bộ chi tiết per-D-ID, per-commit sống ở\n`docs/history/fgos-marketing-domain-foundation/CONTEXT.md` (bảng)\nvà `DISCUSSION.md` (Q&A theo round); đây chỉ là điểm mốc."
  },
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Weak-exact",
    "reason": "ancestor headings differ; document exact share below one half",
    "targetUnit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-5",
      "githubAnchor": "unheaded-block-5",
      "stableAnchor": "unheaded-block-5",
      "title": "Unheaded block 5",
      "startLine": 48,
      "endLine": 52,
      "textDigest": "721cb9fe837087d22e83ba6ac1761a6cf9c628a88e0445f49dd1bd26943a8ec9",
      "sample": "Phần này KHÔNG có trong bản distill gốc — thêm khi copy sang\n`docs/decisions/` để bản ghi không đứng yên khi thực tế đã đi xa hơn.\nToàn bộ chi tiết per-D-ID, per-commit sống ở\n`doc",
      "identityFingerprint": "3da0a94058f50ca7c6fdc74dc1d3e4521a78b12ea20772eec7b1738eefc9b560",
      "ancestry": [
        "Multi-Role Harness Distill Record",
        "4. Implementation Review And Verification After Distill"
      ],
      "text": "Phần này KHÔNG có trong bản distill gốc — thêm khi copy sang\n`docs/decisions/` để bản ghi không đứng yên khi thực tế đã đi xa hơn.\nToàn bộ chi tiết per-D-ID, per-commit sống ở\n`docs/history/fgos-marketing-domain-foundation/CONTEXT.md` (bảng)\nvà `DISCUSSION.md` (Q&A theo round); đây chỉ là điểm mốc."
    }
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_690988881136792349476d55b83bd81d"
}
```

## Entry claim_e24e9588d1d0d0ec87a1a90db87e62b9

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_e24e9588d1d0d0ec87a1a90db87e62b9",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "b-decisions-second",
  "before": {
    "claimId": "claim_e24e9588d1d0d0ec87a1a90db87e62b9",
    "sourceUnitDigest": "42f0a4f36be3f872",
    "targetOwner": "docs/platform/work-state/history/multi-role-harness-distill-record.md",
    "targetAnchor": "unheaded-block-6",
    "claimKind": "historical-context",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Paragraph on the three pieces implemented, tested, self-reviewed and committed sequentially; carried verbatim.",
    "reviewedBy": "independent reviewer (review-b-decisions-second)",
    "reviewedAt": "2026-10-07",
    "targetUnitDigest": "42f0a4f36be3f8722adbd5bc7066fc53"
  },
  "currentDecision": {
    "claimId": "claim_e24e9588d1d0d0ec87a1a90db87e62b9",
    "sourceUnitDigest": "42f0a4f36be3f872",
    "targetOwner": "docs/platform/work-state/history/multi-role-harness-distill-record.md",
    "targetAnchor": "unheaded-block-6",
    "claimKind": "historical-context",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "Paragraph on the three pieces implemented, tested, self-reviewed and committed sequentially; carried verbatim. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
    "targetUnitDigest": "42f0a4f36be3f8722adbd5bc7066fc539bd31e67484940ec1c0e7f3c6a0d7cb8",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetAncestry": [
      "Multi-Role Harness Distill Record",
      "4. Implementation Review And Verification After Distill"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/specs/work-state.md",
    "unitDigest": "c28ed0b1b54655476a627f763b64cc71d273957fac82bd38df2b52dd323e9fed",
    "identityFingerprint": "c28ed0b1b54655476a627f763b64cc71d273957fac82bd38df2b52dd323e9fed",
    "claimId": "claim_e24e9588d1d0d0ec87a1a90db87e62b9",
    "sourceAnchor": "unheaded-block-208",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "42f0a4f36be3f8722adbd5bc7066fc539bd31e67484940ec1c0e7f3c6a0d7cb8",
    "claimKind": "specification",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-208",
      "githubAnchor": "unheaded-block-208",
      "stableAnchor": "unheaded-block-208",
      "title": "Unheaded block 208",
      "startLine": 2319,
      "endLine": 2321,
      "textDigest": "42f0a4f36be3f8722adbd5bc7066fc539bd31e67484940ec1c0e7f3c6a0d7cb8",
      "sample": "Ba mảnh ①②③ implement, test, tự review, commit tuần tự trên chính branch\n`fgw/tsk-2t9c` theo lệnh người dùng (\"mọi thứ tự quyết\"). Sau đó, theo\nyêu cầu review nghiêm túc của người ",
      "identityFingerprint": "c28ed0b1b54655476a627f763b64cc71d273957fac82bd38df2b52dd323e9fed",
      "ancestry": [
        "0002 — Mô hình việc phẳng",
        "0032 — Multi-role Team Harness: trục role/holder, handoff, và marketing-cockpit absorption",
        "VIII. Sau distill — implement, review độc lập, và verify thật (2026-08-15/16)"
      ],
      "text": "Ba mảnh ①②③ implement, test, tự review, commit tuần tự trên chính branch\n`fgw/tsk-2t9c` theo lệnh người dùng (\"mọi thứ tự quyết\"). Sau đó, theo\nyêu cầu review nghiêm túc của người dùng:"
    }
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-6",
    "githubAnchor": "unheaded-block-6",
    "stableAnchor": "unheaded-block-6",
    "title": "Unheaded block 6",
    "startLine": 54,
    "endLine": 56,
    "textDigest": "42f0a4f36be3f8722adbd5bc7066fc539bd31e67484940ec1c0e7f3c6a0d7cb8",
    "sample": "Ba mảnh ①②③ implement, test, tự review, commit tuần tự trên chính branch\n`fgw/tsk-2t9c` theo lệnh người dùng (\"mọi thứ tự quyết\"). Sau đó, theo\nyêu cầu review nghiêm túc của người ",
    "identityFingerprint": "c28ed0b1b54655476a627f763b64cc71d273957fac82bd38df2b52dd323e9fed",
    "ancestry": [
      "Multi-Role Harness Distill Record",
      "4. Implementation Review And Verification After Distill"
    ],
    "text": "Ba mảnh ①②③ implement, test, tự review, commit tuần tự trên chính branch\n`fgw/tsk-2t9c` theo lệnh người dùng (\"mọi thứ tự quyết\"). Sau đó, theo\nyêu cầu review nghiêm túc của người dùng:"
  },
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Weak-exact",
    "reason": "ancestor headings differ; document exact share below one half",
    "targetUnit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-6",
      "githubAnchor": "unheaded-block-6",
      "stableAnchor": "unheaded-block-6",
      "title": "Unheaded block 6",
      "startLine": 54,
      "endLine": 56,
      "textDigest": "42f0a4f36be3f8722adbd5bc7066fc539bd31e67484940ec1c0e7f3c6a0d7cb8",
      "sample": "Ba mảnh ①②③ implement, test, tự review, commit tuần tự trên chính branch\n`fgw/tsk-2t9c` theo lệnh người dùng (\"mọi thứ tự quyết\"). Sau đó, theo\nyêu cầu review nghiêm túc của người ",
      "identityFingerprint": "c28ed0b1b54655476a627f763b64cc71d273957fac82bd38df2b52dd323e9fed",
      "ancestry": [
        "Multi-Role Harness Distill Record",
        "4. Implementation Review And Verification After Distill"
      ],
      "text": "Ba mảnh ①②③ implement, test, tự review, commit tuần tự trên chính branch\n`fgw/tsk-2t9c` theo lệnh người dùng (\"mọi thứ tự quyết\"). Sau đó, theo\nyêu cầu review nghiêm túc của người dùng:"
    }
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_e24e9588d1d0d0ec87a1a90db87e62b9"
}
```

## Entry claim_6866da75d153e251a298ec889e5e67f8

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_6866da75d153e251a298ec889e5e67f8",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "b-decisions-second",
  "before": {
    "claimId": "claim_6866da75d153e251a298ec889e5e67f8",
    "sourceUnitDigest": "0ce476ffc3451d8e",
    "targetOwner": "docs/platform/work-state/history/multi-role-harness-distill-record.md",
    "targetAnchor": "unheaded-block-7",
    "claimKind": "historical-context",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Long post-distill list (real handoff wiring, independent review, real verify); 22 lines carried verbatim.",
    "reviewedBy": "independent reviewer (review-b-decisions-second)",
    "reviewedAt": "2026-10-07",
    "targetUnitDigest": "0ce476ffc3451d8e11c1e2c4c802eb70"
  },
  "currentDecision": {
    "claimId": "claim_6866da75d153e251a298ec889e5e67f8",
    "sourceUnitDigest": "0ce476ffc3451d8e",
    "targetOwner": "docs/platform/work-state/history/multi-role-harness-distill-record.md",
    "targetAnchor": "unheaded-block-7",
    "claimKind": "historical-context",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "Long post-distill list (real handoff wiring, independent review, real verify); 22 lines carried verbatim. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
    "targetUnitDigest": "0ce476ffc3451d8e11c1e2c4c802eb70edf96b3e83627708fa309fbfba167bde",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetAncestry": [
      "Multi-Role Harness Distill Record",
      "4. Implementation Review And Verification After Distill"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/specs/work-state.md",
    "unitDigest": "fb6d39eea7ec2c5da74f5276ac9f8144fff0c8b700b6603fe36cf31a0f0fb02f",
    "identityFingerprint": "fb6d39eea7ec2c5da74f5276ac9f8144fff0c8b700b6603fe36cf31a0f0fb02f",
    "claimId": "claim_6866da75d153e251a298ec889e5e67f8",
    "sourceAnchor": "unheaded-block-209",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "0ce476ffc3451d8e11c1e2c4c802eb70edf96b3e83627708fa309fbfba167bde",
    "claimKind": "specification",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-209",
      "githubAnchor": "unheaded-block-209",
      "stableAnchor": "unheaded-block-209",
      "title": "Unheaded block 209",
      "startLine": 2323,
      "endLine": 2344,
      "textDigest": "0ce476ffc3451d8e11c1e2c4c802eb70edf96b3e83627708fa309fbfba167bde",
      "sample": "- **Nối dây handoff thật**: 5 skill coding-domain (`fgos-coding-implement`/\n  `discovering`/`exploring`/`planning`/`validating`) nối dây thật vào\n  `handoff`/`handoff-return` — khô",
      "identityFingerprint": "fb6d39eea7ec2c5da74f5276ac9f8144fff0c8b700b6603fe36cf31a0f0fb02f",
      "ancestry": [
        "0002 — Mô hình việc phẳng",
        "0032 — Multi-role Team Harness: trục role/holder, handoff, và marketing-cockpit absorption",
        "VIII. Sau distill — implement, review độc lập, và verify thật (2026-08-15/16)"
      ],
      "text": "- **Nối dây handoff thật**: 5 skill coding-domain (`fgos-coding-implement`/\n  `discovering`/`exploring`/`planning`/`validating`) nối dây thật vào\n  `handoff`/`handoff-return` — không chỉ có cơ chế, mà skill THẬT gọi nó.\n- **Review độc lập**: review độc lập (agent `code-reviewer` mới, không chia sẻ\n  context) tìm ra 2 lỗi HIGH + 3 MED + 4 LOW trong chính cách nối dây\n  handoff thật vừa làm ở trên — tất cả đã sửa (chi tiết: giữ role/holder axis nhất quán qua\n  reclaim lặp tới khi về `implementer`, `roleGraph` phủ cả stage\n  `decompose` legacy, v.v.).\n- **Khoá `kind` sau khi rời `todo`**: một câu hỏi kiến trúc của người dùng (\"`fgos-coding-driving`\n  có nên là cross-workflow router?\") dẫn tới tư vấn Opus độc lập, phát\n  hiện `kind` (field chọn workflow của item) sửa tự do không kiểm soát —\n  fix: khoá `kind` một khi `status` rời `todo`, không cần field\n  `workflow` riêng.\n- **Chuyển lệnh review vào ENGINE**: một lần chạy AGENT THẬT (không phải test đơn vị) theo đúng\n  prose của `fgos-coding-implement`, trên một item thật, phát hiện\n  handoff `review` KHÔNG bắn được trong thực tế dù prose ra lệnh rõ ràng\n  — nguyên nhân: lệnh nằm cuối, lặp lại 2 lần (return/catchup), không gì\n  kiểm tra khi bị bỏ sót. Fix: chuyển lệnh vào ENGINE (`moveWork` tự bắn\n  khi `status` chạm `awaiting-approval`), không còn phụ thuộc agent đọc\n  hết prose. Xác nhận lại bằng agent thật lần nữa (`tsk-3vk`,\n  2026-08-16): `work.handoff` với `reason: \"review\"` bắn đúng, agent\n  không hề tự gọi."
    }
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-7",
    "githubAnchor": "unheaded-block-7",
    "stableAnchor": "unheaded-block-7",
    "title": "Unheaded block 7",
    "startLine": 58,
    "endLine": 79,
    "textDigest": "0ce476ffc3451d8e11c1e2c4c802eb70edf96b3e83627708fa309fbfba167bde",
    "sample": "- **Nối dây handoff thật**: 5 skill coding-domain (`fgos-coding-implement`/\n  `discovering`/`exploring`/`planning`/`validating`) nối dây thật vào\n  `handoff`/`handoff-return` — khô",
    "identityFingerprint": "fb6d39eea7ec2c5da74f5276ac9f8144fff0c8b700b6603fe36cf31a0f0fb02f",
    "ancestry": [
      "Multi-Role Harness Distill Record",
      "4. Implementation Review And Verification After Distill"
    ],
    "text": "- **Nối dây handoff thật**: 5 skill coding-domain (`fgos-coding-implement`/\n  `discovering`/`exploring`/`planning`/`validating`) nối dây thật vào\n  `handoff`/`handoff-return` — không chỉ có cơ chế, mà skill THẬT gọi nó.\n- **Review độc lập**: review độc lập (agent `code-reviewer` mới, không chia sẻ\n  context) tìm ra 2 lỗi HIGH + 3 MED + 4 LOW trong chính cách nối dây\n  handoff thật vừa làm ở trên — tất cả đã sửa (chi tiết: giữ role/holder axis nhất quán qua\n  reclaim lặp tới khi về `implementer`, `roleGraph` phủ cả stage\n  `decompose` legacy, v.v.).\n- **Khoá `kind` sau khi rời `todo`**: một câu hỏi kiến trúc của người dùng (\"`fgos-coding-driving`\n  có nên là cross-workflow router?\") dẫn tới tư vấn Opus độc lập, phát\n  hiện `kind` (field chọn workflow của item) sửa tự do không kiểm soát —\n  fix: khoá `kind` một khi `status` rời `todo`, không cần field\n  `workflow` riêng.\n- **Chuyển lệnh review vào ENGINE**: một lần chạy AGENT THẬT (không phải test đơn vị) theo đúng\n  prose của `fgos-coding-implement`, trên một item thật, phát hiện\n  handoff `review` KHÔNG bắn được trong thực tế dù prose ra lệnh rõ ràng\n  — nguyên nhân: lệnh nằm cuối, lặp lại 2 lần (return/catchup), không gì\n  kiểm tra khi bị bỏ sót. Fix: chuyển lệnh vào ENGINE (`moveWork` tự bắn\n  khi `status` chạm `awaiting-approval`), không còn phụ thuộc agent đọc\n  hết prose. Xác nhận lại bằng agent thật lần nữa (`tsk-3vk`,\n  2026-08-16): `work.handoff` với `reason: \"review\"` bắn đúng, agent\n  không hề tự gọi."
  },
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Weak-exact",
    "reason": "ancestor headings differ; document exact share below one half",
    "targetUnit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-7",
      "githubAnchor": "unheaded-block-7",
      "stableAnchor": "unheaded-block-7",
      "title": "Unheaded block 7",
      "startLine": 58,
      "endLine": 79,
      "textDigest": "0ce476ffc3451d8e11c1e2c4c802eb70edf96b3e83627708fa309fbfba167bde",
      "sample": "- **Nối dây handoff thật**: 5 skill coding-domain (`fgos-coding-implement`/\n  `discovering`/`exploring`/`planning`/`validating`) nối dây thật vào\n  `handoff`/`handoff-return` — khô",
      "identityFingerprint": "fb6d39eea7ec2c5da74f5276ac9f8144fff0c8b700b6603fe36cf31a0f0fb02f",
      "ancestry": [
        "Multi-Role Harness Distill Record",
        "4. Implementation Review And Verification After Distill"
      ],
      "text": "- **Nối dây handoff thật**: 5 skill coding-domain (`fgos-coding-implement`/\n  `discovering`/`exploring`/`planning`/`validating`) nối dây thật vào\n  `handoff`/`handoff-return` — không chỉ có cơ chế, mà skill THẬT gọi nó.\n- **Review độc lập**: review độc lập (agent `code-reviewer` mới, không chia sẻ\n  context) tìm ra 2 lỗi HIGH + 3 MED + 4 LOW trong chính cách nối dây\n  handoff thật vừa làm ở trên — tất cả đã sửa (chi tiết: giữ role/holder axis nhất quán qua\n  reclaim lặp tới khi về `implementer`, `roleGraph` phủ cả stage\n  `decompose` legacy, v.v.).\n- **Khoá `kind` sau khi rời `todo`**: một câu hỏi kiến trúc của người dùng (\"`fgos-coding-driving`\n  có nên là cross-workflow router?\") dẫn tới tư vấn Opus độc lập, phát\n  hiện `kind` (field chọn workflow của item) sửa tự do không kiểm soát —\n  fix: khoá `kind` một khi `status` rời `todo`, không cần field\n  `workflow` riêng.\n- **Chuyển lệnh review vào ENGINE**: một lần chạy AGENT THẬT (không phải test đơn vị) theo đúng\n  prose của `fgos-coding-implement`, trên một item thật, phát hiện\n  handoff `review` KHÔNG bắn được trong thực tế dù prose ra lệnh rõ ràng\n  — nguyên nhân: lệnh nằm cuối, lặp lại 2 lần (return/catchup), không gì\n  kiểm tra khi bị bỏ sót. Fix: chuyển lệnh vào ENGINE (`moveWork` tự bắn\n  khi `status` chạm `awaiting-approval`), không còn phụ thuộc agent đọc\n  hết prose. Xác nhận lại bằng agent thật lần nữa (`tsk-3vk`,\n  2026-08-16): `work.handoff` với `reason: \"review\"` bắn đúng, agent\n  không hề tự gọi."
    }
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_6866da75d153e251a298ec889e5e67f8"
}
```

## Entry claim_48a16587298cde876c7142378489c618

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_48a16587298cde876c7142378489c618",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "b-decisions-second",
  "before": {
    "claimId": "claim_48a16587298cde876c7142378489c618",
    "sourceUnitDigest": "71b2516db6bbf541",
    "targetOwner": "docs/platform/work-state/history/multi-role-harness-distill-record.md",
    "targetAnchor": "unheaded-block-8",
    "claimKind": "historical-context",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Closing lesson paragraph of the post-distill section (unit/integration tests prove engine, not real run); carried verbatim.",
    "reviewedBy": "independent reviewer (review-b-decisions-second)",
    "reviewedAt": "2026-10-07",
    "targetUnitDigest": "71b2516db6bbf541250e88bbb6278687"
  },
  "currentDecision": {
    "claimId": "claim_48a16587298cde876c7142378489c618",
    "sourceUnitDigest": "71b2516db6bbf541",
    "targetOwner": "docs/platform/work-state/history/multi-role-harness-distill-record.md",
    "targetAnchor": "unheaded-block-8",
    "claimKind": "historical-context",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "Closing lesson paragraph of the post-distill section (unit/integration tests prove engine, not real run); carried verbatim. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
    "targetUnitDigest": "71b2516db6bbf541250e88bbb627868772f01e932ba697f12b1bafa46adc00fc",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetAncestry": [
      "Multi-Role Harness Distill Record",
      "4. Implementation Review And Verification After Distill"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/specs/work-state.md",
    "unitDigest": "f94e850848cac2f72f805e184e6a7808ef9fa3855ae71fb4dc4de53c63e29f40",
    "identityFingerprint": "f94e850848cac2f72f805e184e6a7808ef9fa3855ae71fb4dc4de53c63e29f40",
    "claimId": "claim_48a16587298cde876c7142378489c618",
    "sourceAnchor": "unheaded-block-210",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "71b2516db6bbf541250e88bbb627868772f01e932ba697f12b1bafa46adc00fc",
    "claimKind": "specification",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-210",
      "githubAnchor": "unheaded-block-210",
      "stableAnchor": "unheaded-block-210",
      "title": "Unheaded block 210",
      "startLine": 2346,
      "endLine": 2351,
      "textDigest": "71b2516db6bbf541250e88bbb627868772f01e932ba697f12b1bafa46adc00fc",
      "sample": "Bài học chung xuyên suốt ba mục trên: **test đơn vị/tích hợp chứng minh\nengine đúng, không chứng minh agent theo prose sẽ hành xử đúng** — chỉ\nmột lần chạy thật, agent thật, theo đ",
      "identityFingerprint": "f94e850848cac2f72f805e184e6a7808ef9fa3855ae71fb4dc4de53c63e29f40",
      "ancestry": [
        "0002 — Mô hình việc phẳng",
        "0032 — Multi-role Team Harness: trục role/holder, handoff, và marketing-cockpit absorption",
        "VIII. Sau distill — implement, review độc lập, và verify thật (2026-08-15/16)"
      ],
      "text": "Bài học chung xuyên suốt ba mục trên: **test đơn vị/tích hợp chứng minh\nengine đúng, không chứng minh agent theo prose sẽ hành xử đúng** — chỉ\nmột lần chạy thật, agent thật, theo đúng hướng dẫn, trên item thật, mới\nlộ ra khoảng cách đó. Nơi khoảng cách này lặp lại (một hành vi bắt buộc\nnhưng không gì kiểm tra khi bị bỏ sót), hướng sửa đúng là chuyển bảo\nđảm vào engine, không phải viết prose mạnh hơn."
    }
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-8",
    "githubAnchor": "unheaded-block-8",
    "stableAnchor": "unheaded-block-8",
    "title": "Unheaded block 8",
    "startLine": 81,
    "endLine": 86,
    "textDigest": "71b2516db6bbf541250e88bbb627868772f01e932ba697f12b1bafa46adc00fc",
    "sample": "Bài học chung xuyên suốt ba mục trên: **test đơn vị/tích hợp chứng minh\nengine đúng, không chứng minh agent theo prose sẽ hành xử đúng** — chỉ\nmột lần chạy thật, agent thật, theo đ",
    "identityFingerprint": "f94e850848cac2f72f805e184e6a7808ef9fa3855ae71fb4dc4de53c63e29f40",
    "ancestry": [
      "Multi-Role Harness Distill Record",
      "4. Implementation Review And Verification After Distill"
    ],
    "text": "Bài học chung xuyên suốt ba mục trên: **test đơn vị/tích hợp chứng minh\nengine đúng, không chứng minh agent theo prose sẽ hành xử đúng** — chỉ\nmột lần chạy thật, agent thật, theo đúng hướng dẫn, trên item thật, mới\nlộ ra khoảng cách đó. Nơi khoảng cách này lặp lại (một hành vi bắt buộc\nnhưng không gì kiểm tra khi bị bỏ sót), hướng sửa đúng là chuyển bảo\nđảm vào engine, không phải viết prose mạnh hơn."
  },
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Weak-exact",
    "reason": "ancestor headings differ; document exact share below one half",
    "targetUnit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-8",
      "githubAnchor": "unheaded-block-8",
      "stableAnchor": "unheaded-block-8",
      "title": "Unheaded block 8",
      "startLine": 81,
      "endLine": 86,
      "textDigest": "71b2516db6bbf541250e88bbb627868772f01e932ba697f12b1bafa46adc00fc",
      "sample": "Bài học chung xuyên suốt ba mục trên: **test đơn vị/tích hợp chứng minh\nengine đúng, không chứng minh agent theo prose sẽ hành xử đúng** — chỉ\nmột lần chạy thật, agent thật, theo đ",
      "identityFingerprint": "f94e850848cac2f72f805e184e6a7808ef9fa3855ae71fb4dc4de53c63e29f40",
      "ancestry": [
        "Multi-Role Harness Distill Record",
        "4. Implementation Review And Verification After Distill"
      ],
      "text": "Bài học chung xuyên suốt ba mục trên: **test đơn vị/tích hợp chứng minh\nengine đúng, không chứng minh agent theo prose sẽ hành xử đúng** — chỉ\nmột lần chạy thật, agent thật, theo đúng hướng dẫn, trên item thật, mới\nlộ ra khoảng cách đó. Nơi khoảng cách này lặp lại (một hành vi bắt buộc\nnhưng không gì kiểm tra khi bị bỏ sót), hướng sửa đúng là chuyển bảo\nđảm vào engine, không phải viết prose mạnh hơn."
    }
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_48a16587298cde876c7142378489c618"
}
```

## Entry claim_153f56c2d5a2e895f8e6b2607bb7ab3d

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-io-contract.json",
  "collection": "claims",
  "claimId": "claim_153f56c2d5a2e895f8e6b2607bb7ab3d",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "b-io-contract",
  "before": {
    "claimId": "claim_153f56c2d5a2e895f8e6b2607bb7ab3d",
    "sourceUnitDigest": "25e4a007d2fc9a15",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-13",
    "claimKind": "contract",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "role vs writer paragraph (human/runner/session/system) carried verbatim under the new H3 Caller Role; no counterpart in work-state.md per the map.",
    "authoredBy": "codex-session:1@2026-10-08",
    "reviewNote": "Provenance re-confirmation: row byte-equal to its reviewed form at 7df871822 apart from the added authoredBy and the reset review fields; source L41-45 -> target L105-109 (contract/promote); target text byte-equal to source; the sidecar digests extend the decision's short digests and are unchanged since the prior pass. Old approval not carried: now pending.",
    "reviewedBy": "reviewer:claude-session:4df9e88c@2026-10-09",
    "reviewedAt": "2026-10-09",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-2final-b-io-contract.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "25e4a007d2fc9a153cb3273376471f15e4bfca5c257f0c8bf06d1dd6af198770",
    "targetAncestry": [
      "CLI I/O Contract",
      "2. Input Direction Verb And Identity",
      "Caller Role"
    ],
    "reviewReportCommit": "7f8d12784d642097c17e7a7ebdfa4cff43aabbee"
  },
  "currentDecision": {
    "claimId": "claim_153f56c2d5a2e895f8e6b2607bb7ab3d",
    "sourceUnitDigest": "25e4a007d2fc9a15",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-14",
    "claimKind": "contract",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "role vs writer paragraph (human/runner/session/system) carried verbatim under the new H3 Caller Role; no counterpart in work-state.md per the map. A31: target paragraph numbering shifted after the new installation-error paragraph; rebound by unique complete prior target digest, preserving the prior referent.",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetUnitDigest": "25e4a007d2fc9a153cb3273376471f15e4bfca5c257f0c8bf06d1dd6af198770",
    "targetAncestry": [
      "CLI I/O Contract",
      "2. Input Direction Verb And Identity",
      "Caller Role"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/io-contract.md",
    "unitDigest": "25e8ac8713a9e8b0d4e2aec65856e800400119e2ea30774d3f016bbfafa4f8ee",
    "identityFingerprint": "25e8ac8713a9e8b0d4e2aec65856e800400119e2ea30774d3f016bbfafa4f8ee",
    "claimId": "claim_153f56c2d5a2e895f8e6b2607bb7ab3d",
    "sourceAnchor": "unheaded-block-8",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "25e4a007d2fc9a153cb3273376471f15e4bfca5c257f0c8bf06d1dd6af198770",
    "claimKind": "contract",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-8",
      "githubAnchor": "unheaded-block-8",
      "stableAnchor": "unheaded-block-8",
      "title": "Unheaded block 8",
      "startLine": 51,
      "endLine": 55,
      "textDigest": "25e4a007d2fc9a153cb3273376471f15e4bfca5c257f0c8bf06d1dd6af198770",
      "sample": "Song song với `writer` (cá thể), mỗi cạnh chuyển trạng thái còn mang `role`\n— **loại** caller: `human` · `runner` · `session` · `system` (giá trị thứ\ntư, gán tự động cho cạnh park ",
      "identityFingerprint": "25e8ac8713a9e8b0d4e2aec65856e800400119e2ea30774d3f016bbfafa4f8ee",
      "ancestry": [
        "Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`",
        "Chiều vào — verb + danh tính"
      ],
      "text": "Song song với `writer` (cá thể), mỗi cạnh chuyển trạng thái còn mang `role`\n— **loại** caller: `human` · `runner` · `session` · `system` (giá trị thứ\ntư, gán tự động cho cạnh park nội bộ do máy sinh ra như hệ quả một verb,\nkhông do ai quyết định). `role` và `writer` tách bạch: một cái nói \"ai gây\nra\", một cái nói \"loại gì gây ra\"."
    }
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-14",
    "githubAnchor": "unheaded-block-14",
    "stableAnchor": "unheaded-block-14",
    "title": "Unheaded block 14",
    "startLine": 123,
    "endLine": 127,
    "textDigest": "25e4a007d2fc9a153cb3273376471f15e4bfca5c257f0c8bf06d1dd6af198770",
    "sample": "Song song với `writer` (cá thể), mỗi cạnh chuyển trạng thái còn mang `role`\n— **loại** caller: `human` · `runner` · `session` · `system` (giá trị thứ\ntư, gán tự động cho cạnh park ",
    "identityFingerprint": "25e8ac8713a9e8b0d4e2aec65856e800400119e2ea30774d3f016bbfafa4f8ee",
    "ancestry": [
      "CLI I/O Contract",
      "2. Input Direction Verb And Identity",
      "Caller Role"
    ],
    "text": "Song song với `writer` (cá thể), mỗi cạnh chuyển trạng thái còn mang `role`\n— **loại** caller: `human` · `runner` · `session` · `system` (giá trị thứ\ntư, gán tự động cho cạnh park nội bộ do máy sinh ra như hệ quả một verb,\nkhông do ai quyết định). `role` và `writer` tách bạch: một cái nói \"ai gây\nra\", một cái nói \"loại gì gây ra\"."
  },
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Weak-exact",
    "reason": "ancestor headings differ",
    "targetUnit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-14",
      "githubAnchor": "unheaded-block-14",
      "stableAnchor": "unheaded-block-14",
      "title": "Unheaded block 14",
      "startLine": 123,
      "endLine": 127,
      "textDigest": "25e4a007d2fc9a153cb3273376471f15e4bfca5c257f0c8bf06d1dd6af198770",
      "sample": "Song song với `writer` (cá thể), mỗi cạnh chuyển trạng thái còn mang `role`\n— **loại** caller: `human` · `runner` · `session` · `system` (giá trị thứ\ntư, gán tự động cho cạnh park ",
      "identityFingerprint": "25e8ac8713a9e8b0d4e2aec65856e800400119e2ea30774d3f016bbfafa4f8ee",
      "ancestry": [
        "CLI I/O Contract",
        "2. Input Direction Verb And Identity",
        "Caller Role"
      ],
      "text": "Song song với `writer` (cá thể), mỗi cạnh chuyển trạng thái còn mang `role`\n— **loại** caller: `human` · `runner` · `session` · `system` (giá trị thứ\ntư, gán tự động cho cạnh park nội bộ do máy sinh ra như hệ quả một verb,\nkhông do ai quyết định). `role` và `writer` tách bạch: một cái nói \"ai gây\nra\", một cái nói \"loại gì gây ra\"."
    }
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_153f56c2d5a2e895f8e6b2607bb7ab3d"
}
```

## Entry claim_38ad96d62f2c6cf7a639fc24a83c2621

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-io-contract.json",
  "collection": "claims",
  "claimId": "claim_38ad96d62f2c6cf7a639fc24a83c2621",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "b-io-contract",
  "before": {
    "claimId": "claim_38ad96d62f2c6cf7a639fc24a83c2621",
    "sourceUnitDigest": "6dcf0faa76d27fed",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-15",
    "claimKind": "contract",
    "disposition": "merge",
    "reviewStatus": "reviewed",
    "rationale": "First paragraph of the envelope statement (every successful verb in both binaries prints the fgos.v1 envelope), carried verbatim under Envelope Shape; the same four-field envelope is stated by work-state.md 622-634 in the preceding block (map section 6).",
    "authoredBy": "codex-session:1@2026-10-08",
    "reviewNote": "Provenance re-confirmation: row byte-equal to its reviewed form at 7df871822 apart from the added authoredBy and the reset review fields; source L49-51 -> target L127-129 (contract/merge); target text byte-equal to source; the sidecar digests extend the decision's short digests and are unchanged since the prior pass. Old approval not carried: now pending.",
    "reviewedBy": "reviewer:claude-session:4df9e88c@2026-10-09",
    "reviewedAt": "2026-10-09",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-2final-b-io-contract.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "6dcf0faa76d27fed777c0586dad2b3b78200213c58d5606ad5e901e81e13e6fa",
    "targetAncestry": [
      "CLI I/O Contract",
      "3. Output Direction Unified Envelope",
      "Envelope Shape"
    ],
    "reviewReportCommit": "7f8d12784d642097c17e7a7ebdfa4cff43aabbee"
  },
  "currentDecision": {
    "claimId": "claim_38ad96d62f2c6cf7a639fc24a83c2621",
    "sourceUnitDigest": "6dcf0faa76d27fed",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-16",
    "claimKind": "contract",
    "disposition": "merge",
    "reviewStatus": "pending",
    "rationale": "First paragraph of the envelope statement (every successful verb in both binaries prints the fgos.v1 envelope), carried verbatim under Envelope Shape; the same four-field envelope is stated by work-state.md 622-634 in the preceding block (map section 6). L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. A31: target paragraph numbering shifted after the new installation-error paragraph; rebound by unique complete prior target digest, preserving the prior referent.",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetUnitDigest": "6dcf0faa76d27fed777c0586dad2b3b78200213c58d5606ad5e901e81e13e6fa",
    "targetAncestry": [
      "CLI I/O Contract",
      "3. Output Direction Unified Envelope",
      "Envelope Shape"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/io-contract.md",
    "unitDigest": "f36f89657b6f8b5083e49ed2033398ce8e8dd135da61ade065ae4668c324f77e",
    "identityFingerprint": "f36f89657b6f8b5083e49ed2033398ce8e8dd135da61ade065ae4668c324f77e",
    "claimId": "claim_38ad96d62f2c6cf7a639fc24a83c2621",
    "sourceAnchor": "unheaded-block-9",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "6dcf0faa76d27fed777c0586dad2b3b78200213c58d5606ad5e901e81e13e6fa",
    "claimKind": "contract",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-9",
      "githubAnchor": "unheaded-block-9",
      "stableAnchor": "unheaded-block-9",
      "title": "Unheaded block 9",
      "startLine": 59,
      "endLine": 61,
      "textDigest": "6dcf0faa76d27fed777c0586dad2b3b78200213c58d5606ad5e901e81e13e6fa",
      "sample": "Mọi verb thành công (ở CẢ HAI binary — `fgos.mjs` và, từ lát 2,\n`fgos-runner.mjs`'s dòng kết-cục cuối) in một phong bì chuẩn `fgos.v1` ra\n`stdout`:",
      "identityFingerprint": "f36f89657b6f8b5083e49ed2033398ce8e8dd135da61ade065ae4668c324f77e",
      "ancestry": [
        "Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`",
        "Chiều ra — envelope thống nhất"
      ],
      "text": "Mọi verb thành công (ở CẢ HAI binary — `fgos.mjs` và, từ lát 2,\n`fgos-runner.mjs`'s dòng kết-cục cuối) in một phong bì chuẩn `fgos.v1` ra\n`stdout`:"
    }
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-16",
    "githubAnchor": "unheaded-block-16",
    "stableAnchor": "unheaded-block-16",
    "title": "Unheaded block 16",
    "startLine": 145,
    "endLine": 147,
    "textDigest": "6dcf0faa76d27fed777c0586dad2b3b78200213c58d5606ad5e901e81e13e6fa",
    "sample": "Mọi verb thành công (ở CẢ HAI binary — `fgos.mjs` và, từ lát 2,\n`fgos-runner.mjs`'s dòng kết-cục cuối) in một phong bì chuẩn `fgos.v1` ra\n`stdout`:",
    "identityFingerprint": "f36f89657b6f8b5083e49ed2033398ce8e8dd135da61ade065ae4668c324f77e",
    "ancestry": [
      "CLI I/O Contract",
      "3. Output Direction Unified Envelope",
      "Envelope Shape"
    ],
    "text": "Mọi verb thành công (ở CẢ HAI binary — `fgos.mjs` và, từ lát 2,\n`fgos-runner.mjs`'s dòng kết-cục cuối) in một phong bì chuẩn `fgos.v1` ra\n`stdout`:"
  },
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Weak-exact",
    "reason": "ancestor headings differ",
    "targetUnit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-16",
      "githubAnchor": "unheaded-block-16",
      "stableAnchor": "unheaded-block-16",
      "title": "Unheaded block 16",
      "startLine": 145,
      "endLine": 147,
      "textDigest": "6dcf0faa76d27fed777c0586dad2b3b78200213c58d5606ad5e901e81e13e6fa",
      "sample": "Mọi verb thành công (ở CẢ HAI binary — `fgos.mjs` và, từ lát 2,\n`fgos-runner.mjs`'s dòng kết-cục cuối) in một phong bì chuẩn `fgos.v1` ra\n`stdout`:",
      "identityFingerprint": "f36f89657b6f8b5083e49ed2033398ce8e8dd135da61ade065ae4668c324f77e",
      "ancestry": [
        "CLI I/O Contract",
        "3. Output Direction Unified Envelope",
        "Envelope Shape"
      ],
      "text": "Mọi verb thành công (ở CẢ HAI binary — `fgos.mjs` và, từ lát 2,\n`fgos-runner.mjs`'s dòng kết-cục cuối) in một phong bì chuẩn `fgos.v1` ra\n`stdout`:"
    }
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_38ad96d62f2c6cf7a639fc24a83c2621"
}
```

## Entry claim_dc506074dcc2f08f6012ebb078b50371

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-io-contract.json",
  "collection": "claims",
  "claimId": "claim_dc506074dcc2f08f6012ebb078b50371",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "b-io-contract",
  "before": {
    "claimId": "claim_dc506074dcc2f08f6012ebb078b50371",
    "sourceUnitDigest": "18c5d821a55d3517",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-16",
    "claimKind": "contract",
    "disposition": "merge",
    "reviewStatus": "reviewed",
    "rationale": "The fenced envelope shape { contract: 'fgos.v1', generated_at, data_hash, data }, carried verbatim as its own block in Envelope Shape; the work-state.md envelope text under the same heading describes the same four fields. Note: the mechanical suggestion pointed at README.md and was wrong.",
    "authoredBy": "codex-session:1@2026-10-08",
    "reviewNote": "Provenance re-confirmation: row byte-equal to its reviewed form at 7df871822 apart from the added authoredBy and the reset review fields; source L53-55 -> target L131-133 (contract/merge); target text byte-equal to source; the sidecar digests extend the decision's short digests and are unchanged since the prior pass. Old approval not carried: now pending.",
    "reviewedBy": "reviewer:claude-session:4df9e88c@2026-10-09",
    "reviewedAt": "2026-10-09",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-2final-b-io-contract.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "18c5d821a55d3517cf3efe368fb1d34e13730b3bc1d70ff376d72b147621bdd2",
    "targetAncestry": [
      "CLI I/O Contract",
      "3. Output Direction Unified Envelope",
      "Envelope Shape"
    ],
    "reviewReportCommit": "7f8d12784d642097c17e7a7ebdfa4cff43aabbee"
  },
  "currentDecision": {
    "claimId": "claim_dc506074dcc2f08f6012ebb078b50371",
    "sourceUnitDigest": "18c5d821a55d3517",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-17",
    "claimKind": "contract",
    "disposition": "merge",
    "reviewStatus": "pending",
    "rationale": "The fenced envelope shape { contract: 'fgos.v1', generated_at, data_hash, data }, carried verbatim as its own block in Envelope Shape; the work-state.md envelope text under the same heading describes the same four fields. Note: the mechanical suggestion pointed at README.md and was wrong. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. A31: target paragraph numbering shifted after the new installation-error paragraph; rebound by unique complete prior target digest, preserving the prior referent.",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetUnitDigest": "18c5d821a55d3517cf3efe368fb1d34e13730b3bc1d70ff376d72b147621bdd2",
    "targetAncestry": [
      "CLI I/O Contract",
      "3. Output Direction Unified Envelope",
      "Envelope Shape"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/io-contract.md",
    "unitDigest": "54e748727b3965de64cad699080c04ca9dde712a66fcfa5390aca21149606fd3",
    "identityFingerprint": "54e748727b3965de64cad699080c04ca9dde712a66fcfa5390aca21149606fd3",
    "claimId": "claim_dc506074dcc2f08f6012ebb078b50371",
    "sourceAnchor": "unheaded-block-10",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "18c5d821a55d3517cf3efe368fb1d34e13730b3bc1d70ff376d72b147621bdd2",
    "claimKind": "contract",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-10",
      "githubAnchor": "unheaded-block-10",
      "stableAnchor": "unheaded-block-10",
      "title": "Unheaded block 10",
      "startLine": 63,
      "endLine": 65,
      "textDigest": "18c5d821a55d3517cf3efe368fb1d34e13730b3bc1d70ff376d72b147621bdd2",
      "sample": "```\n{ contract: 'fgos.v1', generated_at, data_hash, data }\n```",
      "identityFingerprint": "54e748727b3965de64cad699080c04ca9dde712a66fcfa5390aca21149606fd3",
      "ancestry": [
        "Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`",
        "Chiều ra — envelope thống nhất"
      ],
      "text": "```\n{ contract: 'fgos.v1', generated_at, data_hash, data }\n```"
    }
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-17",
    "githubAnchor": "unheaded-block-17",
    "stableAnchor": "unheaded-block-17",
    "title": "Unheaded block 17",
    "startLine": 149,
    "endLine": 151,
    "textDigest": "18c5d821a55d3517cf3efe368fb1d34e13730b3bc1d70ff376d72b147621bdd2",
    "sample": "```\n{ contract: 'fgos.v1', generated_at, data_hash, data }\n```",
    "identityFingerprint": "54e748727b3965de64cad699080c04ca9dde712a66fcfa5390aca21149606fd3",
    "ancestry": [
      "CLI I/O Contract",
      "3. Output Direction Unified Envelope",
      "Envelope Shape"
    ],
    "text": "```\n{ contract: 'fgos.v1', generated_at, data_hash, data }\n```"
  },
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Weak-exact",
    "reason": "ancestor headings differ",
    "targetUnit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-17",
      "githubAnchor": "unheaded-block-17",
      "stableAnchor": "unheaded-block-17",
      "title": "Unheaded block 17",
      "startLine": 149,
      "endLine": 151,
      "textDigest": "18c5d821a55d3517cf3efe368fb1d34e13730b3bc1d70ff376d72b147621bdd2",
      "sample": "```\n{ contract: 'fgos.v1', generated_at, data_hash, data }\n```",
      "identityFingerprint": "54e748727b3965de64cad699080c04ca9dde712a66fcfa5390aca21149606fd3",
      "ancestry": [
        "CLI I/O Contract",
        "3. Output Direction Unified Envelope",
        "Envelope Shape"
      ],
      "text": "```\n{ contract: 'fgos.v1', generated_at, data_hash, data }\n```"
    }
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_dc506074dcc2f08f6012ebb078b50371"
}
```

## Entry claim_62d31ae4e5abfcf0ab158c0c6a8337ee

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-io-contract.json",
  "collection": "claims",
  "claimId": "claim_62d31ae4e5abfcf0ab158c0c6a8337ee",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "b-io-contract",
  "before": {
    "claimId": "claim_62d31ae4e5abfcf0ab158c0c6a8337ee",
    "sourceUnitDigest": "84367855d92bb2e3",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-17",
    "claimKind": "contract",
    "disposition": "merge",
    "reviewStatus": "reviewed",
    "rationale": "The data-is-structured and error-path-not-enveloped paragraph, carried verbatim in Envelope Shape; work-state.md 622-634 states the same (the ws error-path claim 636-639 also lands in the next H3).",
    "authoredBy": "codex-session:1@2026-10-08",
    "reviewNote": "Provenance re-confirmation: row byte-equal to its reviewed form at 7df871822 apart from the added authoredBy and the reset review fields; source L57-60 -> target L135-138 (contract/merge); target text byte-equal to source; the sidecar digests extend the decision's short digests and are unchanged since the prior pass. Old approval not carried: now pending.",
    "reviewedBy": "reviewer:claude-session:4df9e88c@2026-10-09",
    "reviewedAt": "2026-10-09",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-2final-b-io-contract.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "84367855d92bb2e3914cb9bc385c2dce9b5625c8acaf9e577c9c791e40d07e71",
    "targetAncestry": [
      "CLI I/O Contract",
      "3. Output Direction Unified Envelope",
      "Envelope Shape"
    ],
    "reviewReportCommit": "7f8d12784d642097c17e7a7ebdfa4cff43aabbee"
  },
  "currentDecision": {
    "claimId": "claim_62d31ae4e5abfcf0ab158c0c6a8337ee",
    "sourceUnitDigest": "84367855d92bb2e3",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-18",
    "claimKind": "contract",
    "disposition": "merge",
    "reviewStatus": "pending",
    "rationale": "The data-is-structured and error-path-not-enveloped paragraph, carried verbatim in Envelope Shape; work-state.md 622-634 states the same (the ws error-path claim 636-639 also lands in the next H3). L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. A31: target paragraph numbering shifted after the new installation-error paragraph; rebound by unique complete prior target digest, preserving the prior referent.",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetUnitDigest": "84367855d92bb2e3914cb9bc385c2dce9b5625c8acaf9e577c9c791e40d07e71",
    "targetAncestry": [
      "CLI I/O Contract",
      "3. Output Direction Unified Envelope",
      "Envelope Shape"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/io-contract.md",
    "unitDigest": "01a3b167cedff01696bcb854f33c46c3250c9f5d0d9e0633245f9bdbbdae944f",
    "identityFingerprint": "01a3b167cedff01696bcb854f33c46c3250c9f5d0d9e0633245f9bdbbdae944f",
    "claimId": "claim_62d31ae4e5abfcf0ab158c0c6a8337ee",
    "sourceAnchor": "unheaded-block-11",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "84367855d92bb2e3914cb9bc385c2dce9b5625c8acaf9e577c9c791e40d07e71",
    "claimKind": "contract",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-11",
      "githubAnchor": "unheaded-block-11",
      "stableAnchor": "unheaded-block-11",
      "title": "Unheaded block 11",
      "startLine": 67,
      "endLine": 70,
      "textDigest": "84367855d92bb2e3914cb9bc385c2dce9b5625c8acaf9e577c9c791e40d07e71",
      "sample": "`data` có cấu trúc (trường tên rõ nghĩa), không phải câu xác nhận cho\nngười — verb đọc trả thẳng đối tượng kết quả, verb ghi trả đúng những\ntrường vừa đổi. Đường lỗi KHÔNG bọc phon",
      "identityFingerprint": "01a3b167cedff01696bcb854f33c46c3250c9f5d0d9e0633245f9bdbbdae944f",
      "ancestry": [
        "Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`",
        "Chiều ra — envelope thống nhất"
      ],
      "text": "`data` có cấu trúc (trường tên rõ nghĩa), không phải câu xác nhận cho\nngười — verb đọc trả thẳng đối tượng kết quả, verb ghi trả đúng những\ntrường vừa đổi. Đường lỗi KHÔNG bọc phong bì: chẩn đoán đi `stderr`, thành/\nbại phân biệt bằng **exit code**, không bao giờ bằng nội dung chuỗi."
    }
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-18",
    "githubAnchor": "unheaded-block-18",
    "stableAnchor": "unheaded-block-18",
    "title": "Unheaded block 18",
    "startLine": 153,
    "endLine": 156,
    "textDigest": "84367855d92bb2e3914cb9bc385c2dce9b5625c8acaf9e577c9c791e40d07e71",
    "sample": "`data` có cấu trúc (trường tên rõ nghĩa), không phải câu xác nhận cho\nngười — verb đọc trả thẳng đối tượng kết quả, verb ghi trả đúng những\ntrường vừa đổi. Đường lỗi KHÔNG bọc phon",
    "identityFingerprint": "01a3b167cedff01696bcb854f33c46c3250c9f5d0d9e0633245f9bdbbdae944f",
    "ancestry": [
      "CLI I/O Contract",
      "3. Output Direction Unified Envelope",
      "Envelope Shape"
    ],
    "text": "`data` có cấu trúc (trường tên rõ nghĩa), không phải câu xác nhận cho\nngười — verb đọc trả thẳng đối tượng kết quả, verb ghi trả đúng những\ntrường vừa đổi. Đường lỗi KHÔNG bọc phong bì: chẩn đoán đi `stderr`, thành/\nbại phân biệt bằng **exit code**, không bao giờ bằng nội dung chuỗi."
  },
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Weak-exact",
    "reason": "ancestor headings differ",
    "targetUnit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-18",
      "githubAnchor": "unheaded-block-18",
      "stableAnchor": "unheaded-block-18",
      "title": "Unheaded block 18",
      "startLine": 153,
      "endLine": 156,
      "textDigest": "84367855d92bb2e3914cb9bc385c2dce9b5625c8acaf9e577c9c791e40d07e71",
      "sample": "`data` có cấu trúc (trường tên rõ nghĩa), không phải câu xác nhận cho\nngười — verb đọc trả thẳng đối tượng kết quả, verb ghi trả đúng những\ntrường vừa đổi. Đường lỗi KHÔNG bọc phon",
      "identityFingerprint": "01a3b167cedff01696bcb854f33c46c3250c9f5d0d9e0633245f9bdbbdae944f",
      "ancestry": [
        "CLI I/O Contract",
        "3. Output Direction Unified Envelope",
        "Envelope Shape"
      ],
      "text": "`data` có cấu trúc (trường tên rõ nghĩa), không phải câu xác nhận cho\nngười — verb đọc trả thẳng đối tượng kết quả, verb ghi trả đúng những\ntrường vừa đổi. Đường lỗi KHÔNG bọc phong bì: chẩn đoán đi `stderr`, thành/\nbại phân biệt bằng **exit code**, không bao giờ bằng nội dung chuỗi."
    }
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_62d31ae4e5abfcf0ab158c0c6a8337ee"
}
```

## Entry claim_5e282fb457ff9ef02e88cf329556cf34

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-io-contract.json",
  "collection": "claims",
  "claimId": "claim_5e282fb457ff9ef02e88cf329556cf34",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "b-io-contract",
  "before": {
    "claimId": "claim_5e282fb457ff9ef02e88cf329556cf34",
    "sourceUnitDigest": "6a5b9a01b0427971",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-20",
    "claimKind": "contract",
    "disposition": "merge",
    "reviewStatus": "reviewed",
    "rationale": "One envelope per call for fgos.mjs and one single-line envelope per --once/--watch cycle for fgos-runner, carried verbatim under Runner Stdout Envelope; duplicate of work-state.md 641-645 (map section 6).",
    "authoredBy": "codex-session:1@2026-10-08",
    "reviewNote": "Provenance re-confirmation: row byte-equal to its reviewed form at 7df871822 apart from the added authoredBy and the reset review fields; source L62-66 -> target L155-159 (contract/merge); target text byte-equal to source; the sidecar digests extend the decision's short digests and are unchanged since the prior pass. Old approval not carried: now pending.",
    "reviewedBy": "reviewer:claude-session:4df9e88c@2026-10-09",
    "reviewedAt": "2026-10-09",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-2final-b-io-contract.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "6a5b9a01b04279716a3d504e251d1de122ff1652714708512706640ec9edd4ca",
    "targetAncestry": [
      "CLI I/O Contract",
      "3. Output Direction Unified Envelope",
      "Runner Stdout Envelope"
    ],
    "reviewReportCommit": "7f8d12784d642097c17e7a7ebdfa4cff43aabbee"
  },
  "currentDecision": {
    "claimId": "claim_5e282fb457ff9ef02e88cf329556cf34",
    "sourceUnitDigest": "6a5b9a01b0427971",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-21",
    "claimKind": "contract",
    "disposition": "merge",
    "reviewStatus": "pending",
    "rationale": "One envelope per call for fgos.mjs and one single-line envelope per --once/--watch cycle for fgos-runner, carried verbatim under Runner Stdout Envelope; duplicate of work-state.md 641-645 (map section 6). L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. A31: target paragraph numbering shifted after the new installation-error paragraph; rebound by unique complete prior target digest, preserving the prior referent.",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetUnitDigest": "6a5b9a01b04279716a3d504e251d1de122ff1652714708512706640ec9edd4ca",
    "targetAncestry": [
      "CLI I/O Contract",
      "3. Output Direction Unified Envelope",
      "Runner Stdout Envelope"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/io-contract.md",
    "unitDigest": "716ba1ed20e3b9ba335f8aea5899f5e842f85892ea40fcd2a0233237ae61b12d",
    "identityFingerprint": "716ba1ed20e3b9ba335f8aea5899f5e842f85892ea40fcd2a0233237ae61b12d",
    "claimId": "claim_5e282fb457ff9ef02e88cf329556cf34",
    "sourceAnchor": "unheaded-block-12",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "6a5b9a01b04279716a3d504e251d1de122ff1652714708512706640ec9edd4ca",
    "claimKind": "contract",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-12",
      "githubAnchor": "unheaded-block-12",
      "stableAnchor": "unheaded-block-12",
      "title": "Unheaded block 12",
      "startLine": 72,
      "endLine": 76,
      "textDigest": "6a5b9a01b04279716a3d504e251d1de122ff1652714708512706640ec9edd4ca",
      "sample": "**`fgos.mjs` in đúng một dòng phong bì mỗi lời gọi** (một-shot, nên in\nnhiều dòng cho dễ đọc). **`fgos-runner` in MỘT phong bì mỗi lượt `--once`\nhoặc mỗi chu kỳ `--watch`, liền một",
      "identityFingerprint": "716ba1ed20e3b9ba335f8aea5899f5e842f85892ea40fcd2a0233237ae61b12d",
      "ancestry": [
        "Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`",
        "Chiều ra — envelope thống nhất"
      ],
      "text": "**`fgos.mjs` in đúng một dòng phong bì mỗi lời gọi** (một-shot, nên in\nnhiều dòng cho dễ đọc). **`fgos-runner` in MỘT phong bì mỗi lượt `--once`\nhoặc mỗi chu kỳ `--watch`, liền một dòng** — vì `--watch` phát nhiều phong\nbì nối tiếp theo thời gian, mỗi cái phải trọn trong đúng một dòng để bên\nđọc tách được cái này với cái kia; con trỏ (dưới) áp dụng cùng lý do."
    }
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-21",
    "githubAnchor": "unheaded-block-21",
    "stableAnchor": "unheaded-block-21",
    "title": "Unheaded block 21",
    "startLine": 173,
    "endLine": 177,
    "textDigest": "6a5b9a01b04279716a3d504e251d1de122ff1652714708512706640ec9edd4ca",
    "sample": "**`fgos.mjs` in đúng một dòng phong bì mỗi lời gọi** (một-shot, nên in\nnhiều dòng cho dễ đọc). **`fgos-runner` in MỘT phong bì mỗi lượt `--once`\nhoặc mỗi chu kỳ `--watch`, liền một",
    "identityFingerprint": "716ba1ed20e3b9ba335f8aea5899f5e842f85892ea40fcd2a0233237ae61b12d",
    "ancestry": [
      "CLI I/O Contract",
      "3. Output Direction Unified Envelope",
      "Runner Stdout Envelope"
    ],
    "text": "**`fgos.mjs` in đúng một dòng phong bì mỗi lời gọi** (một-shot, nên in\nnhiều dòng cho dễ đọc). **`fgos-runner` in MỘT phong bì mỗi lượt `--once`\nhoặc mỗi chu kỳ `--watch`, liền một dòng** — vì `--watch` phát nhiều phong\nbì nối tiếp theo thời gian, mỗi cái phải trọn trong đúng một dòng để bên\nđọc tách được cái này với cái kia; con trỏ (dưới) áp dụng cùng lý do."
  },
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Weak-exact",
    "reason": "ancestor headings differ",
    "targetUnit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-21",
      "githubAnchor": "unheaded-block-21",
      "stableAnchor": "unheaded-block-21",
      "title": "Unheaded block 21",
      "startLine": 173,
      "endLine": 177,
      "textDigest": "6a5b9a01b04279716a3d504e251d1de122ff1652714708512706640ec9edd4ca",
      "sample": "**`fgos.mjs` in đúng một dòng phong bì mỗi lời gọi** (một-shot, nên in\nnhiều dòng cho dễ đọc). **`fgos-runner` in MỘT phong bì mỗi lượt `--once`\nhoặc mỗi chu kỳ `--watch`, liền một",
      "identityFingerprint": "716ba1ed20e3b9ba335f8aea5899f5e842f85892ea40fcd2a0233237ae61b12d",
      "ancestry": [
        "CLI I/O Contract",
        "3. Output Direction Unified Envelope",
        "Runner Stdout Envelope"
      ],
      "text": "**`fgos.mjs` in đúng một dòng phong bì mỗi lời gọi** (một-shot, nên in\nnhiều dòng cho dễ đọc). **`fgos-runner` in MỘT phong bì mỗi lượt `--once`\nhoặc mỗi chu kỳ `--watch`, liền một dòng** — vì `--watch` phát nhiều phong\nbì nối tiếp theo thời gian, mỗi cái phải trọn trong đúng một dòng để bên\nđọc tách được cái này với cái kia; con trỏ (dưới) áp dụng cùng lý do."
    }
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_5e282fb457ff9ef02e88cf329556cf34"
}
```

## Entry claim_5b930b5ce84afec3d4b2c383c7f85925

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-io-contract.json",
  "collection": "claims",
  "claimId": "claim_5b930b5ce84afec3d4b2c383c7f85925",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "b-io-contract",
  "before": {
    "claimId": "claim_5b930b5ce84afec3d4b2c383c7f85925",
    "sourceUnitDigest": "bdeca0144b587f82",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-21",
    "claimKind": "contract",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Real-envelope recognition rule (parse JSON, check contract === 'fgos.v1', never a text heuristic) carried verbatim under the new H3 Recognizing A Real Envelope; no counterpart in work-state.md.",
    "authoredBy": "codex-session:1@2026-10-08",
    "reviewNote": "Provenance re-confirmation: row byte-equal to its reviewed form at 7df871822 apart from the added authoredBy and the reset review fields; source L68-71 -> target L163-166 (contract/promote); target text byte-equal to source; the sidecar digests extend the decision's short digests and are unchanged since the prior pass. Old approval not carried: now pending.",
    "reviewedBy": "reviewer:claude-session:4df9e88c@2026-10-09",
    "reviewedAt": "2026-10-09",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-2final-b-io-contract.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "bdeca0144b587f826ce46ea61d3be2e882ad021614d1e5f7c14cf2982573f056",
    "targetAncestry": [
      "CLI I/O Contract",
      "3. Output Direction Unified Envelope",
      "Recognizing A Real Envelope"
    ],
    "reviewReportCommit": "7f8d12784d642097c17e7a7ebdfa4cff43aabbee"
  },
  "currentDecision": {
    "claimId": "claim_5b930b5ce84afec3d4b2c383c7f85925",
    "sourceUnitDigest": "bdeca0144b587f82",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-22",
    "claimKind": "contract",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "Real-envelope recognition rule (parse JSON, check contract === 'fgos.v1', never a text heuristic) carried verbatim under the new H3 Recognizing A Real Envelope; no counterpart in work-state.md. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. A31: target paragraph numbering shifted after the new installation-error paragraph; rebound by unique complete prior target digest, preserving the prior referent.",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetUnitDigest": "bdeca0144b587f826ce46ea61d3be2e882ad021614d1e5f7c14cf2982573f056",
    "targetAncestry": [
      "CLI I/O Contract",
      "3. Output Direction Unified Envelope",
      "Recognizing A Real Envelope"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/io-contract.md",
    "unitDigest": "ba5e63678191dc9c6bae6aa99c65efd2c8f670d3dd9b38c8aaee891fe5787197",
    "identityFingerprint": "ba5e63678191dc9c6bae6aa99c65efd2c8f670d3dd9b38c8aaee891fe5787197",
    "claimId": "claim_5b930b5ce84afec3d4b2c383c7f85925",
    "sourceAnchor": "unheaded-block-13",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "bdeca0144b587f826ce46ea61d3be2e882ad021614d1e5f7c14cf2982573f056",
    "claimKind": "contract",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-13",
      "githubAnchor": "unheaded-block-13",
      "stableAnchor": "unheaded-block-13",
      "title": "Unheaded block 13",
      "startLine": 78,
      "endLine": 81,
      "textDigest": "bdeca0144b587f826ce46ea61d3be2e882ad021614d1e5f7c14cf2982573f056",
      "sample": "**Nhận diện một phong bì thật:** parse một dòng stdout ra JSON rồi kiểm\n`contract === 'fgos.v1'` — KHÔNG BAO GIỜ bằng heuristic văn bản (vd \"dòng\nbắt đầu bằng `{`\"), vì luồng progr",
      "identityFingerprint": "ba5e63678191dc9c6bae6aa99c65efd2c8f670d3dd9b38c8aaee891fe5787197",
      "ancestry": [
        "Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`",
        "Chiều ra — envelope thống nhất"
      ],
      "text": "**Nhận diện một phong bì thật:** parse một dòng stdout ra JSON rồi kiểm\n`contract === 'fgos.v1'` — KHÔNG BAO GIỜ bằng heuristic văn bản (vd \"dòng\nbắt đầu bằng `{`\"), vì luồng progress-trace của `fgos-runner` (xem \"Ngoại\nlệ có lý do\" dưới) có thể tự chứa output của trợ lý bắt đầu bằng `{`."
    }
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-22",
    "githubAnchor": "unheaded-block-22",
    "stableAnchor": "unheaded-block-22",
    "title": "Unheaded block 22",
    "startLine": 181,
    "endLine": 184,
    "textDigest": "bdeca0144b587f826ce46ea61d3be2e882ad021614d1e5f7c14cf2982573f056",
    "sample": "**Nhận diện một phong bì thật:** parse một dòng stdout ra JSON rồi kiểm\n`contract === 'fgos.v1'` — KHÔNG BAO GIỜ bằng heuristic văn bản (vd \"dòng\nbắt đầu bằng `{`\"), vì luồng progr",
    "identityFingerprint": "ba5e63678191dc9c6bae6aa99c65efd2c8f670d3dd9b38c8aaee891fe5787197",
    "ancestry": [
      "CLI I/O Contract",
      "3. Output Direction Unified Envelope",
      "Recognizing A Real Envelope"
    ],
    "text": "**Nhận diện một phong bì thật:** parse một dòng stdout ra JSON rồi kiểm\n`contract === 'fgos.v1'` — KHÔNG BAO GIỜ bằng heuristic văn bản (vd \"dòng\nbắt đầu bằng `{`\"), vì luồng progress-trace của `fgos-runner` (xem \"Ngoại\nlệ có lý do\" dưới) có thể tự chứa output của trợ lý bắt đầu bằng `{`."
  },
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Weak-exact",
    "reason": "ancestor headings differ",
    "targetUnit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-22",
      "githubAnchor": "unheaded-block-22",
      "stableAnchor": "unheaded-block-22",
      "title": "Unheaded block 22",
      "startLine": 181,
      "endLine": 184,
      "textDigest": "bdeca0144b587f826ce46ea61d3be2e882ad021614d1e5f7c14cf2982573f056",
      "sample": "**Nhận diện một phong bì thật:** parse một dòng stdout ra JSON rồi kiểm\n`contract === 'fgos.v1'` — KHÔNG BAO GIỜ bằng heuristic văn bản (vd \"dòng\nbắt đầu bằng `{`\"), vì luồng progr",
      "identityFingerprint": "ba5e63678191dc9c6bae6aa99c65efd2c8f670d3dd9b38c8aaee891fe5787197",
      "ancestry": [
        "CLI I/O Contract",
        "3. Output Direction Unified Envelope",
        "Recognizing A Real Envelope"
      ],
      "text": "**Nhận diện một phong bì thật:** parse một dòng stdout ra JSON rồi kiểm\n`contract === 'fgos.v1'` — KHÔNG BAO GIỜ bằng heuristic văn bản (vd \"dòng\nbắt đầu bằng `{`\"), vì luồng progress-trace của `fgos-runner` (xem \"Ngoại\nlệ có lý do\" dưới) có thể tự chứa output của trợ lý bắt đầu bằng `{`."
    }
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_5b930b5ce84afec3d4b2c383c7f85925"
}
```

## Entry claim_da21278ab32966f6631c82420552ed2b

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-io-contract.json",
  "collection": "claims",
  "claimId": "claim_da21278ab32966f6631c82420552ed2b",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "b-io-contract",
  "before": {
    "claimId": "claim_da21278ab32966f6631c82420552ed2b",
    "sourceUnitDigest": "c34e8e9c9dbf41ceba76b86cd175dcb894ce3eb3de6e988c2bd68a77ece385e4",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-28",
    "claimKind": "contract",
    "disposition": "merge",
    "reviewStatus": "reviewed",
    "rationale": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover.",
    "authoredBy": "codex-session:unit-run-1792052396770-6f1c5957@2026-10-15",
    "reviewNote": "mechanical: legacy block 17 (c34e8e9c, was 16) byte-equal to carrier block 28; digests recompute; anchor shift 27->28 from the inserted block 23; before and after target digest equal; disposition merge unchanged from the reviewed decision; anchors, ancestry pass",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-15",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-261015-1526-specs-ui-reworks-main-recarry.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "c34e8e9c9dbf41ceba76b86cd175dcb894ce3eb3de6e988c2bd68a77ece385e4",
    "targetAncestry": [
      "CLI I/O Contract",
      "6. Cursor Pagination"
    ],
    "reviewReportCommit": "0e8ce7710ac67ad038927b242b2461876bf8c90d"
  },
  "currentDecision": {
    "claimId": "claim_da21278ab32966f6631c82420552ed2b",
    "sourceUnitDigest": "c34e8e9c9dbf41ceba76b86cd175dcb894ce3eb3de6e988c2bd68a77ece385e4",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-29",
    "claimKind": "contract",
    "disposition": "merge",
    "reviewStatus": "pending",
    "rationale": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. A31: target paragraph numbering shifted after the new installation-error paragraph; rebound by unique complete prior target digest, preserving the prior referent.",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetUnitDigest": "c34e8e9c9dbf41ceba76b86cd175dcb894ce3eb3de6e988c2bd68a77ece385e4",
    "targetAncestry": [
      "CLI I/O Contract",
      "6. Cursor Pagination"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/io-contract.md",
    "unitDigest": "30d43ecb2d28400d920c9b3e23e93ead71b4cb92aecb62d15a14115f3ceb9363",
    "identityFingerprint": "30d43ecb2d28400d920c9b3e23e93ead71b4cb92aecb62d15a14115f3ceb9363",
    "claimId": "claim_da21278ab32966f6631c82420552ed2b",
    "sourceAnchor": "unheaded-block-18",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "c34e8e9c9dbf41ceba76b86cd175dcb894ce3eb3de6e988c2bd68a77ece385e4",
    "claimKind": "contract",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-18",
      "githubAnchor": "unheaded-block-18",
      "stableAnchor": "unheaded-block-18",
      "title": "Unheaded block 18",
      "startLine": 120,
      "endLine": 129,
      "textDigest": "c34e8e9c9dbf41ceba76b86cd175dcb894ce3eb3de6e988c2bd68a77ece385e4",
      "sample": "Bốn verb trả tập có thể lớn tuỳ dữ liệu mang phân trang tuỳ chọn:\n`ready` · `triage` · `evolve` (lượt liệt-kê không cờ) · `list`'s khoá\n`work`. Không truyền `--cursor`/`--limit` → ",
      "identityFingerprint": "30d43ecb2d28400d920c9b3e23e93ead71b4cb92aecb62d15a14115f3ceb9363",
      "ancestry": [
        "Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`",
        "Chiều ra — envelope thống nhất",
        "Phân trang — con trỏ đục"
      ],
      "text": "Bốn verb trả tập có thể lớn tuỳ dữ liệu mang phân trang tuỳ chọn:\n`ready` · `triage` · `evolve` (lượt liệt-kê không cờ) · `list`'s khoá\n`work`. Không truyền `--cursor`/`--limit` → kết quả đầy đủ, y hệt không có\ntính năng này. Truyền một trong hai → kết quả đổi hình dạng thành\n`{items, nextCursor}`. Con trỏ là một chuỗi đục hoàn toàn — sinh bởi máy\nchủ, người gọi chỉ trả lại nguyên văn, không bao giờ tự phân tích hay tự\nchế. `nextCursor` là `null` khi đã tới cuối tập. Một con trỏ trỏ tới mục đã\nrời tập là lỗi phạm trù `validation`, thông điệp tự nêu cách sửa (bắt đầu\nlại không kèm `--cursor`). `conflicts` CỐ Ý không phân trang — mỗi dòng của\nnó là một cặp `(a,b)`, không có khoá riêng cho một dòng."
    }
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-29",
    "githubAnchor": "unheaded-block-29",
    "stableAnchor": "unheaded-block-29",
    "title": "Unheaded block 29",
    "startLine": 251,
    "endLine": 260,
    "textDigest": "c34e8e9c9dbf41ceba76b86cd175dcb894ce3eb3de6e988c2bd68a77ece385e4",
    "sample": "Bốn verb trả tập có thể lớn tuỳ dữ liệu mang phân trang tuỳ chọn:\n`ready` · `triage` · `evolve` (lượt liệt-kê không cờ) · `list`'s khoá\n`work`. Không truyền `--cursor`/`--limit` → ",
    "identityFingerprint": "30d43ecb2d28400d920c9b3e23e93ead71b4cb92aecb62d15a14115f3ceb9363",
    "ancestry": [
      "CLI I/O Contract",
      "6. Cursor Pagination"
    ],
    "text": "Bốn verb trả tập có thể lớn tuỳ dữ liệu mang phân trang tuỳ chọn:\n`ready` · `triage` · `evolve` (lượt liệt-kê không cờ) · `list`'s khoá\n`work`. Không truyền `--cursor`/`--limit` → kết quả đầy đủ, y hệt không có\ntính năng này. Truyền một trong hai → kết quả đổi hình dạng thành\n`{items, nextCursor}`. Con trỏ là một chuỗi đục hoàn toàn — sinh bởi máy\nchủ, người gọi chỉ trả lại nguyên văn, không bao giờ tự phân tích hay tự\nchế. `nextCursor` là `null` khi đã tới cuối tập. Một con trỏ trỏ tới mục đã\nrời tập là lỗi phạm trù `validation`, thông điệp tự nêu cách sửa (bắt đầu\nlại không kèm `--cursor`). `conflicts` CỐ Ý không phân trang — mỗi dòng của\nnó là một cặp `(a,b)`, không có khoá riêng cho một dòng."
  },
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Weak-exact",
    "reason": "ancestor headings differ",
    "targetUnit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-29",
      "githubAnchor": "unheaded-block-29",
      "stableAnchor": "unheaded-block-29",
      "title": "Unheaded block 29",
      "startLine": 251,
      "endLine": 260,
      "textDigest": "c34e8e9c9dbf41ceba76b86cd175dcb894ce3eb3de6e988c2bd68a77ece385e4",
      "sample": "Bốn verb trả tập có thể lớn tuỳ dữ liệu mang phân trang tuỳ chọn:\n`ready` · `triage` · `evolve` (lượt liệt-kê không cờ) · `list`'s khoá\n`work`. Không truyền `--cursor`/`--limit` → ",
      "identityFingerprint": "30d43ecb2d28400d920c9b3e23e93ead71b4cb92aecb62d15a14115f3ceb9363",
      "ancestry": [
        "CLI I/O Contract",
        "6. Cursor Pagination"
      ],
      "text": "Bốn verb trả tập có thể lớn tuỳ dữ liệu mang phân trang tuỳ chọn:\n`ready` · `triage` · `evolve` (lượt liệt-kê không cờ) · `list`'s khoá\n`work`. Không truyền `--cursor`/`--limit` → kết quả đầy đủ, y hệt không có\ntính năng này. Truyền một trong hai → kết quả đổi hình dạng thành\n`{items, nextCursor}`. Con trỏ là một chuỗi đục hoàn toàn — sinh bởi máy\nchủ, người gọi chỉ trả lại nguyên văn, không bao giờ tự phân tích hay tự\nchế. `nextCursor` là `null` khi đã tới cuối tập. Một con trỏ trỏ tới mục đã\nrời tập là lỗi phạm trù `validation`, thông điệp tự nêu cách sửa (bắt đầu\nlại không kèm `--cursor`). `conflicts` CỐ Ý không phân trang — mỗi dòng của\nnó là một cặp `(a,b)`, không có khoá riêng cho một dòng."
    }
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_da21278ab32966f6631c82420552ed2b"
}
```

## Entry claim_b38e730cc466114aa1e1ebba6fa880ed

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-io-contract.json",
  "collection": "claims",
  "claimId": "claim_b38e730cc466114aa1e1ebba6fa880ed",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "b-io-contract",
  "before": {
    "claimId": "claim_b38e730cc466114aa1e1ebba6fa880ed",
    "sourceUnitDigest": "b82a558166f118f339210d9a475214042a603bd09f64a3a2a8795d96fbdf57ce",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-29",
    "claimKind": "contract",
    "disposition": "merge",
    "reviewStatus": "reviewed",
    "rationale": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover.",
    "authoredBy": "codex-session:unit-run-1792052396770-6f1c5957@2026-10-15",
    "reviewNote": "mechanical: legacy block 18 (b82a5581) byte-equal to carrier block 29; digests recompute; anchor shift 28->29 from the inserted block 23; before and after target digest equal; disposition merge unchanged from the reviewed decision; anchors, ancestry pass",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-15",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-261015-1526-specs-ui-reworks-main-recarry.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "b82a558166f118f339210d9a475214042a603bd09f64a3a2a8795d96fbdf57ce",
    "targetAncestry": [
      "CLI I/O Contract",
      "6. Cursor Pagination"
    ],
    "reviewReportCommit": "0e8ce7710ac67ad038927b242b2461876bf8c90d"
  },
  "currentDecision": {
    "claimId": "claim_b38e730cc466114aa1e1ebba6fa880ed",
    "sourceUnitDigest": "b82a558166f118f339210d9a475214042a603bd09f64a3a2a8795d96fbdf57ce",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-30",
    "claimKind": "contract",
    "disposition": "merge",
    "reviewStatus": "pending",
    "rationale": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. A31: target paragraph numbering shifted after the new installation-error paragraph; rebound by unique complete prior target digest, preserving the prior referent.",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetUnitDigest": "b82a558166f118f339210d9a475214042a603bd09f64a3a2a8795d96fbdf57ce",
    "targetAncestry": [
      "CLI I/O Contract",
      "6. Cursor Pagination"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/io-contract.md",
    "unitDigest": "f7db584629456ff7dc7809a7269b5323e94ec40e570d416c5cd29d45ea82206d",
    "identityFingerprint": "f7db584629456ff7dc7809a7269b5323e94ec40e570d416c5cd29d45ea82206d",
    "claimId": "claim_b38e730cc466114aa1e1ebba6fa880ed",
    "sourceAnchor": "unheaded-block-19",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "b82a558166f118f339210d9a475214042a603bd09f64a3a2a8795d96fbdf57ce",
    "claimKind": "contract",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-19",
      "githubAnchor": "unheaded-block-19",
      "stableAnchor": "unheaded-block-19",
      "title": "Unheaded block 19",
      "startLine": 131,
      "endLine": 132,
      "textDigest": "b82a558166f118f339210d9a475214042a603bd09f64a3a2a8795d96fbdf57ce",
      "sample": "Sổ verb tự khai verb nào phân trang qua trường `paginated` (đúng/sai, mặt\ntrên MỌI verb).",
      "identityFingerprint": "f7db584629456ff7dc7809a7269b5323e94ec40e570d416c5cd29d45ea82206d",
      "ancestry": [
        "Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`",
        "Chiều ra — envelope thống nhất",
        "Phân trang — con trỏ đục"
      ],
      "text": "Sổ verb tự khai verb nào phân trang qua trường `paginated` (đúng/sai, mặt\ntrên MỌI verb)."
    }
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-30",
    "githubAnchor": "unheaded-block-30",
    "stableAnchor": "unheaded-block-30",
    "title": "Unheaded block 30",
    "startLine": 262,
    "endLine": 263,
    "textDigest": "b82a558166f118f339210d9a475214042a603bd09f64a3a2a8795d96fbdf57ce",
    "sample": "Sổ verb tự khai verb nào phân trang qua trường `paginated` (đúng/sai, mặt\ntrên MỌI verb).",
    "identityFingerprint": "f7db584629456ff7dc7809a7269b5323e94ec40e570d416c5cd29d45ea82206d",
    "ancestry": [
      "CLI I/O Contract",
      "6. Cursor Pagination"
    ],
    "text": "Sổ verb tự khai verb nào phân trang qua trường `paginated` (đúng/sai, mặt\ntrên MỌI verb)."
  },
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Weak-exact",
    "reason": "ancestor headings differ",
    "targetUnit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-30",
      "githubAnchor": "unheaded-block-30",
      "stableAnchor": "unheaded-block-30",
      "title": "Unheaded block 30",
      "startLine": 262,
      "endLine": 263,
      "textDigest": "b82a558166f118f339210d9a475214042a603bd09f64a3a2a8795d96fbdf57ce",
      "sample": "Sổ verb tự khai verb nào phân trang qua trường `paginated` (đúng/sai, mặt\ntrên MỌI verb).",
      "identityFingerprint": "f7db584629456ff7dc7809a7269b5323e94ec40e570d416c5cd29d45ea82206d",
      "ancestry": [
        "CLI I/O Contract",
        "6. Cursor Pagination"
      ],
      "text": "Sổ verb tự khai verb nào phân trang qua trường `paginated` (đúng/sai, mặt\ntrên MỌI verb)."
    }
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_b38e730cc466114aa1e1ebba6fa880ed"
}
```

## Entry claim_535f1aeb31d616e2138a5b3719cb4cd0

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-io-contract.json",
  "collection": "claims",
  "claimId": "claim_535f1aeb31d616e2138a5b3719cb4cd0",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "b-io-contract",
  "before": {
    "claimId": "claim_535f1aeb31d616e2138a5b3719cb4cd0",
    "sourceUnitDigest": "78393c0183b6bda3ff166520f4601ab2793cbdf85e2669949001a73b9102f293",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-35",
    "claimKind": "contract",
    "disposition": "merge",
    "reviewStatus": "reviewed",
    "rationale": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover.",
    "authoredBy": "codex-session:unit-run-1792052396770-6f1c5957@2026-10-15",
    "reviewNote": "deep: sampled; legacy block 21 (78393c01) byte-equal to carrier block 35 (STR38 declaration sentence read); anchor shift 34->35 from the inserted block 23; before and after target digest equal; disposition merge unchanged from the reviewed decision; anchors, ancestry pass",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-15",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-261015-1526-specs-ui-reworks-main-recarry.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "78393c0183b6bda3ff166520f4601ab2793cbdf85e2669949001a73b9102f293",
    "targetAncestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Entry Fields And Effect Axes"
    ],
    "reviewReportCommit": "0e8ce7710ac67ad038927b242b2461876bf8c90d"
  },
  "currentDecision": {
    "claimId": "claim_535f1aeb31d616e2138a5b3719cb4cd0",
    "sourceUnitDigest": "78393c0183b6bda3ff166520f4601ab2793cbdf85e2669949001a73b9102f293",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-36",
    "claimKind": "contract",
    "disposition": "merge",
    "reviewStatus": "pending",
    "rationale": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. A31: target paragraph numbering shifted after the new installation-error paragraph; rebound by unique complete prior target digest, preserving the prior referent.",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetUnitDigest": "78393c0183b6bda3ff166520f4601ab2793cbdf85e2669949001a73b9102f293",
    "targetAncestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Entry Fields And Effect Axes"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/io-contract.md",
    "unitDigest": "09c3e021c9425c045fe449a643d34c2a0822b5ab6874cf19bff4bead073bf38c",
    "identityFingerprint": "09c3e021c9425c045fe449a643d34c2a0822b5ab6874cf19bff4bead073bf38c",
    "claimId": "claim_535f1aeb31d616e2138a5b3719cb4cd0",
    "sourceAnchor": "unheaded-block-22",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "78393c0183b6bda3ff166520f4601ab2793cbdf85e2669949001a73b9102f293",
    "claimKind": "contract",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-22",
      "githubAnchor": "unheaded-block-22",
      "stableAnchor": "unheaded-block-22",
      "title": "Unheaded block 22",
      "startLine": 160,
      "endLine": 161,
      "textDigest": "78393c0183b6bda3ff166520f4601ab2793cbdf85e2669949001a73b9102f293",
      "sample": "Cả hai trục `touchesState`/`externalEffect` vẫn thuần **khai báo** — chưa\nnối vào điều phối hay xác danh; cổng \"ai được nói verb nào\" thuộc STR38.",
      "identityFingerprint": "09c3e021c9425c045fe449a643d34c2a0822b5ab6874cf19bff4bead073bf38c",
      "ancestry": [
        "Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`",
        "Sổ verb máy-đọc — CLI tự mô tả"
      ],
      "text": "Cả hai trục `touchesState`/`externalEffect` vẫn thuần **khai báo** — chưa\nnối vào điều phối hay xác danh; cổng \"ai được nói verb nào\" thuộc STR38."
    }
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-36",
    "githubAnchor": "unheaded-block-36",
    "stableAnchor": "unheaded-block-36",
    "title": "Unheaded block 36",
    "startLine": 338,
    "endLine": 339,
    "textDigest": "78393c0183b6bda3ff166520f4601ab2793cbdf85e2669949001a73b9102f293",
    "sample": "Cả hai trục `touchesState`/`externalEffect` vẫn thuần **khai báo** — chưa\nnối vào điều phối hay xác danh; cổng \"ai được nói verb nào\" thuộc STR38.",
    "identityFingerprint": "09c3e021c9425c045fe449a643d34c2a0822b5ab6874cf19bff4bead073bf38c",
    "ancestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Entry Fields And Effect Axes"
    ],
    "text": "Cả hai trục `touchesState`/`externalEffect` vẫn thuần **khai báo** — chưa\nnối vào điều phối hay xác danh; cổng \"ai được nói verb nào\" thuộc STR38."
  },
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Weak-exact",
    "reason": "ancestor headings differ",
    "targetUnit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-36",
      "githubAnchor": "unheaded-block-36",
      "stableAnchor": "unheaded-block-36",
      "title": "Unheaded block 36",
      "startLine": 338,
      "endLine": 339,
      "textDigest": "78393c0183b6bda3ff166520f4601ab2793cbdf85e2669949001a73b9102f293",
      "sample": "Cả hai trục `touchesState`/`externalEffect` vẫn thuần **khai báo** — chưa\nnối vào điều phối hay xác danh; cổng \"ai được nói verb nào\" thuộc STR38.",
      "identityFingerprint": "09c3e021c9425c045fe449a643d34c2a0822b5ab6874cf19bff4bead073bf38c",
      "ancestry": [
        "CLI I/O Contract",
        "7. Machine-Readable Verb Registry",
        "Entry Fields And Effect Axes"
      ],
      "text": "Cả hai trục `touchesState`/`externalEffect` vẫn thuần **khai báo** — chưa\nnối vào điều phối hay xác danh; cổng \"ai được nói verb nào\" thuộc STR38."
    }
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_535f1aeb31d616e2138a5b3719cb4cd0"
}
```

## Entry claim_d0e16d088cdecf2dd0b491f819009aa6

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-io-contract.json",
  "collection": "claims",
  "claimId": "claim_d0e16d088cdecf2dd0b491f819009aa6",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "b-io-contract",
  "before": {
    "claimId": "claim_d0e16d088cdecf2dd0b491f819009aa6",
    "sourceUnitDigest": "a8eaefe3669a194a9fa84ca8fa92d4d58a5f7c8405e4d7c970fac1ce183148a5",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-37",
    "claimKind": "contract",
    "disposition": "merge",
    "reviewStatus": "reviewed",
    "rationale": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover.",
    "authoredBy": "codex-session:unit-run-1792052396770-6f1c5957@2026-10-15",
    "reviewNote": "mechanical: legacy block 22 (a8eaefe3) byte-equal to carrier block 37; digests recompute; anchor shift 36->37 from the inserted block 23; before and after target digest equal; disposition merge unchanged from the reviewed decision; anchors, ancestry pass",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-15",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-261015-1526-specs-ui-reworks-main-recarry.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "a8eaefe3669a194a9fa84ca8fa92d4d58a5f7c8405e4d7c970fac1ce183148a5",
    "targetAncestry": [
      "CLI I/O Contract",
      "8. Multi-Value Flag Convention"
    ],
    "reviewReportCommit": "0e8ce7710ac67ad038927b242b2461876bf8c90d"
  },
  "currentDecision": {
    "claimId": "claim_d0e16d088cdecf2dd0b491f819009aa6",
    "sourceUnitDigest": "a8eaefe3669a194a9fa84ca8fa92d4d58a5f7c8405e4d7c970fac1ce183148a5",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-38",
    "claimKind": "contract",
    "disposition": "merge",
    "reviewStatus": "pending",
    "rationale": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. A31: target paragraph numbering shifted after the new installation-error paragraph; rebound by unique complete prior target digest, preserving the prior referent.",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetUnitDigest": "a8eaefe3669a194a9fa84ca8fa92d4d58a5f7c8405e4d7c970fac1ce183148a5",
    "targetAncestry": [
      "CLI I/O Contract",
      "8. Multi-Value Flag Convention"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/io-contract.md",
    "unitDigest": "391c047e1504392d5753fa672f78780cdcb8fe38297709666e38396a5d65e1e6",
    "identityFingerprint": "391c047e1504392d5753fa672f78780cdcb8fe38297709666e38396a5d65e1e6",
    "claimId": "claim_d0e16d088cdecf2dd0b491f819009aa6",
    "sourceAnchor": "unheaded-block-23",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "a8eaefe3669a194a9fa84ca8fa92d4d58a5f7c8405e4d7c970fac1ce183148a5",
    "claimKind": "contract",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-23",
      "githubAnchor": "unheaded-block-23",
      "stableAnchor": "unheaded-block-23",
      "title": "Unheaded block 23",
      "startLine": 165,
      "endLine": 169,
      "textDigest": "a8eaefe3669a194a9fa84ca8fa92d4d58a5f7c8405e4d7c970fac1ce183148a5",
      "sample": "Tham số nào mang nhiều giá trị khai `multiValueFormat`: `'csv'` (phân tách\ndấu phẩy — `deps`/`refs`/`footprint`/`targets`) hay `'json-array'` (chuỗi\nJSON-hoá — `acceptance`, CỐ Ý k",
      "identityFingerprint": "391c047e1504392d5753fa672f78780cdcb8fe38297709666e38396a5d65e1e6",
      "ancestry": [
        "Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`",
        "Sổ verb máy-đọc — CLI tự mô tả",
        "Quy ước cờ nhiều-giá-trị"
      ],
      "text": "Tham số nào mang nhiều giá trị khai `multiValueFormat`: `'csv'` (phân tách\ndấu phẩy — `deps`/`refs`/`footprint`/`targets`) hay `'json-array'` (chuỗi\nJSON-hoá — `acceptance`, CỐ Ý không phẩy vì văn bản một clause có thể tự\nchứa dấu phẩy). Trước STR46, khác biệt này chỉ nằm trong văn xuôi mô tả;\nnay đọc được bằng máy."
    }
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-38",
    "githubAnchor": "unheaded-block-38",
    "stableAnchor": "unheaded-block-38",
    "title": "Unheaded block 38",
    "startLine": 352,
    "endLine": 356,
    "textDigest": "a8eaefe3669a194a9fa84ca8fa92d4d58a5f7c8405e4d7c970fac1ce183148a5",
    "sample": "Tham số nào mang nhiều giá trị khai `multiValueFormat`: `'csv'` (phân tách\ndấu phẩy — `deps`/`refs`/`footprint`/`targets`) hay `'json-array'` (chuỗi\nJSON-hoá — `acceptance`, CỐ Ý k",
    "identityFingerprint": "391c047e1504392d5753fa672f78780cdcb8fe38297709666e38396a5d65e1e6",
    "ancestry": [
      "CLI I/O Contract",
      "8. Multi-Value Flag Convention"
    ],
    "text": "Tham số nào mang nhiều giá trị khai `multiValueFormat`: `'csv'` (phân tách\ndấu phẩy — `deps`/`refs`/`footprint`/`targets`) hay `'json-array'` (chuỗi\nJSON-hoá — `acceptance`, CỐ Ý không phẩy vì văn bản một clause có thể tự\nchứa dấu phẩy). Trước STR46, khác biệt này chỉ nằm trong văn xuôi mô tả;\nnay đọc được bằng máy."
  },
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Weak-exact",
    "reason": "ancestor headings differ",
    "targetUnit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-38",
      "githubAnchor": "unheaded-block-38",
      "stableAnchor": "unheaded-block-38",
      "title": "Unheaded block 38",
      "startLine": 352,
      "endLine": 356,
      "textDigest": "a8eaefe3669a194a9fa84ca8fa92d4d58a5f7c8405e4d7c970fac1ce183148a5",
      "sample": "Tham số nào mang nhiều giá trị khai `multiValueFormat`: `'csv'` (phân tách\ndấu phẩy — `deps`/`refs`/`footprint`/`targets`) hay `'json-array'` (chuỗi\nJSON-hoá — `acceptance`, CỐ Ý k",
      "identityFingerprint": "391c047e1504392d5753fa672f78780cdcb8fe38297709666e38396a5d65e1e6",
      "ancestry": [
        "CLI I/O Contract",
        "8. Multi-Value Flag Convention"
      ],
      "text": "Tham số nào mang nhiều giá trị khai `multiValueFormat`: `'csv'` (phân tách\ndấu phẩy — `deps`/`refs`/`footprint`/`targets`) hay `'json-array'` (chuỗi\nJSON-hoá — `acceptance`, CỐ Ý không phẩy vì văn bản một clause có thể tự\nchứa dấu phẩy). Trước STR46, khác biệt này chỉ nằm trong văn xuôi mô tả;\nnay đọc được bằng máy."
    }
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_d0e16d088cdecf2dd0b491f819009aa6"
}
```

## Entry claim_e9ee744c6e1847ef25b3eb0bf180f577

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-io-contract.json",
  "collection": "claims",
  "claimId": "claim_e9ee744c6e1847ef25b3eb0bf180f577",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "b-io-contract",
  "before": {
    "claimId": "claim_e9ee744c6e1847ef25b3eb0bf180f577",
    "sourceUnitDigest": "ae0e60ec193e0ac5ad026b2cf78a37ba3156fea7043460714946bfe66311ab5e",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-41",
    "claimKind": "contract",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover.",
    "authoredBy": "codex-session:unit-run-1792052396770-6f1c5957@2026-10-15",
    "reviewNote": "deep: unequal digests ae0e60ec vs a378c81f; diff read: only the 0011 link target rewritten to ../decisions/retired-decision-history.md in the carrier, unchanged by this merge (digest equal before and after, shift 40 to 41); promote unchanged",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-15",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-261015-1526-specs-ui-reworks-main-recarry.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "a378c81f6a84c5e3ed9b38917f7136c55dcc4af85295bcf105fa9ac9d6792532",
    "targetAncestry": [
      "CLI I/O Contract",
      "10. Version Tokens"
    ],
    "reviewReportCommit": "0e8ce7710ac67ad038927b242b2461876bf8c90d"
  },
  "currentDecision": {
    "claimId": "claim_e9ee744c6e1847ef25b3eb0bf180f577",
    "sourceUnitDigest": "ae0e60ec193e0ac5ad026b2cf78a37ba3156fea7043460714946bfe66311ab5e",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-42",
    "claimKind": "contract",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. A31: target paragraph numbering shifted after the new installation-error paragraph; rebound by unique complete prior target digest, preserving the prior referent.",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetUnitDigest": "a378c81f6a84c5e3ed9b38917f7136c55dcc4af85295bcf105fa9ac9d6792532",
    "targetAncestry": [
      "CLI I/O Contract",
      "10. Version Tokens"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/io-contract.md",
    "unitDigest": "2df9f5fa04ff7038ba5082547bea7f14594ba0bedda12729cf337e9f24f85bfc",
    "identityFingerprint": "2df9f5fa04ff7038ba5082547bea7f14594ba0bedda12729cf337e9f24f85bfc",
    "claimId": "claim_e9ee744c6e1847ef25b3eb0bf180f577",
    "sourceAnchor": "unheaded-block-24",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "ae0e60ec193e0ac5ad026b2cf78a37ba3156fea7043460714946bfe66311ab5e",
    "claimKind": "contract",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-24",
      "githubAnchor": "unheaded-block-24",
      "stableAnchor": "unheaded-block-24",
      "title": "Unheaded block 24",
      "startLine": 173,
      "endLine": 174,
      "textDigest": "ae0e60ec193e0ac5ad026b2cf78a37ba3156fea7043460714946bfe66311ab5e",
      "sample": "Theo [0011](decisions/0011-version-tuong-minh-cho-moi-contract.md): mỗi\ncontract mang version tường minh trong định danh của chính nó.",
      "identityFingerprint": "2df9f5fa04ff7038ba5082547bea7f14594ba0bedda12729cf337e9f24f85bfc",
      "ancestry": [
        "Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`",
        "Version token"
      ],
      "text": "Theo [0011](decisions/0011-version-tuong-minh-cho-moi-contract.md): mỗi\ncontract mang version tường minh trong định danh của chính nó."
    }
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-42",
    "githubAnchor": "unheaded-block-42",
    "stableAnchor": "unheaded-block-42",
    "title": "Unheaded block 42",
    "startLine": 397,
    "endLine": 398,
    "textDigest": "a378c81f6a84c5e3ed9b38917f7136c55dcc4af85295bcf105fa9ac9d6792532",
    "sample": "Theo [0011](../decisions/retired-decision-history.md#7-adr-0011-explicit-version-for-every-contract): mỗi\ncontract mang version tường minh trong định danh của chính nó.",
    "identityFingerprint": "88147338a93e7d589904d36f6d85470d19e7d0e75ac270e2a2e465f1255292a7",
    "ancestry": [
      "CLI I/O Contract",
      "10. Version Tokens"
    ],
    "text": "Theo [0011](../decisions/retired-decision-history.md#7-adr-0011-explicit-version-for-every-contract): mỗi\ncontract mang version tường minh trong định danh của chính nó."
  },
  "sourceTargetDigestsUnequal": true,
  "classObservation": {
    "class": "Judgment",
    "reason": "no target digest match",
    "targetUnit": null
  },
  "mechanicalRequired": true,
  "deepRequired": true,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_e9ee744c6e1847ef25b3eb0bf180f577"
}
```

## Entry claim_6f7c99f38f64abb5af7f07c1e2690730

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-io-contract.json",
  "collection": "claims",
  "claimId": "claim_6f7c99f38f64abb5af7f07c1e2690730",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "b-io-contract",
  "before": {
    "claimId": "claim_6f7c99f38f64abb5af7f07c1e2690730",
    "sourceUnitDigest": "c9d3ad96d4b03b02fbcf8e5bd0261ab7c77109320f204a18b9a43eef0f4f1fd3",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-42",
    "claimKind": "contract",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover.",
    "authoredBy": "codex-session:unit-run-1792052396770-6f1c5957@2026-10-15",
    "reviewNote": "deep: sampled; legacy block 24 (c9d3ad96) byte-equal to carrier block 42 (contract token table read; its 2.0 manifest row is carried verbatim and stays stale, owed at promotion); anchor shift 41->42 from the inserted block 23; before and after target digest equal; disposition promote unchanged from the reviewed decision; anchors, ancestry pass",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-15",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-261015-1526-specs-ui-reworks-main-recarry.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "c9d3ad96d4b03b02fbcf8e5bd0261ab7c77109320f204a18b9a43eef0f4f1fd3",
    "targetAncestry": [
      "CLI I/O Contract",
      "10. Version Tokens"
    ],
    "reviewReportCommit": "0e8ce7710ac67ad038927b242b2461876bf8c90d"
  },
  "currentDecision": {
    "claimId": "claim_6f7c99f38f64abb5af7f07c1e2690730",
    "sourceUnitDigest": "c9d3ad96d4b03b02fbcf8e5bd0261ab7c77109320f204a18b9a43eef0f4f1fd3",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-43",
    "claimKind": "contract",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. A31: target paragraph numbering shifted after the new installation-error paragraph; rebound by unique complete prior target digest, preserving the prior referent.",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetUnitDigest": "c9d3ad96d4b03b02fbcf8e5bd0261ab7c77109320f204a18b9a43eef0f4f1fd3",
    "targetAncestry": [
      "CLI I/O Contract",
      "10. Version Tokens"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/io-contract.md",
    "unitDigest": "d147ec28828230700ab1bfea679f7deb623328c37da2976e6c6d1b6fe70fa67d",
    "identityFingerprint": "d147ec28828230700ab1bfea679f7deb623328c37da2976e6c6d1b6fe70fa67d",
    "claimId": "claim_6f7c99f38f64abb5af7f07c1e2690730",
    "sourceAnchor": "unheaded-block-25",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "c9d3ad96d4b03b02fbcf8e5bd0261ab7c77109320f204a18b9a43eef0f4f1fd3",
    "claimKind": "contract",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-25",
      "githubAnchor": "unheaded-block-25",
      "stableAnchor": "unheaded-block-25",
      "title": "Unheaded block 25",
      "startLine": 176,
      "endLine": 182,
      "textDigest": "c9d3ad96d4b03b02fbcf8e5bd0261ab7c77109320f204a18b9a43eef0f4f1fd3",
      "sample": "| Bề mặt | Token | Hiện thân |\n|---|---|---|\n| Phong bì CLI (CTR001) | `fgos.v1` | field `contract` trên mọi phong bì, cả hai binary |\n| Stdout của `fgos-runner` (CTR003, riêng phầ",
      "identityFingerprint": "d147ec28828230700ab1bfea679f7deb623328c37da2976e6c6d1b6fe70fa67d",
      "ancestry": [
        "Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`",
        "Version token"
      ],
      "text": "| Bề mặt | Token | Hiện thân |\n|---|---|---|\n| Phong bì CLI (CTR001) | `fgos.v1` | field `contract` trên mọi phong bì, cả hai binary |\n| Stdout của `fgos-runner` (CTR003, riêng phần bề mặt ra) | dùng lại `fgos.v1` | KHÔNG đúc token CTR003 riêng — bề mặt này tái dùng đúng cơ chế `fgos.v1` của CTR001 |\n| Sổ verb (manifest) | `2.0` | field `schema_version` trong `{schema_version, commands[]}` |\n| Sự kiện (event log) | `3` | field `v` trên mỗi event, `SCHEMA_VERSION` (`work.mjs`) |\n| `gates[id]` (ask/answer, CTR004) | `CTR004/v1` | hiện thân qua `SCHEMA_VERSION` của sự kiện `work.move` nó fold ra — KHÔNG một field version riêng (thêm field thứ hai cho cùng dữ liệu phá DRY) |"
    }
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-43",
    "githubAnchor": "unheaded-block-43",
    "stableAnchor": "unheaded-block-43",
    "title": "Unheaded block 43",
    "startLine": 400,
    "endLine": 406,
    "textDigest": "c9d3ad96d4b03b02fbcf8e5bd0261ab7c77109320f204a18b9a43eef0f4f1fd3",
    "sample": "| Bề mặt | Token | Hiện thân |\n|---|---|---|\n| Phong bì CLI (CTR001) | `fgos.v1` | field `contract` trên mọi phong bì, cả hai binary |\n| Stdout của `fgos-runner` (CTR003, riêng phầ",
    "identityFingerprint": "d147ec28828230700ab1bfea679f7deb623328c37da2976e6c6d1b6fe70fa67d",
    "ancestry": [
      "CLI I/O Contract",
      "10. Version Tokens"
    ],
    "text": "| Bề mặt | Token | Hiện thân |\n|---|---|---|\n| Phong bì CLI (CTR001) | `fgos.v1` | field `contract` trên mọi phong bì, cả hai binary |\n| Stdout của `fgos-runner` (CTR003, riêng phần bề mặt ra) | dùng lại `fgos.v1` | KHÔNG đúc token CTR003 riêng — bề mặt này tái dùng đúng cơ chế `fgos.v1` của CTR001 |\n| Sổ verb (manifest) | `2.0` | field `schema_version` trong `{schema_version, commands[]}` |\n| Sự kiện (event log) | `3` | field `v` trên mỗi event, `SCHEMA_VERSION` (`work.mjs`) |\n| `gates[id]` (ask/answer, CTR004) | `CTR004/v1` | hiện thân qua `SCHEMA_VERSION` của sự kiện `work.move` nó fold ra — KHÔNG một field version riêng (thêm field thứ hai cho cùng dữ liệu phá DRY) |"
  },
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Weak-exact",
    "reason": "ancestor headings differ",
    "targetUnit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-43",
      "githubAnchor": "unheaded-block-43",
      "stableAnchor": "unheaded-block-43",
      "title": "Unheaded block 43",
      "startLine": 400,
      "endLine": 406,
      "textDigest": "c9d3ad96d4b03b02fbcf8e5bd0261ab7c77109320f204a18b9a43eef0f4f1fd3",
      "sample": "| Bề mặt | Token | Hiện thân |\n|---|---|---|\n| Phong bì CLI (CTR001) | `fgos.v1` | field `contract` trên mọi phong bì, cả hai binary |\n| Stdout của `fgos-runner` (CTR003, riêng phầ",
      "identityFingerprint": "d147ec28828230700ab1bfea679f7deb623328c37da2976e6c6d1b6fe70fa67d",
      "ancestry": [
        "CLI I/O Contract",
        "10. Version Tokens"
      ],
      "text": "| Bề mặt | Token | Hiện thân |\n|---|---|---|\n| Phong bì CLI (CTR001) | `fgos.v1` | field `contract` trên mọi phong bì, cả hai binary |\n| Stdout của `fgos-runner` (CTR003, riêng phần bề mặt ra) | dùng lại `fgos.v1` | KHÔNG đúc token CTR003 riêng — bề mặt này tái dùng đúng cơ chế `fgos.v1` của CTR001 |\n| Sổ verb (manifest) | `2.0` | field `schema_version` trong `{schema_version, commands[]}` |\n| Sự kiện (event log) | `3` | field `v` trên mỗi event, `SCHEMA_VERSION` (`work.mjs`) |\n| `gates[id]` (ask/answer, CTR004) | `CTR004/v1` | hiện thân qua `SCHEMA_VERSION` của sự kiện `work.move` nó fold ra — KHÔNG một field version riêng (thêm field thứ hai cho cùng dữ liệu phá DRY) |"
    }
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_6f7c99f38f64abb5af7f07c1e2690730"
}
```

## Entry claim_ea280fa29dca090fe3306f6161ac6ae7

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-io-contract.json",
  "collection": "claims",
  "claimId": "claim_ea280fa29dca090fe3306f6161ac6ae7",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "b-io-contract",
  "before": {
    "claimId": "claim_ea280fa29dca090fe3306f6161ac6ae7",
    "sourceUnitDigest": "03c9a0137385cea34764f24cc92708d2c2c2c6a722f1e24345441232595f92cb",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-43",
    "claimKind": "contract",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover.",
    "authoredBy": "codex-session:unit-run-1792052396770-6f1c5957@2026-10-15",
    "reviewNote": "mechanical: legacy io-contract block 25 byte-equal to carrier unheaded-block-43; digests recompute; anchor shift 42->43 from the inserted block 23; before and after target digest equal; disposition promote unchanged from the reviewed decision; anchors, ancestry pass",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-15",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-261015-1526-specs-ui-reworks-main-recarry.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "03c9a0137385cea34764f24cc92708d2c2c2c6a722f1e24345441232595f92cb",
    "targetAncestry": [
      "CLI I/O Contract",
      "10. Version Tokens"
    ],
    "reviewReportCommit": "0e8ce7710ac67ad038927b242b2461876bf8c90d"
  },
  "currentDecision": {
    "claimId": "claim_ea280fa29dca090fe3306f6161ac6ae7",
    "sourceUnitDigest": "03c9a0137385cea34764f24cc92708d2c2c2c6a722f1e24345441232595f92cb",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-44",
    "claimKind": "contract",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. A31: target paragraph numbering shifted after the new installation-error paragraph; rebound by unique complete prior target digest, preserving the prior referent.",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetUnitDigest": "03c9a0137385cea34764f24cc92708d2c2c2c6a722f1e24345441232595f92cb",
    "targetAncestry": [
      "CLI I/O Contract",
      "10. Version Tokens"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/io-contract.md",
    "unitDigest": "e0550b3dffbcc1e7cca3870dcaba9bc25ff6b8faf4890803a7c9c02fdaf3f477",
    "identityFingerprint": "e0550b3dffbcc1e7cca3870dcaba9bc25ff6b8faf4890803a7c9c02fdaf3f477",
    "claimId": "claim_ea280fa29dca090fe3306f6161ac6ae7",
    "sourceAnchor": "unheaded-block-26",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "03c9a0137385cea34764f24cc92708d2c2c2c6a722f1e24345441232595f92cb",
    "claimKind": "contract",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-26",
      "githubAnchor": "unheaded-block-26",
      "stableAnchor": "unheaded-block-26",
      "title": "Unheaded block 26",
      "startLine": 184,
      "endLine": 185,
      "textDigest": "03c9a0137385cea34764f24cc92708d2c2c2c6a722f1e24345441232595f92cb",
      "sample": "CTR006 (routing-handoff) nằm NGOÀI: nó là spec đầy đủ nhưng chưa có code,\ndán version lên thứ chưa chạy là đóng dấu cho giả định.",
      "identityFingerprint": "e0550b3dffbcc1e7cca3870dcaba9bc25ff6b8faf4890803a7c9c02fdaf3f477",
      "ancestry": [
        "Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`",
        "Version token"
      ],
      "text": "CTR006 (routing-handoff) nằm NGOÀI: nó là spec đầy đủ nhưng chưa có code,\ndán version lên thứ chưa chạy là đóng dấu cho giả định."
    }
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-44",
    "githubAnchor": "unheaded-block-44",
    "stableAnchor": "unheaded-block-44",
    "title": "Unheaded block 44",
    "startLine": 408,
    "endLine": 409,
    "textDigest": "03c9a0137385cea34764f24cc92708d2c2c2c6a722f1e24345441232595f92cb",
    "sample": "CTR006 (routing-handoff) nằm NGOÀI: nó là spec đầy đủ nhưng chưa có code,\ndán version lên thứ chưa chạy là đóng dấu cho giả định.",
    "identityFingerprint": "e0550b3dffbcc1e7cca3870dcaba9bc25ff6b8faf4890803a7c9c02fdaf3f477",
    "ancestry": [
      "CLI I/O Contract",
      "10. Version Tokens"
    ],
    "text": "CTR006 (routing-handoff) nằm NGOÀI: nó là spec đầy đủ nhưng chưa có code,\ndán version lên thứ chưa chạy là đóng dấu cho giả định."
  },
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Weak-exact",
    "reason": "ancestor headings differ",
    "targetUnit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-44",
      "githubAnchor": "unheaded-block-44",
      "stableAnchor": "unheaded-block-44",
      "title": "Unheaded block 44",
      "startLine": 408,
      "endLine": 409,
      "textDigest": "03c9a0137385cea34764f24cc92708d2c2c2c6a722f1e24345441232595f92cb",
      "sample": "CTR006 (routing-handoff) nằm NGOÀI: nó là spec đầy đủ nhưng chưa có code,\ndán version lên thứ chưa chạy là đóng dấu cho giả định.",
      "identityFingerprint": "e0550b3dffbcc1e7cca3870dcaba9bc25ff6b8faf4890803a7c9c02fdaf3f477",
      "ancestry": [
        "CLI I/O Contract",
        "10. Version Tokens"
      ],
      "text": "CTR006 (routing-handoff) nằm NGOÀI: nó là spec đầy đủ nhưng chưa có code,\ndán version lên thứ chưa chạy là đóng dấu cho giả định."
    }
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_ea280fa29dca090fe3306f6161ac6ae7"
}
```

## Entry claim_8999e61e46d6c02b407b84263d7a2d67

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-io-contract.json",
  "collection": "claims",
  "claimId": "claim_8999e61e46d6c02b407b84263d7a2d67",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "b-io-contract",
  "before": {
    "claimId": "claim_8999e61e46d6c02b407b84263d7a2d67",
    "sourceUnitDigest": "36d44c8bdf5ad1f062c83e623e68e7d429939c8bc1bc44c0b5bf36aba736078d",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-44",
    "claimKind": "contract",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover.",
    "authoredBy": "codex-session:unit-run-1792052396770-6f1c5957@2026-10-15",
    "reviewNote": "deep: sampled; legacy io-contract block 26 byte-equal to carrier unheaded-block-44; digests recompute; anchor shift 43->44 from the inserted block 23; before and after target digest equal; disposition promote unchanged from the reviewed decision; anchors, ancestry pass",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-15",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-261015-1526-specs-ui-reworks-main-recarry.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "36d44c8bdf5ad1f062c83e623e68e7d429939c8bc1bc44c0b5bf36aba736078d",
    "targetAncestry": [
      "CLI I/O Contract",
      "11. Scope Boundary"
    ],
    "reviewReportCommit": "0e8ce7710ac67ad038927b242b2461876bf8c90d"
  },
  "currentDecision": {
    "claimId": "claim_8999e61e46d6c02b407b84263d7a2d67",
    "sourceUnitDigest": "36d44c8bdf5ad1f062c83e623e68e7d429939c8bc1bc44c0b5bf36aba736078d",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-45",
    "claimKind": "contract",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. A31: target paragraph numbering shifted after the new installation-error paragraph; rebound by unique complete prior target digest, preserving the prior referent.",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetUnitDigest": "36d44c8bdf5ad1f062c83e623e68e7d429939c8bc1bc44c0b5bf36aba736078d",
    "targetAncestry": [
      "CLI I/O Contract",
      "11. Scope Boundary"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/io-contract.md",
    "unitDigest": "a835a7428bc1398d720acb13ab8296532880e72b4898d3899de3d7769b4d82c1",
    "identityFingerprint": "a835a7428bc1398d720acb13ab8296532880e72b4898d3899de3d7769b4d82c1",
    "claimId": "claim_8999e61e46d6c02b407b84263d7a2d67",
    "sourceAnchor": "unheaded-block-27",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "36d44c8bdf5ad1f062c83e623e68e7d429939c8bc1bc44c0b5bf36aba736078d",
    "claimKind": "contract",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-27",
      "githubAnchor": "unheaded-block-27",
      "stableAnchor": "unheaded-block-27",
      "title": "Unheaded block 27",
      "startLine": 189,
      "endLine": 191,
      "textDigest": "36d44c8bdf5ad1f062c83e623e68e7d429939c8bc1bc44c0b5bf36aba736078d",
      "sample": "STR46 hợp nhất chiều vào/ra hôm nay đang có, KHÔNG mở rộng nó thành chủ\nđộng (push). Ba việc sau đã locked ngoài biên khi mở exploring, mỗi việc có\nnhà riêng:",
      "identityFingerprint": "a835a7428bc1398d720acb13ab8296532880e72b4898d3899de3d7769b4d82c1",
      "ancestry": [
        "Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`",
        "Ranh giới — điều gì KHÔNG thuộc hợp đồng này"
      ],
      "text": "STR46 hợp nhất chiều vào/ra hôm nay đang có, KHÔNG mở rộng nó thành chủ\nđộng (push). Ba việc sau đã locked ngoài biên khi mở exploring, mỗi việc có\nnhà riêng:"
    }
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-45",
    "githubAnchor": "unheaded-block-45",
    "stableAnchor": "unheaded-block-45",
    "title": "Unheaded block 45",
    "startLine": 413,
    "endLine": 415,
    "textDigest": "36d44c8bdf5ad1f062c83e623e68e7d429939c8bc1bc44c0b5bf36aba736078d",
    "sample": "STR46 hợp nhất chiều vào/ra hôm nay đang có, KHÔNG mở rộng nó thành chủ\nđộng (push). Ba việc sau đã locked ngoài biên khi mở exploring, mỗi việc có\nnhà riêng:",
    "identityFingerprint": "a835a7428bc1398d720acb13ab8296532880e72b4898d3899de3d7769b4d82c1",
    "ancestry": [
      "CLI I/O Contract",
      "11. Scope Boundary"
    ],
    "text": "STR46 hợp nhất chiều vào/ra hôm nay đang có, KHÔNG mở rộng nó thành chủ\nđộng (push). Ba việc sau đã locked ngoài biên khi mở exploring, mỗi việc có\nnhà riêng:"
  },
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Weak-exact",
    "reason": "ancestor headings differ",
    "targetUnit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-45",
      "githubAnchor": "unheaded-block-45",
      "stableAnchor": "unheaded-block-45",
      "title": "Unheaded block 45",
      "startLine": 413,
      "endLine": 415,
      "textDigest": "36d44c8bdf5ad1f062c83e623e68e7d429939c8bc1bc44c0b5bf36aba736078d",
      "sample": "STR46 hợp nhất chiều vào/ra hôm nay đang có, KHÔNG mở rộng nó thành chủ\nđộng (push). Ba việc sau đã locked ngoài biên khi mở exploring, mỗi việc có\nnhà riêng:",
      "identityFingerprint": "a835a7428bc1398d720acb13ab8296532880e72b4898d3899de3d7769b4d82c1",
      "ancestry": [
        "CLI I/O Contract",
        "11. Scope Boundary"
      ],
      "text": "STR46 hợp nhất chiều vào/ra hôm nay đang có, KHÔNG mở rộng nó thành chủ\nđộng (push). Ba việc sau đã locked ngoài biên khi mở exploring, mỗi việc có\nnhà riêng:"
    }
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_8999e61e46d6c02b407b84263d7a2d67"
}
```

## Entry claim_f10fba22a20755dc700bb1720f98f451

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-io-contract.json",
  "collection": "claims",
  "claimId": "claim_f10fba22a20755dc700bb1720f98f451",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "b-io-contract",
  "before": {
    "claimId": "claim_f10fba22a20755dc700bb1720f98f451",
    "sourceUnitDigest": "fa405ec4333b43518de9831ea52cd47228294303f0b3374b8d4a981a669414ea",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-45",
    "claimKind": "contract",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover.",
    "authoredBy": "codex-session:unit-run-1792052396770-6f1c5957@2026-10-15",
    "reviewNote": "mechanical: legacy io-contract block 27 byte-equal to carrier unheaded-block-45; digests recompute; anchor shift 44->45 from the inserted block 23; before and after target digest equal; disposition promote unchanged from the reviewed decision; anchors, ancestry pass",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-15",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-261015-1526-specs-ui-reworks-main-recarry.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "fa405ec4333b43518de9831ea52cd47228294303f0b3374b8d4a981a669414ea",
    "targetAncestry": [
      "CLI I/O Contract",
      "11. Scope Boundary"
    ],
    "reviewReportCommit": "0e8ce7710ac67ad038927b242b2461876bf8c90d"
  },
  "currentDecision": {
    "claimId": "claim_f10fba22a20755dc700bb1720f98f451",
    "sourceUnitDigest": "fa405ec4333b43518de9831ea52cd47228294303f0b3374b8d4a981a669414ea",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-46",
    "claimKind": "contract",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. A31: target paragraph numbering shifted after the new installation-error paragraph; rebound by unique complete prior target digest, preserving the prior referent.",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetUnitDigest": "fa405ec4333b43518de9831ea52cd47228294303f0b3374b8d4a981a669414ea",
    "targetAncestry": [
      "CLI I/O Contract",
      "11. Scope Boundary"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/io-contract.md",
    "unitDigest": "a29bb933980ea4913cae817f4ebe6cac7f0a9646a72058f4553d41243dd446a0",
    "identityFingerprint": "a29bb933980ea4913cae817f4ebe6cac7f0a9646a72058f4553d41243dd446a0",
    "claimId": "claim_f10fba22a20755dc700bb1720f98f451",
    "sourceAnchor": "unheaded-block-28",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "fa405ec4333b43518de9831ea52cd47228294303f0b3374b8d4a981a669414ea",
    "claimKind": "contract",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-28",
      "githubAnchor": "unheaded-block-28",
      "stableAnchor": "unheaded-block-28",
      "title": "Unheaded block 28",
      "startLine": 193,
      "endLine": 198,
      "textDigest": "fa405ec4333b43518de9831ea52cd47228294303f0b3374b8d4a981a669414ea",
      "sample": "- **Chiều-ra khởi-xướng (\"cần bạn\")** — một kênh attention/push có\n  delivery-semantics riêng (at-least-once, dedup, routing, ack,\n  escalation) — thuộc STR48, sống ở consumer/daem",
      "identityFingerprint": "a29bb933980ea4913cae817f4ebe6cac7f0a9646a72058f4553d41243dd446a0",
      "ancestry": [
        "Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`",
        "Ranh giới — điều gì KHÔNG thuộc hợp đồng này"
      ],
      "text": "- **Chiều-ra khởi-xướng (\"cần bạn\")** — một kênh attention/push có\n  delivery-semantics riêng (at-least-once, dedup, routing, ack,\n  escalation) — thuộc STR48, sống ở consumer/daemon, KHÔNG phải core fgOS.\n- **Increment terminal/pane + chat item-scoped** — thuộc STR83/STR38.\n- **Tầng phân quyền** (\"ai được gọi verb nào\", caller chưa xác danh có bị\n  chặn hay không) — thuộc STR38."
    }
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-46",
    "githubAnchor": "unheaded-block-46",
    "stableAnchor": "unheaded-block-46",
    "title": "Unheaded block 46",
    "startLine": 417,
    "endLine": 422,
    "textDigest": "fa405ec4333b43518de9831ea52cd47228294303f0b3374b8d4a981a669414ea",
    "sample": "- **Chiều-ra khởi-xướng (\"cần bạn\")** — một kênh attention/push có\n  delivery-semantics riêng (at-least-once, dedup, routing, ack,\n  escalation) — thuộc STR48, sống ở consumer/daem",
    "identityFingerprint": "a29bb933980ea4913cae817f4ebe6cac7f0a9646a72058f4553d41243dd446a0",
    "ancestry": [
      "CLI I/O Contract",
      "11. Scope Boundary"
    ],
    "text": "- **Chiều-ra khởi-xướng (\"cần bạn\")** — một kênh attention/push có\n  delivery-semantics riêng (at-least-once, dedup, routing, ack,\n  escalation) — thuộc STR48, sống ở consumer/daemon, KHÔNG phải core fgOS.\n- **Increment terminal/pane + chat item-scoped** — thuộc STR83/STR38.\n- **Tầng phân quyền** (\"ai được gọi verb nào\", caller chưa xác danh có bị\n  chặn hay không) — thuộc STR38."
  },
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Weak-exact",
    "reason": "ancestor headings differ",
    "targetUnit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-46",
      "githubAnchor": "unheaded-block-46",
      "stableAnchor": "unheaded-block-46",
      "title": "Unheaded block 46",
      "startLine": 417,
      "endLine": 422,
      "textDigest": "fa405ec4333b43518de9831ea52cd47228294303f0b3374b8d4a981a669414ea",
      "sample": "- **Chiều-ra khởi-xướng (\"cần bạn\")** — một kênh attention/push có\n  delivery-semantics riêng (at-least-once, dedup, routing, ack,\n  escalation) — thuộc STR48, sống ở consumer/daem",
      "identityFingerprint": "a29bb933980ea4913cae817f4ebe6cac7f0a9646a72058f4553d41243dd446a0",
      "ancestry": [
        "CLI I/O Contract",
        "11. Scope Boundary"
      ],
      "text": "- **Chiều-ra khởi-xướng (\"cần bạn\")** — một kênh attention/push có\n  delivery-semantics riêng (at-least-once, dedup, routing, ack,\n  escalation) — thuộc STR48, sống ở consumer/daemon, KHÔNG phải core fgOS.\n- **Increment terminal/pane + chat item-scoped** — thuộc STR83/STR38.\n- **Tầng phân quyền** (\"ai được gọi verb nào\", caller chưa xác danh có bị\n  chặn hay không) — thuộc STR38."
    }
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_f10fba22a20755dc700bb1720f98f451"
}
```

## Entry claim_cf56f4a8b7679435c6bf59abd8c23093

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-io-contract.json",
  "collection": "claims",
  "claimId": "claim_cf56f4a8b7679435c6bf59abd8c23093",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "b-io-contract",
  "before": {
    "claimId": "claim_cf56f4a8b7679435c6bf59abd8c23093",
    "sourceUnitDigest": "30a3d1465b852976e30a3aad9f6729d1f40caacbc299c7fb07e87ff06d42cff7",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-46",
    "claimKind": "historical-context",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover.",
    "authoredBy": "codex-session:unit-run-1792052396770-6f1c5957@2026-10-15",
    "reviewNote": "mechanical: legacy io-contract block 28 byte-equal to carrier unheaded-block-46; digests recompute; anchor shift 45->46 from the inserted block 23; before and after target digest equal; disposition promote unchanged from the reviewed decision; anchors, ancestry pass",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-15",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-261015-1526-specs-ui-reworks-main-recarry.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "30a3d1465b852976e30a3aad9f6729d1f40caacbc299c7fb07e87ff06d42cff7",
    "targetAncestry": [
      "CLI I/O Contract",
      "11. Scope Boundary"
    ],
    "reviewReportCommit": "0e8ce7710ac67ad038927b242b2461876bf8c90d"
  },
  "currentDecision": {
    "claimId": "claim_cf56f4a8b7679435c6bf59abd8c23093",
    "sourceUnitDigest": "30a3d1465b852976e30a3aad9f6729d1f40caacbc299c7fb07e87ff06d42cff7",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-47",
    "claimKind": "historical-context",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. A31: target paragraph numbering shifted after the new installation-error paragraph; rebound by unique complete prior target digest, preserving the prior referent.",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetUnitDigest": "30a3d1465b852976e30a3aad9f6729d1f40caacbc299c7fb07e87ff06d42cff7",
    "targetAncestry": [
      "CLI I/O Contract",
      "11. Scope Boundary"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/io-contract.md",
    "unitDigest": "8bd38f6ba0f85b2d742a0454a7907d8516563078c2d8099856d856f1f2710db9",
    "identityFingerprint": "8bd38f6ba0f85b2d742a0454a7907d8516563078c2d8099856d856f1f2710db9",
    "claimId": "claim_cf56f4a8b7679435c6bf59abd8c23093",
    "sourceAnchor": "unheaded-block-29",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "30a3d1465b852976e30a3aad9f6729d1f40caacbc299c7fb07e87ff06d42cff7",
    "claimKind": "contract",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-29",
      "githubAnchor": "unheaded-block-29",
      "stableAnchor": "unheaded-block-29",
      "title": "Unheaded block 29",
      "startLine": 200,
      "endLine": 202,
      "textDigest": "30a3d1465b852976e30a3aad9f6729d1f40caacbc299c7fb07e87ff06d42cff7",
      "sample": "Đây là lý do CoS gốc của STR46 (bản khai lúc mở backlog) bị thu hẹp có chủ\ný: chỉ vế \"có một spec hợp đồng in/out tự-mô-tả\" là việc của STR46; hai vế\ncòn lại (chiều-ra khởi-xướng, ",
      "identityFingerprint": "8bd38f6ba0f85b2d742a0454a7907d8516563078c2d8099856d856f1f2710db9",
      "ancestry": [
        "Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`",
        "Ranh giới — điều gì KHÔNG thuộc hợp đồng này"
      ],
      "text": "Đây là lý do CoS gốc của STR46 (bản khai lúc mở backlog) bị thu hẹp có chủ\ný: chỉ vế \"có một spec hợp đồng in/out tự-mô-tả\" là việc của STR46; hai vế\ncòn lại (chiều-ra khởi-xướng, increment terminal/pane) thuộc PBI khác."
    }
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-47",
    "githubAnchor": "unheaded-block-47",
    "stableAnchor": "unheaded-block-47",
    "title": "Unheaded block 47",
    "startLine": 424,
    "endLine": 426,
    "textDigest": "30a3d1465b852976e30a3aad9f6729d1f40caacbc299c7fb07e87ff06d42cff7",
    "sample": "Đây là lý do CoS gốc của STR46 (bản khai lúc mở backlog) bị thu hẹp có chủ\ný: chỉ vế \"có một spec hợp đồng in/out tự-mô-tả\" là việc của STR46; hai vế\ncòn lại (chiều-ra khởi-xướng, ",
    "identityFingerprint": "8bd38f6ba0f85b2d742a0454a7907d8516563078c2d8099856d856f1f2710db9",
    "ancestry": [
      "CLI I/O Contract",
      "11. Scope Boundary"
    ],
    "text": "Đây là lý do CoS gốc của STR46 (bản khai lúc mở backlog) bị thu hẹp có chủ\ný: chỉ vế \"có một spec hợp đồng in/out tự-mô-tả\" là việc của STR46; hai vế\ncòn lại (chiều-ra khởi-xướng, increment terminal/pane) thuộc PBI khác."
  },
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Weak-exact",
    "reason": "ancestor headings differ",
    "targetUnit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-47",
      "githubAnchor": "unheaded-block-47",
      "stableAnchor": "unheaded-block-47",
      "title": "Unheaded block 47",
      "startLine": 424,
      "endLine": 426,
      "textDigest": "30a3d1465b852976e30a3aad9f6729d1f40caacbc299c7fb07e87ff06d42cff7",
      "sample": "Đây là lý do CoS gốc của STR46 (bản khai lúc mở backlog) bị thu hẹp có chủ\ný: chỉ vế \"có một spec hợp đồng in/out tự-mô-tả\" là việc của STR46; hai vế\ncòn lại (chiều-ra khởi-xướng, ",
      "identityFingerprint": "8bd38f6ba0f85b2d742a0454a7907d8516563078c2d8099856d856f1f2710db9",
      "ancestry": [
        "CLI I/O Contract",
        "11. Scope Boundary"
      ],
      "text": "Đây là lý do CoS gốc của STR46 (bản khai lúc mở backlog) bị thu hẹp có chủ\ný: chỉ vế \"có một spec hợp đồng in/out tự-mô-tả\" là việc của STR46; hai vế\ncòn lại (chiều-ra khởi-xướng, increment terminal/pane) thuộc PBI khác."
    }
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_cf56f4a8b7679435c6bf59abd8c23093"
}
```

## Entry claim_deb4b4da2abbc3d6190dfce1c75cabf2

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-io-contract.json",
  "collection": "claims",
  "claimId": "claim_deb4b4da2abbc3d6190dfce1c75cabf2",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "b-io-contract",
  "before": {
    "claimId": "claim_deb4b4da2abbc3d6190dfce1c75cabf2",
    "sourceUnitDigest": "fd7e473ad76cf591e6a132079c9b744fc4a8cfa5672127e446ae7c4f6f323e75",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-47",
    "claimKind": "contract",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover.",
    "authoredBy": "codex-session:unit-run-1792052396770-6f1c5957@2026-10-15",
    "reviewNote": "deep: sampled; legacy io-contract block 29 byte-equal to carrier unheaded-block-47; digests recompute; anchor shift 46->47 from the inserted block 23; before and after target digest equal; disposition promote unchanged from the reviewed decision; anchors, ancestry pass",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-15",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-261015-1526-specs-ui-reworks-main-recarry.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "fd7e473ad76cf591e6a132079c9b744fc4a8cfa5672127e446ae7c4f6f323e75",
    "targetAncestry": [
      "CLI I/O Contract",
      "11. Scope Boundary"
    ],
    "reviewReportCommit": "0e8ce7710ac67ad038927b242b2461876bf8c90d"
  },
  "currentDecision": {
    "claimId": "claim_deb4b4da2abbc3d6190dfce1c75cabf2",
    "sourceUnitDigest": "fd7e473ad76cf591e6a132079c9b744fc4a8cfa5672127e446ae7c4f6f323e75",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-48",
    "claimKind": "contract",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. A31: target paragraph numbering shifted after the new installation-error paragraph; rebound by unique complete prior target digest, preserving the prior referent.",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetUnitDigest": "fd7e473ad76cf591e6a132079c9b744fc4a8cfa5672127e446ae7c4f6f323e75",
    "targetAncestry": [
      "CLI I/O Contract",
      "11. Scope Boundary"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/io-contract.md",
    "unitDigest": "6cd92acba46a3c7426f42a13e11e56a76332f8eec064c096fc0b761fef543213",
    "identityFingerprint": "6cd92acba46a3c7426f42a13e11e56a76332f8eec064c096fc0b761fef543213",
    "claimId": "claim_deb4b4da2abbc3d6190dfce1c75cabf2",
    "sourceAnchor": "unheaded-block-30",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "fd7e473ad76cf591e6a132079c9b744fc4a8cfa5672127e446ae7c4f6f323e75",
    "claimKind": "contract",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-30",
      "githubAnchor": "unheaded-block-30",
      "stableAnchor": "unheaded-block-30",
      "title": "Unheaded block 30",
      "startLine": 204,
      "endLine": 207,
      "textDigest": "fd7e473ad76cf591e6a132079c9b744fc4a8cfa5672127e446ae7c4f6f323e75",
      "sample": "Cũng nằm ngoài: daemon (chưa xây), tách core verb-logic thành lib độc lập\nCLI (prerequisite của kiến trúc daemon tương lai, refactor thuần không đổi\nhành vi), và khối `fgos-discove",
      "identityFingerprint": "6cd92acba46a3c7426f42a13e11e56a76332f8eec064c096fc0b761fef543213",
      "ancestry": [
        "Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`",
        "Ranh giới — điều gì KHÔNG thuộc hợp đồng này"
      ],
      "text": "Cũng nằm ngoài: daemon (chưa xây), tách core verb-logic thành lib độc lập\nCLI (prerequisite của kiến trúc daemon tương lai, refactor thuần không đổi\nhành vi), và khối `fgos-discovered` (giao thức worker→runner, không phải\ncửa ra tới người)."
    }
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-48",
    "githubAnchor": "unheaded-block-48",
    "stableAnchor": "unheaded-block-48",
    "title": "Unheaded block 48",
    "startLine": 428,
    "endLine": 431,
    "textDigest": "fd7e473ad76cf591e6a132079c9b744fc4a8cfa5672127e446ae7c4f6f323e75",
    "sample": "Cũng nằm ngoài: daemon (chưa xây), tách core verb-logic thành lib độc lập\nCLI (prerequisite của kiến trúc daemon tương lai, refactor thuần không đổi\nhành vi), và khối `fgos-discove",
    "identityFingerprint": "6cd92acba46a3c7426f42a13e11e56a76332f8eec064c096fc0b761fef543213",
    "ancestry": [
      "CLI I/O Contract",
      "11. Scope Boundary"
    ],
    "text": "Cũng nằm ngoài: daemon (chưa xây), tách core verb-logic thành lib độc lập\nCLI (prerequisite của kiến trúc daemon tương lai, refactor thuần không đổi\nhành vi), và khối `fgos-discovered` (giao thức worker→runner, không phải\ncửa ra tới người)."
  },
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Weak-exact",
    "reason": "ancestor headings differ",
    "targetUnit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-48",
      "githubAnchor": "unheaded-block-48",
      "stableAnchor": "unheaded-block-48",
      "title": "Unheaded block 48",
      "startLine": 428,
      "endLine": 431,
      "textDigest": "fd7e473ad76cf591e6a132079c9b744fc4a8cfa5672127e446ae7c4f6f323e75",
      "sample": "Cũng nằm ngoài: daemon (chưa xây), tách core verb-logic thành lib độc lập\nCLI (prerequisite của kiến trúc daemon tương lai, refactor thuần không đổi\nhành vi), và khối `fgos-discove",
      "identityFingerprint": "6cd92acba46a3c7426f42a13e11e56a76332f8eec064c096fc0b761fef543213",
      "ancestry": [
        "CLI I/O Contract",
        "11. Scope Boundary"
      ],
      "text": "Cũng nằm ngoài: daemon (chưa xây), tách core verb-logic thành lib độc lập\nCLI (prerequisite của kiến trúc daemon tương lai, refactor thuần không đổi\nhành vi), và khối `fgos-discovered` (giao thức worker→runner, không phải\ncửa ra tới người)."
    }
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_deb4b4da2abbc3d6190dfce1c75cabf2"
}
```

## Entry claim_d802aabd387ae98595c102f0e857f9b1

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-io-contract.json",
  "collection": "claims",
  "claimId": "claim_d802aabd387ae98595c102f0e857f9b1",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "b-io-contract",
  "before": {
    "claimId": "claim_d802aabd387ae98595c102f0e857f9b1",
    "sourceUnitDigest": "7fddf59545c800c11029e0609a32bd908db3409f458829aaf1afecc47bd7f4cf",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-48",
    "claimKind": "navigation",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover.",
    "authoredBy": "codex-session:unit-run-1792052396770-6f1c5957@2026-10-15",
    "reviewNote": "mechanical: legacy io-contract block 30 byte-equal to carrier unheaded-block-48; digests recompute; anchor shift 47->48 from the inserted block 23; before and after target digest equal; disposition promote unchanged from the reviewed decision; anchors, ancestry pass",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-15",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-261015-1526-specs-ui-reworks-main-recarry.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "7fddf59545c800c11029e0609a32bd908db3409f458829aaf1afecc47bd7f4cf",
    "targetAncestry": [
      "CLI I/O Contract",
      "12. References"
    ],
    "reviewReportCommit": "0e8ce7710ac67ad038927b242b2461876bf8c90d"
  },
  "currentDecision": {
    "claimId": "claim_d802aabd387ae98595c102f0e857f9b1",
    "sourceUnitDigest": "7fddf59545c800c11029e0609a32bd908db3409f458829aaf1afecc47bd7f4cf",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-49",
    "claimKind": "navigation",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. A31: target paragraph numbering shifted after the new installation-error paragraph; rebound by unique complete prior target digest, preserving the prior referent.",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried.",
    "targetUnitDigest": "7fddf59545c800c11029e0609a32bd908db3409f458829aaf1afecc47bd7f4cf",
    "targetAncestry": [
      "CLI I/O Contract",
      "12. References"
    ]
  },
  "native": {
    "kind": "units",
    "sourcePath": "docs/io-contract.md",
    "unitDigest": "a7e6134a0d237d4c3430f1d677f25907055cfb0e76bdc47225a0c1da5843c4ff",
    "identityFingerprint": "a7e6134a0d237d4c3430f1d677f25907055cfb0e76bdc47225a0c1da5843c4ff",
    "claimId": "claim_d802aabd387ae98595c102f0e857f9b1",
    "sourceAnchor": "unheaded-block-31",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "7fddf59545c800c11029e0609a32bd908db3409f458829aaf1afecc47bd7f4cf",
    "claimKind": "contract",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-31",
      "githubAnchor": "unheaded-block-31",
      "stableAnchor": "unheaded-block-31",
      "title": "Unheaded block 31",
      "startLine": 211,
      "endLine": 217,
      "textDigest": "7fddf59545c800c11029e0609a32bd908db3409f458829aaf1afecc47bd7f4cf",
      "sample": "`docs/decisions/0014-kien-truc-giao-tiep-nguoi-fgos.md` (kiến trúc cửa) ·\n`docs/decisions/0011-version-tuong-minh-cho-moi-contract.md` (version) ·\n`docs/specs/work-state.md` §envel",
      "identityFingerprint": "a7e6134a0d237d4c3430f1d677f25907055cfb0e76bdc47225a0c1da5843c4ff",
      "ancestry": [
        "Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`",
        "Tham chiếu"
      ],
      "text": "`docs/decisions/0014-kien-truc-giao-tiep-nguoi-fgos.md` (kiến trúc cửa) ·\n`docs/decisions/0011-version-tuong-minh-cho-moi-contract.md` (version) ·\n`docs/specs/work-state.md` §envelope, §Sổ verb máy-đọc, §Danh tính người\nghi (chi tiết trường/hành vi) · `docs/specs/runner.md` RUL61 (envelope\nstdout runner) · `docs/architecture-map.md` CTR001/CTR003/CTR004 (sổ đăng\nký contract) · `docs/history/str46-io-contract/` (CONTEXT.md 37 quyết định\nkhoá, plan.md bốn lát)."
    }
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-49",
    "githubAnchor": "unheaded-block-49",
    "stableAnchor": "unheaded-block-49",
    "title": "Unheaded block 49",
    "startLine": 435,
    "endLine": 441,
    "textDigest": "7fddf59545c800c11029e0609a32bd908db3409f458829aaf1afecc47bd7f4cf",
    "sample": "`docs/decisions/0014-kien-truc-giao-tiep-nguoi-fgos.md` (kiến trúc cửa) ·\n`docs/decisions/0011-version-tuong-minh-cho-moi-contract.md` (version) ·\n`docs/specs/work-state.md` §envel",
    "identityFingerprint": "a7e6134a0d237d4c3430f1d677f25907055cfb0e76bdc47225a0c1da5843c4ff",
    "ancestry": [
      "CLI I/O Contract",
      "12. References"
    ],
    "text": "`docs/decisions/0014-kien-truc-giao-tiep-nguoi-fgos.md` (kiến trúc cửa) ·\n`docs/decisions/0011-version-tuong-minh-cho-moi-contract.md` (version) ·\n`docs/specs/work-state.md` §envelope, §Sổ verb máy-đọc, §Danh tính người\nghi (chi tiết trường/hành vi) · `docs/specs/runner.md` RUL61 (envelope\nstdout runner) · `docs/architecture-map.md` CTR001/CTR003/CTR004 (sổ đăng\nký contract) · `docs/history/str46-io-contract/` (CONTEXT.md 37 quyết định\nkhoá, plan.md bốn lát)."
  },
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Weak-exact",
    "reason": "ancestor headings differ",
    "targetUnit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-49",
      "githubAnchor": "unheaded-block-49",
      "stableAnchor": "unheaded-block-49",
      "title": "Unheaded block 49",
      "startLine": 435,
      "endLine": 441,
      "textDigest": "7fddf59545c800c11029e0609a32bd908db3409f458829aaf1afecc47bd7f4cf",
      "sample": "`docs/decisions/0014-kien-truc-giao-tiep-nguoi-fgos.md` (kiến trúc cửa) ·\n`docs/decisions/0011-version-tuong-minh-cho-moi-contract.md` (version) ·\n`docs/specs/work-state.md` §envel",
      "identityFingerprint": "a7e6134a0d237d4c3430f1d677f25907055cfb0e76bdc47225a0c1da5843c4ff",
      "ancestry": [
        "CLI I/O Contract",
        "12. References"
      ],
      "text": "`docs/decisions/0014-kien-truc-giao-tiep-nguoi-fgos.md` (kiến trúc cửa) ·\n`docs/decisions/0011-version-tuong-minh-cho-moi-contract.md` (version) ·\n`docs/specs/work-state.md` §envelope, §Sổ verb máy-đọc, §Danh tính người\nghi (chi tiết trường/hành vi) · `docs/specs/runner.md` RUL61 (envelope\nstdout runner) · `docs/architecture-map.md` CTR001/CTR003/CTR004 (sổ đăng\nký contract) · `docs/history/str46-io-contract/` (CONTEXT.md 37 quyết định\nkhoá, plan.md bốn lát)."
    }
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_d802aabd387ae98595c102f0e857f9b1"
}
```

## Entry claim_19495d2772ced1aa1af4b20d4640fa3a

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-io-contract.json",
  "collection": "registryGaps",
  "claimId": "claim_19495d2772ced1aa1af4b20d4640fa3a",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "b-io-contract",
  "before": {
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
  "currentDecision": {
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
  "native": {
    "kind": "identityGaps",
    "sourcePath": "docs/io-contract.md",
    "unitDigest": "3edee75356be0e07df3fad29a0969781fa982e0b5c30d8844e162533fa887841",
    "identityFingerprint": "3edee75356be0e07df3fad29a0969781fa982e0b5c30d8844e162533fa887841",
    "claimId": "claim_19495d2772ced1aa1af4b20d4640fa3a",
    "sourceAnchor": "unheaded-block-18",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "83773dda67db8d5f71205bb8c7106186023672125b08cbe4f33b09b0578163ca",
    "claimKind": "contract",
    "status": "current",
    "identityStatus": "identity-gap",
    "gapReason": "edited unit whose anchor unheaded-block-18 is not a stable heading anchor"
  },
  "sourceWitness": {
    "commit": "3ea75475d911ca02c9d8b5011dca4f748cc5820f",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-18",
      "githubAnchor": "unheaded-block-18",
      "stableAnchor": "unheaded-block-18",
      "title": "Unheaded block 18",
      "startLine": 122,
      "endLine": 125,
      "textDigest": "83773dda67db8d5f71205bb8c7106186023672125b08cbe4f33b09b0578163ca",
      "sample": "`fgos --help --json` trả `{schema_version, commands: […]}` — CLI công bố\ntoàn bộ mặt verb để một listener/giao diện **sinh** khung lệnh từ manifest\nthay vì hard-code từng verb. `sc",
      "identityFingerprint": "3edee75356be0e07df3fad29a0969781fa982e0b5c30d8844e162533fa887841",
      "ancestry": [
        "Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`",
        "Sổ verb máy-đọc — CLI tự mô tả"
      ],
      "text": "`fgos --help --json` trả `{schema_version, commands: […]}` — CLI công bố\ntoàn bộ mặt verb để một listener/giao diện **sinh** khung lệnh từ manifest\nthay vì hard-code từng verb. `schema_version` hiện `'2.0'` (tăng từ `'1.0'`\nvì trường `access` bị xoá). Mỗi mục verb mang:"
    }
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
  "sourceTargetDigestsUnequal": true,
  "classObservation": {
    "class": "Judgment",
    "reason": "no target digest match",
    "targetUnit": null
  },
  "mechanicalRequired": true,
  "deepRequired": true,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_19495d2772ced1aa1af4b20d4640fa3a"
}
```

## Entry claim_e2377849e4ba8e3d3beaf70880e4ed23

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-io-contract.json",
  "collection": "registryGaps",
  "claimId": "claim_e2377849e4ba8e3d3beaf70880e4ed23",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "b-io-contract",
  "before": {
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
  "currentDecision": {
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
  "native": {
    "kind": "identityGaps",
    "sourcePath": "docs/io-contract.md",
    "unitDigest": "6b0f42533c4fbfd6b576f52b1115cc0f8067f63c26b1dd14f1030d857dfa5289",
    "identityFingerprint": "6b0f42533c4fbfd6b576f52b1115cc0f8067f63c26b1dd14f1030d857dfa5289",
    "claimId": "claim_e2377849e4ba8e3d3beaf70880e4ed23",
    "sourceAnchor": "unheaded-block-19",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "39e4ab1f30a6acc99de534a9fd16bd348b9ef8c1827664c0a7a50487f0587c0c",
    "claimKind": "contract",
    "status": "current",
    "identityStatus": "identity-gap",
    "gapReason": "edited unit whose anchor unheaded-block-19 is not a stable heading anchor"
  },
  "sourceWitness": {
    "commit": "3ea75475d911ca02c9d8b5011dca4f748cc5820f",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-19",
      "githubAnchor": "unheaded-block-19",
      "stableAnchor": "unheaded-block-19",
      "title": "Unheaded block 19",
      "startLine": 127,
      "endLine": 137,
      "textDigest": "39e4ab1f30a6acc99de534a9fd16bd348b9ef8c1827664c0a7a50487f0587c0c",
      "sample": "- `name`, cách gọi, mô tả một dòng, lược đồ tham số, ví dụ, `deprecated`\n  (null hoặc chuỗi hướng dẫn deprecation; CLI renderer cũng chấp nhận metadata\n  cấu trúc để không rò `unde",
      "identityFingerprint": "6b0f42533c4fbfd6b576f52b1115cc0f8067f63c26b1dd14f1030d857dfa5289",
      "ancestry": [
        "Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`",
        "Sổ verb máy-đọc — CLI tự mô tả"
      ],
      "text": "- `name`, cách gọi, mô tả một dòng, lược đồ tham số, ví dụ, `deprecated`\n  (null hoặc chuỗi hướng dẫn deprecation; CLI renderer cũng chấp nhận metadata\n  cấu trúc để không rò `undefined`/`[object Object]` nếu schema tương lai mở rộng).\n- **`touchesState`** (verb có bao giờ ghi trạng thái fgOS) và\n  **`externalEffect`** (verb có bao giờ gọi dịch vụ ngoài fgOS) — hai trục\n  độc lập thay cho `access` cũ (từng gộp hai câu hỏi vào một giá trị,\n  sai cho `review`: nó khai `mutation` chỉ vì `--github` tạo PR thật, dù\n  bản thân `review` không hề ghi trạng thái). Xem `fgos --help --json` cho\n  danh sách hiện hành mang `externalEffect: true` (ví dụ `review`, `approve`,\n  `coordination` — dispatch executor thật tính là effect ngoài `.fgos/`).\n- `paginated` (xem trên) và `multiValueFormat` (dưới) khi áp dụng."
    }
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
  "sourceTargetDigestsUnequal": true,
  "classObservation": {
    "class": "Judgment",
    "reason": "no target digest match",
    "targetUnit": null
  },
  "mechanicalRequired": true,
  "deepRequired": true,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_e2377849e4ba8e3d3beaf70880e4ed23"
}
```

## Entry claim_2fa062c56cf4226e8519e768a5b5cab4

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-io-contract.json",
  "collection": "registryGaps",
  "claimId": "claim_2fa062c56cf4226e8519e768a5b5cab4",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "b-io-contract",
  "before": {
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
  "currentDecision": {
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
  "native": {
    "kind": "identityGaps",
    "sourcePath": "docs/io-contract.md",
    "unitDigest": "5aa9793717abeaa7e01416264ae6e44c05dfe04fb53b9130dc19c3cfff99cb0f",
    "identityFingerprint": "5aa9793717abeaa7e01416264ae6e44c05dfe04fb53b9130dc19c3cfff99cb0f",
    "claimId": "claim_2fa062c56cf4226e8519e768a5b5cab4",
    "sourceAnchor": "unheaded-block-13",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "3727b3fa0ee79f8b0b38d0e9fc868e336e85f10e12f7dbd47a34d140f3681127",
    "claimKind": "contract",
    "status": "current",
    "identityStatus": "identity-gap",
    "gapReason": "edited unit whose anchor unheaded-block-13 is not a stable heading anchor"
  },
  "sourceWitness": {
    "commit": "bc7bb3f009445b5f71875b7897d676a23d9daa47",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-13",
      "githubAnchor": "unheaded-block-13",
      "stableAnchor": "unheaded-block-13",
      "title": "Unheaded block 13",
      "startLine": 75,
      "endLine": 79,
      "textDigest": "3727b3fa0ee79f8b0b38d0e9fc868e336e85f10e12f7dbd47a34d140f3681127",
      "sample": "`src/state/store.mjs`'s `EXIT_CODES` (2 precondition [bao gồm not-found / run-not-found / missing-run] · 3 conflict ·\n4 validation · 5 corrupt-log · 7 lock-timeout · 8 session-fail",
      "identityFingerprint": "5aa9793717abeaa7e01416264ae6e44c05dfe04fb53b9130dc19c3cfff99cb0f",
      "ancestry": [
        "Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`",
        "Chiều ra — envelope thống nhất",
        "Mã thoát (exit code) — một nguồn duy nhất"
      ],
      "text": "`src/state/store.mjs`'s `EXIT_CODES` (2 precondition [bao gồm not-found / run-not-found / missing-run] · 3 conflict ·\n4 validation · 5 corrupt-log · 7 lock-timeout · 8 session-fail ·\n9 merge-fail) cộng `src/runner/loop.mjs`'s `EXIT_BUSY` (6, riêng của\nrunner) là bảng DUY NHẤT. 0 = ok, 1 = bất ngờ (mọi thứ chưa phân loại).\nConsumer rẽ nhánh theo mã thoát phạm trù, không bao giờ theo thông điệp."
    }
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-22",
    "githubAnchor": "unheaded-block-22",
    "stableAnchor": "unheaded-block-22",
    "title": "Unheaded block 22",
    "startLine": 181,
    "endLine": 184,
    "textDigest": "bdeca0144b587f826ce46ea61d3be2e882ad021614d1e5f7c14cf2982573f056",
    "sample": "**Nhận diện một phong bì thật:** parse một dòng stdout ra JSON rồi kiểm\n`contract === 'fgos.v1'` — KHÔNG BAO GIỜ bằng heuristic văn bản (vd \"dòng\nbắt đầu bằng `{`\"), vì luồng progr",
    "identityFingerprint": "ba5e63678191dc9c6bae6aa99c65efd2c8f670d3dd9b38c8aaee891fe5787197",
    "ancestry": [
      "CLI I/O Contract",
      "3. Output Direction Unified Envelope",
      "Recognizing A Real Envelope"
    ],
    "text": "**Nhận diện một phong bì thật:** parse một dòng stdout ra JSON rồi kiểm\n`contract === 'fgos.v1'` — KHÔNG BAO GIỜ bằng heuristic văn bản (vd \"dòng\nbắt đầu bằng `{`\"), vì luồng progress-trace của `fgos-runner` (xem \"Ngoại\nlệ có lý do\" dưới) có thể tự chứa output của trợ lý bắt đầu bằng `{`."
  },
  "sourceTargetDigestsUnequal": true,
  "classObservation": {
    "class": "Judgment",
    "reason": "no target digest match",
    "targetUnit": null
  },
  "mechanicalRequired": true,
  "deepRequired": true,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_2fa062c56cf4226e8519e768a5b5cab4"
}
```

## Entry claim_0a800ae3d8a50ecdf22bf6c4604167d5

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-closing-instructions.json",
  "collection": "claims",
  "claimId": "claim_0a800ae3d8a50ecdf22bf6c4604167d5",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "s10-closing-instructions",
  "before": {
    "claimId": "claim_0a800ae3d8a50ecdf22bf6c4604167d5",
    "sourceUnitDigest": "e51ed959e5aae86e5f000c44f5ef903c202b286098b279fb9e892f8db3a0c1d3",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792076952136-42ac8e36@2026-10-15",
    "rationale": "L10-3: retain AGENTS.md#always-do as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 515c0ae74369b29716645859cb36c1312aa0ecbf4602213b897d0bdee2ed537c, pinned at 980cb29312b8701f5ea639278f44e1a57a6e5c02."
  },
  "currentDecision": {
    "claimId": "claim_0a800ae3d8a50ecdf22bf6c4604167d5",
    "sourceUnitDigest": "e51ed959e5aae86e5f000c44f5ef903c202b286098b279fb9e892f8db3a0c1d3",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "L10-3: retain AGENTS.md#always-do as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f, pinned at 59b9b70876324e07135db53d2351f7db6a7e1746. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried."
  },
  "native": {
    "kind": "units",
    "sourcePath": "AGENTS.md",
    "unitDigest": "e7fc714a9a73a84cbd1d93c998bc3f55888c9b537891eb0b0caf9771fb8cde98",
    "identityFingerprint": "c869c48c9abaf53e8f0d5566184b23c92991743b2b6726980b3111dafc540cd4",
    "claimId": "claim_0a800ae3d8a50ecdf22bf6c4604167d5",
    "sourceAnchor": "always-do",
    "unitKind": "heading",
    "sourceUnitDigest": "e51ed959e5aae86e5f000c44f5ef903c202b286098b279fb9e892f8db3a0c1d3",
    "claimKind": "unclassified",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "heading",
      "level": 2,
      "title": "Always Do",
      "anchor": "always-do",
      "githubAnchor": "always-do",
      "stableAnchor": "h-7851705f0b6d",
      "startLine": 219,
      "endLine": 219,
      "textDigest": "e51ed959e5aae86e5f000c44f5ef903c202b286098b279fb9e892f8db3a0c1d3",
      "sample": "Always Do",
      "sectionPayloadDigest": "e23a5ee9ace2850ec670037d92a358e58770bdd73439c4234c7c5b9f40e24c22",
      "followingBlockDigest": "e23a5ee9ace2850ec670037d92a358e58770bdd73439c4234c7c5b9f40e24c22",
      "identityFingerprint": "c869c48c9abaf53e8f0d5566184b23c92991743b2b6726980b3111dafc540cd4",
      "ancestry": [
        "GitNexus — Code Intelligence"
      ],
      "text": "## Always Do",
      "sectionText": "## Always Do\n\n- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `impact({target: \"symbolName\", direction: \"upstream\"})` and report the blast radius (direct callers, affected processes, risk level) to the user.\n- **MUST run `detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows. For regression review, compare against the default branch: `detect_changes({scope: \"compare\", base_ref: \"main\"})`.\n- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.\n- When exploring unfamiliar code, use `query({search_query: \"concept\"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.\n- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `context({name: \"symbolName\"})`.\n- For security review, `explain({target: \"fileOrSymbol\"})` lists taint findings (source→sink flows; needs `analyze --pdg`)."
    }
  },
  "currentTarget": null,
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Judgment",
    "reason": "outside-platform navigation or instruction decision; no carriage target"
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_0a800ae3d8a50ecdf22bf6c4604167d5"
}
```

## Entry claim_fa3bda92497320da1952eb67f4d954ef

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-closing-instructions.json",
  "collection": "claims",
  "claimId": "claim_fa3bda92497320da1952eb67f4d954ef",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "s10-closing-instructions",
  "before": {
    "claimId": "claim_fa3bda92497320da1952eb67f4d954ef",
    "sourceUnitDigest": "8e8826de669f94e45cffc5920f71ccb772d818f5b1651501ca305f53124acf35",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792076952136-42ac8e36@2026-10-15",
    "rationale": "L10-3: retain AGENTS.md#before-touching-code as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 515c0ae74369b29716645859cb36c1312aa0ecbf4602213b897d0bdee2ed537c, pinned at 980cb29312b8701f5ea639278f44e1a57a6e5c02."
  },
  "currentDecision": {
    "claimId": "claim_fa3bda92497320da1952eb67f4d954ef",
    "sourceUnitDigest": "8e8826de669f94e45cffc5920f71ccb772d818f5b1651501ca305f53124acf35",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "L10-3: retain AGENTS.md#before-touching-code as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f, pinned at 59b9b70876324e07135db53d2351f7db6a7e1746. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried."
  },
  "native": {
    "kind": "units",
    "sourcePath": "AGENTS.md",
    "unitDigest": "9de1b1241ef403eadd82f74614ceb84b29fa92d787cd492004fdc7b6968d3dac",
    "identityFingerprint": "b1291c96e28472dec7f8f53799be8bffe8985cf97b31f1079e39c740fb991242",
    "claimId": "claim_fa3bda92497320da1952eb67f4d954ef",
    "sourceAnchor": "before-touching-code",
    "unitKind": "heading",
    "sourceUnitDigest": "8e8826de669f94e45cffc5920f71ccb772d818f5b1651501ca305f53124acf35",
    "claimKind": "unclassified",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "heading",
      "level": 2,
      "title": "Before touching code",
      "anchor": "before-touching-code",
      "githubAnchor": "before-touching-code",
      "stableAnchor": "h-b06af558e03c",
      "startLine": 37,
      "endLine": 37,
      "textDigest": "8e8826de669f94e45cffc5920f71ccb772d818f5b1651501ca305f53124acf35",
      "sample": "Before touching code",
      "sectionPayloadDigest": "5156b1a159ea85fd1d9648644bd16f20345fa3a0645bf21e781010edd54a0dea",
      "followingBlockDigest": "4c9c8cc9ca45762d287d773c9625e674f5eed86e549fceb7f42325667a575d80",
      "identityFingerprint": "b1291c96e28472dec7f8f53799be8bffe8985cf97b31f1079e39c740fb991242",
      "ancestry": [
        "forgent"
      ],
      "text": "## Before touching code",
      "sectionText": "## Before touching code\n\nRead `docs/specs/reading-map.md`, then the area spec under `docs/specs/` for whatever\nyou're about to change. Specs are the state layer — BA-grade, tech-agnostic — read\nthe spec before the code.\n\n**Prior art before design.** Before designing a mechanism, find out what already existed\nand why it went away: `git log -S'<symbol>'` / `-G` on the symbol, config key and spec term,\nalso under the executor ids and names the thing had before the renames (ids were renamed and\ndormant ones deleted), and read the area spec's \"Lịch sử quyết định\" and settled-facts\nsections. A plan's facts phase answers \"what existed before, and which change removed it,\nand was that intended?\" next to its questions about current code. Reuse or extend what is\nfound; say in the plan what was reused and what was missing.\n**Convention paths.** For report, plan, and journal names and locations—including paths placed in briefs for other agents—use `fgos convention name|path --json`, never construct them; parallel agents MUST choose distinct slugs, and pre-commit `convention check` warnings do not block commits."
    }
  },
  "currentTarget": null,
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Judgment",
    "reason": "outside-platform navigation or instruction decision; no carriage target"
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_fa3bda92497320da1952eb67f4d954ef"
}
```

## Entry claim_00ee16658d1baf1ac05b8e371408fd01

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-closing-instructions.json",
  "collection": "claims",
  "claimId": "claim_00ee16658d1baf1ac05b8e371408fd01",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "s10-closing-instructions",
  "before": {
    "claimId": "claim_00ee16658d1baf1ac05b8e371408fd01",
    "sourceUnitDigest": "52fb0a5c25e6db85488c58b5926c5346395ba8cfdeb8a8bc42d14336424b38dd",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792076952136-42ac8e36@2026-10-15",
    "rationale": "L10-3: retain AGENTS.md#changing-a-locked-law as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 515c0ae74369b29716645859cb36c1312aa0ecbf4602213b897d0bdee2ed537c, pinned at 980cb29312b8701f5ea639278f44e1a57a6e5c02."
  },
  "currentDecision": {
    "claimId": "claim_00ee16658d1baf1ac05b8e371408fd01",
    "sourceUnitDigest": "52fb0a5c25e6db85488c58b5926c5346395ba8cfdeb8a8bc42d14336424b38dd",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "L10-3: retain AGENTS.md#changing-a-locked-law as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f, pinned at 59b9b70876324e07135db53d2351f7db6a7e1746. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried."
  },
  "native": {
    "kind": "units",
    "sourcePath": "AGENTS.md",
    "unitDigest": "93017f7499889ed3adbc83ef2718abca2283dfa02243c88e8cf8e9d0bdce2c17",
    "identityFingerprint": "a3c1ea9b5b6b0a3e4323e71b6d24f6f6b6e8bdb0c40503ef33f1692ffb268add",
    "claimId": "claim_00ee16658d1baf1ac05b8e371408fd01",
    "sourceAnchor": "changing-a-locked-law",
    "unitKind": "heading",
    "sourceUnitDigest": "52fb0a5c25e6db85488c58b5926c5346395ba8cfdeb8a8bc42d14336424b38dd",
    "claimKind": "unclassified",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "heading",
      "level": 2,
      "title": "Changing a locked law",
      "anchor": "changing-a-locked-law",
      "githubAnchor": "changing-a-locked-law",
      "stableAnchor": "h-055a54753f87",
      "startLine": 133,
      "endLine": 133,
      "textDigest": "52fb0a5c25e6db85488c58b5926c5346395ba8cfdeb8a8bc42d14336424b38dd",
      "sample": "Changing a locked law",
      "sectionPayloadDigest": "d8b0fa240f28f96e7b3f9f24704c72a898d7b0d64a37662d2179c5f0c7216a71",
      "followingBlockDigest": "d8b0fa240f28f96e7b3f9f24704c72a898d7b0d64a37662d2179c5f0c7216a71",
      "identityFingerprint": "a3c1ea9b5b6b0a3e4323e71b6d24f6f6b6e8bdb0c40503ef33f1692ffb268add",
      "ancestry": [
        "forgent"
      ],
      "text": "## Changing a locked law",
      "sectionText": "## Changing a locked law\n\nLaws in `docs/platform-foundations.md` are fixed until their named review\nthreshold is hit. Changing one supersedes its decision ID — never edit it in place."
    }
  },
  "currentTarget": null,
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Judgment",
    "reason": "outside-platform navigation or instruction decision; no carriage target"
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_00ee16658d1baf1ac05b8e371408fd01"
}
```

## Entry claim_7b36640f7d6ced0d3f089a419f5d26ff

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-closing-instructions.json",
  "collection": "claims",
  "claimId": "claim_7b36640f7d6ced0d3f089a419f5d26ff",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "s10-closing-instructions",
  "before": {
    "claimId": "claim_7b36640f7d6ced0d3f089a419f5d26ff",
    "sourceUnitDigest": "ed59f3cfa95f9a1572033e2cafba1fc7e0a12ae65bec9ca0e8740ca99ff2261e",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792076952136-42ac8e36@2026-10-15",
    "rationale": "L10-3: retain AGENTS.md#cli as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 515c0ae74369b29716645859cb36c1312aa0ecbf4602213b897d0bdee2ed537c, pinned at 980cb29312b8701f5ea639278f44e1a57a6e5c02."
  },
  "currentDecision": {
    "claimId": "claim_7b36640f7d6ced0d3f089a419f5d26ff",
    "sourceUnitDigest": "ed59f3cfa95f9a1572033e2cafba1fc7e0a12ae65bec9ca0e8740ca99ff2261e",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "L10-3: retain AGENTS.md#cli as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f, pinned at 59b9b70876324e07135db53d2351f7db6a7e1746. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried."
  },
  "native": {
    "kind": "units",
    "sourcePath": "AGENTS.md",
    "unitDigest": "f4d3636f9a037f355fde489879d19dd6cfa50b39b98d44e4d741fc04b2cc8e21",
    "identityFingerprint": "0faf8e782d75a0c1cbc8c3aedfd14a39cb946e0444b318605efd05d7c1ea2fc3",
    "claimId": "claim_7b36640f7d6ced0d3f089a419f5d26ff",
    "sourceAnchor": "cli",
    "unitKind": "heading",
    "sourceUnitDigest": "ed59f3cfa95f9a1572033e2cafba1fc7e0a12ae65bec9ca0e8740ca99ff2261e",
    "claimKind": "unclassified",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "heading",
      "level": 2,
      "title": "CLI",
      "anchor": "cli",
      "githubAnchor": "cli",
      "stableAnchor": "h-4fc3d3c7fcef",
      "startLine": 244,
      "endLine": 244,
      "textDigest": "ed59f3cfa95f9a1572033e2cafba1fc7e0a12ae65bec9ca0e8740ca99ff2261e",
      "sample": "CLI",
      "sectionPayloadDigest": "e2fffb19db664dbd8503e4c376974a3ffeb814760f3d7680221b615ec1e02003",
      "followingBlockDigest": "8ca4c5c61c7f369a197d6118f0a325cc39727dbc792d3c53b1c2b1dd2aa7648a",
      "identityFingerprint": "0faf8e782d75a0c1cbc8c3aedfd14a39cb946e0444b318605efd05d7c1ea2fc3",
      "ancestry": [
        "GitNexus — Code Intelligence"
      ],
      "text": "## CLI",
      "sectionText": "## CLI\n\n| Task | Read this skill file |\n|------|---------------------|\n| Understand architecture / \"How does X work?\" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |\n| Blast radius / \"What breaks if I change X?\" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |\n| Trace bugs / \"Why is X failing?\" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |\n| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |\n| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |\n| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |\n\n<!-- gitnexus:end -->\n\n<!-- fgos:instruction-projection:start -->\n<!-- generated by fgos instruction projection; edit canonical instruction sources, not this block -->\n<!-- effective-set: .fgos/instructions/effective/repo.json; key=repo; host=* -->"
    }
  },
  "currentTarget": null,
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Judgment",
    "reason": "outside-platform navigation or instruction decision; no carriage target"
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_7b36640f7d6ced0d3f089a419f5d26ff"
}
```

## Entry claim_a700bf68bba6456dc5d22693e0a42ff4

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-closing-instructions.json",
  "collection": "claims",
  "claimId": "claim_a700bf68bba6456dc5d22693e0a42ff4",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "s10-closing-instructions",
  "before": {
    "claimId": "claim_a700bf68bba6456dc5d22693e0a42ff4",
    "sourceUnitDigest": "e1f3e3fd66dbac0da5125fc9c981101e44757f5b285e6fe0d6b083c9a28cdb42",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792076952136-42ac8e36@2026-10-15",
    "rationale": "L10-3: retain AGENTS.md#decision-question-template as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 515c0ae74369b29716645859cb36c1312aa0ecbf4602213b897d0bdee2ed537c, pinned at 980cb29312b8701f5ea639278f44e1a57a6e5c02."
  },
  "currentDecision": {
    "claimId": "claim_a700bf68bba6456dc5d22693e0a42ff4",
    "sourceUnitDigest": "e1f3e3fd66dbac0da5125fc9c981101e44757f5b285e6fe0d6b083c9a28cdb42",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "L10-3: retain AGENTS.md#decision-question-template as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f, pinned at 59b9b70876324e07135db53d2351f7db6a7e1746. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried."
  },
  "native": {
    "kind": "units",
    "sourcePath": "AGENTS.md",
    "unitDigest": "cd15c048c6a853f2c487a4f71f984c8f69b17371f0ddc86856a7bfe6c3905811",
    "identityFingerprint": "51d1919097cdb97874b7d2d607d209fa4442b27bc286cbd35a0d9caff5eb9645",
    "claimId": "claim_a700bf68bba6456dc5d22693e0a42ff4",
    "sourceAnchor": "decision-question-template",
    "unitKind": "heading",
    "sourceUnitDigest": "e1f3e3fd66dbac0da5125fc9c981101e44757f5b285e6fe0d6b083c9a28cdb42",
    "claimKind": "decision",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "heading",
      "level": 4,
      "title": "Decision Question Template",
      "anchor": "decision-question-template",
      "githubAnchor": "decision-question-template",
      "stableAnchor": "h-8e3193aaa4eb",
      "startLine": 265,
      "endLine": 265,
      "textDigest": "e1f3e3fd66dbac0da5125fc9c981101e44757f5b285e6fe0d6b083c9a28cdb42",
      "sample": "Decision Question Template",
      "sectionPayloadDigest": "a412a2f5e102f17d8b6b108830fed27c29021381ac59ea9695c43d604e1a6570",
      "followingBlockDigest": "a412a2f5e102f17d8b6b108830fed27c29021381ac59ea9695c43d604e1a6570",
      "identityFingerprint": "51d1919097cdb97874b7d2d607d209fa4442b27bc286cbd35a0d9caff5eb9645",
      "ancestry": [
        "GitNexus — Code Intelligence",
        "fgOS Effective Instructions",
        "law"
      ],
      "text": "#### Decision Question Template",
      "sectionText": "#### Decision Question Template\n\n- id: `decision-question-template`\n- source: `core/instructions/decision-question.md`"
    }
  },
  "currentTarget": null,
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Judgment",
    "reason": "outside-platform navigation or instruction decision; no carriage target"
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_a700bf68bba6456dc5d22693e0a42ff4"
}
```

## Entry claim_e922726b8953ed0cc00db6c4cdad3b48

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-closing-instructions.json",
  "collection": "claims",
  "claimId": "claim_e922726b8953ed0cc00db6c4cdad3b48",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "s10-closing-instructions",
  "before": {
    "claimId": "claim_e922726b8953ed0cc00db6c4cdad3b48",
    "sourceUnitDigest": "0083e74994df923befc95fcd51a367519f38136583b1b5af81b103a14f77ad0c",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792076952136-42ac8e36@2026-10-15",
    "rationale": "L10-3: retain AGENTS.md#decision-question-template-1 as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 515c0ae74369b29716645859cb36c1312aa0ecbf4602213b897d0bdee2ed537c, pinned at 980cb29312b8701f5ea639278f44e1a57a6e5c02."
  },
  "currentDecision": {
    "claimId": "claim_e922726b8953ed0cc00db6c4cdad3b48",
    "sourceUnitDigest": "0083e74994df923befc95fcd51a367519f38136583b1b5af81b103a14f77ad0c",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "L10-3: retain AGENTS.md#decision-question-template-1 as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f, pinned at 59b9b70876324e07135db53d2351f7db6a7e1746. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried."
  },
  "native": {
    "kind": "units",
    "sourcePath": "AGENTS.md",
    "unitDigest": "d15b9adab02129db231b0c66a0ab64e06e6456c28f08620647e22732f1da0b6e",
    "identityFingerprint": "c5d92e9611e773253acb3248d087caa5abab3806f1638839c62e3c85cb49d69d",
    "claimId": "claim_e922726b8953ed0cc00db6c4cdad3b48",
    "sourceAnchor": "decision-question-template-1",
    "unitKind": "heading",
    "sourceUnitDigest": "0083e74994df923befc95fcd51a367519f38136583b1b5af81b103a14f77ad0c",
    "claimKind": "decision",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "heading",
      "level": 1,
      "title": "Decision Question Template",
      "anchor": "decision-question-template-1",
      "githubAnchor": "decision-question-template-1",
      "stableAnchor": "h-731347805dd9",
      "startLine": 270,
      "endLine": 270,
      "textDigest": "0083e74994df923befc95fcd51a367519f38136583b1b5af81b103a14f77ad0c",
      "sample": "Decision Question Template",
      "sectionPayloadDigest": "1297672f2b5e8ad757858b4c7e8e54e6713cabadc7461f2f561b92e4e17bb16e",
      "followingBlockDigest": "1297672f2b5e8ad757858b4c7e8e54e6713cabadc7461f2f561b92e4e17bb16e",
      "identityFingerprint": "c5d92e9611e773253acb3248d087caa5abab3806f1638839c62e3c85cb49d69d",
      "ancestry": [],
      "text": "# Decision Question Template",
      "sectionText": "# Decision Question Template\n\nEvery question asking the owner to choose a direction carries five parts: what is happening, cause, options with cost, recommendation, and scope of the answer. Full template: `core/skills/_shared/decision-question.md`. Inside the approved frame (scope + budget set at approval) decide and report; about to leave it, stop and ask in this template."
    }
  },
  "currentTarget": null,
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Judgment",
    "reason": "outside-platform navigation or instruction decision; no carriage target"
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_e922726b8953ed0cc00db6c4cdad3b48"
}
```

## Entry claim_22c44c85aa5a35949e59c1fa1a36bd1a

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-closing-instructions.json",
  "collection": "claims",
  "claimId": "claim_22c44c85aa5a35949e59c1fa1a36bd1a",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "s10-closing-instructions",
  "before": {
    "claimId": "claim_22c44c85aa5a35949e59c1fa1a36bd1a",
    "sourceUnitDigest": "660e492187a6eb5ca8607cfa85b81c83daaaa7ac5d7fd2c5e553f20d3db084f6",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792076952136-42ac8e36@2026-10-15",
    "rationale": "L10-3: retain AGENTS.md#definition-of-done-platform-foundations-l5 as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 515c0ae74369b29716645859cb36c1312aa0ecbf4602213b897d0bdee2ed537c, pinned at 980cb29312b8701f5ea639278f44e1a57a6e5c02."
  },
  "currentDecision": {
    "claimId": "claim_22c44c85aa5a35949e59c1fa1a36bd1a",
    "sourceUnitDigest": "660e492187a6eb5ca8607cfa85b81c83daaaa7ac5d7fd2c5e553f20d3db084f6",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "L10-3: retain AGENTS.md#definition-of-done-platform-foundations-l5 as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f, pinned at 59b9b70876324e07135db53d2351f7db6a7e1746. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried."
  },
  "native": {
    "kind": "units",
    "sourcePath": "AGENTS.md",
    "unitDigest": "30f6e72edbe2a3bfe7a18e984297bfd4e32ae43afcdd28a014fae6fcd6f4edf7",
    "identityFingerprint": "0756c7cf80fcc132917ea5a31778087b175b99d1710bf3ac2762db8ebf8a3bd0",
    "claimId": "claim_22c44c85aa5a35949e59c1fa1a36bd1a",
    "sourceAnchor": "definition-of-done-platform-foundations-l5",
    "unitKind": "heading",
    "sourceUnitDigest": "660e492187a6eb5ca8607cfa85b81c83daaaa7ac5d7fd2c5e553f20d3db084f6",
    "claimKind": "unclassified",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "heading",
      "level": 2,
      "title": "Definition of done (platform-foundations L5)",
      "anchor": "definition-of-done-platform-foundations-l5",
      "githubAnchor": "definition-of-done-platform-foundations-l5",
      "stableAnchor": "h-907e08faa8b0",
      "startLine": 52,
      "endLine": 52,
      "textDigest": "660e492187a6eb5ca8607cfa85b81c83daaaa7ac5d7fd2c5e553f20d3db084f6",
      "sample": "Definition of done (platform-foundations L5)",
      "sectionPayloadDigest": "e1ea0ee8f64de13392ecb2737536248aee607ad1487f98b780891a6dcdf49108",
      "followingBlockDigest": "0ac33ce3b212c69bd641ab67172cc109ba70735d9242bbee1b913ae1ff922aa1",
      "identityFingerprint": "0756c7cf80fcc132917ea5a31778087b175b99d1710bf3ac2762db8ebf8a3bd0",
      "ancestry": [
        "forgent"
      ],
      "text": "## Definition of done (platform-foundations L5)",
      "sectionText": "## Definition of done (platform-foundations L5)\n\nA stranger agent with no chat history should be able to answer, for any change:\n\n1. **What to read first?** `docs/specs/reading-map.md`, then the relevant area spec.\n2. **What kind of work is this?** Check it against the area's spec and\n   `docs/backlog.md`; a new product area gets a spec before it gets code.\n3. **What contract does it touch?** `docs/routing-handoff-contract.md` for\n   agent-to-agent boundaries; the area spec's Shared Entities table for\n   in-process contracts.\n4. **How much risk?** Does it change a locked law in `docs/platform-foundations.md`,\n   or existing covered behavior in the test suite? Either raises the bar.\n5. **What proof means done?** `npm test` (state + cli + runner + e2e suite) green;\n   new or changed behavior gets a matching test. Green must come from real\n   behavior: never add an env switch, flag, or test-only code branch that skips\n   checks to make tests pass; fix production code or the fixture instead.\n6. **What learning gets left behind?** A settled decision goes into\n   `docs/decisions/`; a settled spec fact goes into the relevant\n   `docs/specs/<area>.md`."
    }
  },
  "currentTarget": null,
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Judgment",
    "reason": "outside-platform navigation or instruction decision; no carriage target"
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_22c44c85aa5a35949e59c1fa1a36bd1a"
}
```

## Entry claim_67eb8d55ba3230adf56b929b3b549cdc

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-closing-instructions.json",
  "collection": "claims",
  "claimId": "claim_67eb8d55ba3230adf56b929b3b549cdc",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "s10-closing-instructions",
  "before": {
    "claimId": "claim_67eb8d55ba3230adf56b929b3b549cdc",
    "sourceUnitDigest": "3bbd7ce498a66733e262dc20e3185319b3c9ca346d5bf4c114d2ea7b37e3fe75",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792076952136-42ac8e36@2026-10-15",
    "rationale": "L10-3: retain AGENTS.md#dispatch-routing-work-to-an-executor as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 515c0ae74369b29716645859cb36c1312aa0ecbf4602213b897d0bdee2ed537c, pinned at 980cb29312b8701f5ea639278f44e1a57a6e5c02."
  },
  "currentDecision": {
    "claimId": "claim_67eb8d55ba3230adf56b929b3b549cdc",
    "sourceUnitDigest": "3bbd7ce498a66733e262dc20e3185319b3c9ca346d5bf4c114d2ea7b37e3fe75",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "L10-3: retain AGENTS.md#dispatch-routing-work-to-an-executor as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f, pinned at 59b9b70876324e07135db53d2351f7db6a7e1746. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried."
  },
  "native": {
    "kind": "units",
    "sourcePath": "AGENTS.md",
    "unitDigest": "be96cf98081517744945cfc57aff8119c2ad286b234a2fc393c05d71af2fc1f7",
    "identityFingerprint": "d3617ecd8feadb081e5491d54fea96b1715ad1fd6848478f5a4eb0133268999a",
    "claimId": "claim_67eb8d55ba3230adf56b929b3b549cdc",
    "sourceAnchor": "dispatch-routing-work-to-an-executor",
    "unitKind": "heading",
    "sourceUnitDigest": "3bbd7ce498a66733e262dc20e3185319b3c9ca346d5bf4c114d2ea7b37e3fe75",
    "claimKind": "unclassified",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "heading",
      "level": 2,
      "title": "Dispatch — routing work to an executor",
      "anchor": "dispatch-routing-work-to-an-executor",
      "githubAnchor": "dispatch-routing-work-to-an-executor",
      "stableAnchor": "h-75c460f74b21",
      "startLine": 150,
      "endLine": 150,
      "textDigest": "3bbd7ce498a66733e262dc20e3185319b3c9ca346d5bf4c114d2ea7b37e3fe75",
      "sample": "Dispatch — routing work to an executor",
      "sectionPayloadDigest": "28dccb7256cea333d921a8a0fe4b25e76a04b9acfceeec65f5be825af8b6face",
      "followingBlockDigest": "b093c6fb2a5d0ad347222f5cd68b1b44614799ac24ed54b60a29134c5f7ddfb8",
      "identityFingerprint": "d3617ecd8feadb081e5491d54fea96b1715ad1fd6848478f5a4eb0133268999a",
      "ancestry": [
        "forgent"
      ],
      "text": "## Dispatch — routing work to an executor",
      "sectionText": "## Dispatch — routing work to an executor\n\n`fgos run` is the primary door for executing new work in the execution core.\n\n**Two doors, one runUnit — the preferred path for new work.** One task: `fgos run \"<prompt>\" [--provider <id>] [--writes <paths> --worktree <path>]` builds a Unit from the prompt (read-only without `--writes`; `--writes` needs a linked worktree; `--provider` is a soft preference, not a pin). Planned work: `fgos workflow start <preset>|--units <file>`, one step per Unit. Both bind through `bind()`; the runner commits only the Unit's declared `writes` after a passing round, and the worker never runs `git add`/`git commit`. These two doors are the only ones that execute work; `fgos dispatch` keeps only the lower-level reads (`decide`, `inspect`, `reconcile`, `probe-account`).\n\nFor routing checks, `fgos dispatch decide` computes the execution mechanism and executor via `bind()` (`src/runner/execution/bind.mjs`). herdr is the default transport when present in the session/environment.\n\n**Before dispatching any task out of the current turn — a work item, a registered executor, an ad-hoc task, or your own direct Agent/Task-tool call — run `fgos dispatch decide` (or compatibility alias `node src/runner/dispatch.mjs decide`; `--work` only through `fgos dispatch decide`) first. Never decide the mechanism yourself.** A `PreToolUse` hook enforces this on Agent/Task-tool calls: it delegates to `bind()` and refuses the call when the answer comes back as anything other than `in-process`.\n\nFour ways to call `decide`, for four different situations:\n\n- `decide <executorId>` — you already know the exact executor name (e.g. `judge-discovery`).\n- `decide --for <purpose>` — you know what JOB you need done (e.g. `judge`), but not which executor serves it.\n- `decide --work <id> [--stage <stage>]` — you have a real work item and want it dispatched.\n- `decide --for <label> --needs-soul` — you are about to fire an Agent/Task tool yourself, with no executor or work item to name.\n\nAdd `--has-live-task-access` when you already have the Agent/Task tool in your own tool manifest. This is always your own self-declaration — never probed from the environment, never guessed.\n\nThree possible `mechanism` results, each needing a different response:\n\n- **`\"unavailable\"`** — nothing serves this. NOT an error: do it inline yourself, and report nothing.\n- **`\"in-process\"`** — call it yourself, with your own live capability: pass the returned agentType to your Agent/Task tool, or call the returned mcpTool directly. Dispatch cannot do this for you — it has neither an Agent/Task tool nor an MCP client of its own. When neither field is returned, use whichever agent type you would have used by default.\n- **`\"out-of-process\"`** — run `fgos run \"<prompt>\" --provider <executorId> --capability <purpose> [--writes <paths> --worktree <linked-worktree>]` (or `fgos run --unit <file>`), passing the same capability `decide` was asked for (left out, it defaults to the writing capability `execute`). `--provider` takes agent executors only: when the decided executor is a `kind: \"tool\"` executor, `fgos run` refuses it, so call that tool directly instead. Never run the resolved command yourself through Bash: `fgos run` binds, runs and settles the Unit and records its provenance under `.fgos/assignments/<unitRunId>/`, so there is nothing to log by hand. With `--writes` the runner commits only those paths after a passing round; with `--json` read the result at `data.results[-1].runResult.agentClaim.summary` and `data.results[-1].commit`.\n\nEvery result also carries `configured: true|false`, additive `reasonCodes: [...]`, and optional `blockedReason` (e.g. when blocked by governance policy) — `false` means nothing is configured for that name or job, and the answer came from the default.\nA skill that dispatches should not re-derive any of this. Reference `../_shared/executor-dispatch-fallback.md` from the skill; its canonical source is `core/skills/_shared/executor-dispatch-fallback.md`. `.agents/skills/` and `plugins/fgOS/skills/` are generated render surfaces carrying source headers, rebuilt with `npm run build:skills`; never edit them by hand. For fgOS thin wrappers, `.claude/skills` contains generated wrappers only; it has no `_shared` directory of its own."
    }
  },
  "currentTarget": null,
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Judgment",
    "reason": "outside-platform navigation or instruction decision; no carriage target"
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_67eb8d55ba3230adf56b929b3b549cdc"
}
```

## Entry claim_2e45cfdcd3f2bf602787b37feac667f3

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-closing-instructions.json",
  "collection": "claims",
  "claimId": "claim_2e45cfdcd3f2bf602787b37feac667f3",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "s10-closing-instructions",
  "before": {
    "claimId": "claim_2e45cfdcd3f2bf602787b37feac667f3",
    "sourceUnitDigest": "7d84eb3c654fd06a78b9e1d55f1aac0787beba431be44c4c11800b92f10afb45",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792076952136-42ac8e36@2026-10-15",
    "rationale": "L10-3: retain AGENTS.md#documentation-viewing-mdview as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 515c0ae74369b29716645859cb36c1312aa0ecbf4602213b897d0bdee2ed537c, pinned at 980cb29312b8701f5ea639278f44e1a57a6e5c02."
  },
  "currentDecision": {
    "claimId": "claim_2e45cfdcd3f2bf602787b37feac667f3",
    "sourceUnitDigest": "7d84eb3c654fd06a78b9e1d55f1aac0787beba431be44c4c11800b92f10afb45",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "L10-3: retain AGENTS.md#documentation-viewing-mdview as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f, pinned at 59b9b70876324e07135db53d2351f7db6a7e1746. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried."
  },
  "native": {
    "kind": "units",
    "sourcePath": "AGENTS.md",
    "unitDigest": "0f88b95c0f0147c03c08add070d474d7ef4c3a939596793c8c59454d131e5012",
    "identityFingerprint": "a85309a1368c7071897daf4e20c262bcb79dd91fbe446b59da8b88d773bbed8e",
    "claimId": "claim_2e45cfdcd3f2bf602787b37feac667f3",
    "sourceAnchor": "documentation-viewing-mdview",
    "unitKind": "heading",
    "sourceUnitDigest": "7d84eb3c654fd06a78b9e1d55f1aac0787beba431be44c4c11800b92f10afb45",
    "claimKind": "unclassified",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "heading",
      "level": 2,
      "title": "Documentation Viewing (MDView)",
      "anchor": "documentation-viewing-mdview",
      "githubAnchor": "documentation-viewing-mdview",
      "stableAnchor": "h-a0d8481e7c93",
      "startLine": 183,
      "endLine": 183,
      "textDigest": "7d84eb3c654fd06a78b9e1d55f1aac0787beba431be44c4c11800b92f10afb45",
      "sample": "Documentation Viewing (MDView)",
      "sectionPayloadDigest": "42d278bba4a7ce9c2f7ff755227feb14483587d3ace2b687a5c732999eb053bc",
      "followingBlockDigest": "42d278bba4a7ce9c2f7ff755227feb14483587d3ace2b687a5c732999eb053bc",
      "identityFingerprint": "a85309a1368c7071897daf4e20c262bcb79dd91fbe446b59da8b88d773bbed8e",
      "ancestry": [
        "forgent"
      ],
      "text": "## Documentation Viewing (MDView)",
      "sectionText": "## Documentation Viewing (MDView)\n\nAfter creating or updating any markdown file, make it viewable in ONE call —\nno project registration step needed:"
    }
  },
  "currentTarget": null,
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Judgment",
    "reason": "outside-platform navigation or instruction decision; no carriage target"
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_2e45cfdcd3f2bf602787b37feac667f3"
}
```

## Entry claim_6acc93d03a89146ebf7f4903938fabd9

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-closing-instructions.json",
  "collection": "claims",
  "claimId": "claim_6acc93d03a89146ebf7f4903938fabd9",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "s10-closing-instructions",
  "before": {
    "claimId": "claim_6acc93d03a89146ebf7f4903938fabd9",
    "sourceUnitDigest": "10e4f148b6be98e0dd1bbe35554836c6d8ab0bbb981b9a8d25a38460cb6cf137",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792076952136-42ac8e36@2026-10-15",
    "rationale": "L10-3: retain AGENTS.md#fgos-effective-instructions as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 515c0ae74369b29716645859cb36c1312aa0ecbf4602213b897d0bdee2ed537c, pinned at 980cb29312b8701f5ea639278f44e1a57a6e5c02."
  },
  "currentDecision": {
    "claimId": "claim_6acc93d03a89146ebf7f4903938fabd9",
    "sourceUnitDigest": "10e4f148b6be98e0dd1bbe35554836c6d8ab0bbb981b9a8d25a38460cb6cf137",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "L10-3: retain AGENTS.md#fgos-effective-instructions as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f, pinned at 59b9b70876324e07135db53d2351f7db6a7e1746. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried."
  },
  "native": {
    "kind": "units",
    "sourcePath": "AGENTS.md",
    "unitDigest": "bcd4ee82489105df3562bef9a377f5d3048852978098654513d14af88bd358b3",
    "identityFingerprint": "8c746a55cb5fbbead40a732f0e05e776b3f02b56ef96e9ade1101e523c7b13e7",
    "claimId": "claim_6acc93d03a89146ebf7f4903938fabd9",
    "sourceAnchor": "fgos-effective-instructions",
    "unitKind": "heading",
    "sourceUnitDigest": "10e4f148b6be98e0dd1bbe35554836c6d8ab0bbb981b9a8d25a38460cb6cf137",
    "claimKind": "unclassified",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "heading",
      "level": 2,
      "title": "fgOS Effective Instructions",
      "anchor": "fgos-effective-instructions",
      "githubAnchor": "fgos-effective-instructions",
      "stableAnchor": "h-bea8a881dbff",
      "startLine": 261,
      "endLine": 261,
      "textDigest": "10e4f148b6be98e0dd1bbe35554836c6d8ab0bbb981b9a8d25a38460cb6cf137",
      "sample": "fgOS Effective Instructions",
      "sectionPayloadDigest": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      "followingBlockDigest": null,
      "identityFingerprint": "8c746a55cb5fbbead40a732f0e05e776b3f02b56ef96e9ade1101e523c7b13e7",
      "ancestry": [
        "GitNexus — Code Intelligence"
      ],
      "text": "## fgOS Effective Instructions",
      "sectionText": "## fgOS Effective Instructions"
    }
  },
  "currentTarget": null,
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Judgment",
    "reason": "outside-platform navigation or instruction decision; no carriage target"
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_6acc93d03a89146ebf7f4903938fabd9"
}
```

## Entry claim_9039ff2ea2cb745f4758ba64efaf4d1b

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-closing-instructions.json",
  "collection": "claims",
  "claimId": "claim_9039ff2ea2cb745f4758ba64efaf4d1b",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "s10-closing-instructions",
  "before": {
    "claimId": "claim_9039ff2ea2cb745f4758ba64efaf4d1b",
    "sourceUnitDigest": "0c141b80ec54c16e0ee9165ede524471c64520c1b5baff0ced2438c2aa65f675",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792076952136-42ac8e36@2026-10-15",
    "rationale": "L10-3: retain AGENTS.md#forgent as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 515c0ae74369b29716645859cb36c1312aa0ecbf4602213b897d0bdee2ed537c, pinned at 980cb29312b8701f5ea639278f44e1a57a6e5c02."
  },
  "currentDecision": {
    "claimId": "claim_9039ff2ea2cb745f4758ba64efaf4d1b",
    "sourceUnitDigest": "0c141b80ec54c16e0ee9165ede524471c64520c1b5baff0ced2438c2aa65f675",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "L10-3: retain AGENTS.md#forgent as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f, pinned at 59b9b70876324e07135db53d2351f7db6a7e1746. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried."
  },
  "native": {
    "kind": "units",
    "sourcePath": "AGENTS.md",
    "unitDigest": "0c34769d657f24071ee0db8625b4b1dd7e6031ee550c3262d8f11913020dbe5d",
    "identityFingerprint": "0c141b80ec54c16e0ee9165ede524471c64520c1b5baff0ced2438c2aa65f675",
    "claimId": "claim_9039ff2ea2cb745f4758ba64efaf4d1b",
    "sourceAnchor": "forgent",
    "unitKind": "heading",
    "sourceUnitDigest": "0c141b80ec54c16e0ee9165ede524471c64520c1b5baff0ced2438c2aa65f675",
    "claimKind": "unclassified",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "heading",
      "level": 1,
      "title": "forgent",
      "anchor": "forgent",
      "githubAnchor": "forgent",
      "stableAnchor": "h-289558a71b11",
      "startLine": 1,
      "endLine": 1,
      "textDigest": "0c141b80ec54c16e0ee9165ede524471c64520c1b5baff0ced2438c2aa65f675",
      "sample": "forgent",
      "sectionPayloadDigest": "c88ead802ce5e5513955e1c3c6ff5783c1e8bbdb5e8cfe240d436b3176556806",
      "followingBlockDigest": "0e1c4d453af7446fe6407a536afd028a8ba765267631778c410e15f2b8c03d3a",
      "identityFingerprint": "0c141b80ec54c16e0ee9165ede524471c64520c1b5baff0ced2438c2aa65f675",
      "ancestry": [],
      "text": "# forgent",
      "sectionText": "# forgent\n\n**The Foundation for Generative Agents.**\n\nForgent (fgOS) is the platform layer for building and running agent applications — the infrastructure, skills, and automation that sit beneath every agent app, so developers can forge new agents instead of building everything from scratch.\n\n- README.md — product description + documentation index\n- docs/platform-foundations.md — L1-L8 locked design laws; L5 is this repo's definition of done (six questions, below)\n- docs/specs/system-overview.md — area map, shared entities, cross-area flows\n- docs/specs/reading-map.md — where every doc and source path in this repo lives\n- docs/backlog.md — product backlog (PBI rows: proposed / in-flight / done)\n- docs/routing-handoff-contract.md — agent-to-agent handoff contract + trust boundary\n- docs/decisions/index.md — generated projection of platform/repo-wide decisions (`fgos decision-index`); narrative lives in docs/specs/<area>.md's own \"Lịch sử quyết định\" sections (tsk-1lv-4)\n- domains/<domain>/AGENTS.md — domain-specific doctrine (e.g. domains/coding/AGENTS.md for fgos-coding-* workflows), read dynamically by fgos-routing"
    }
  },
  "currentTarget": null,
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Judgment",
    "reason": "outside-platform navigation or instruction decision; no carriage target"
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_9039ff2ea2cb745f4758ba64efaf4d1b"
}
```

## Entry claim_fd05edc9de6352f95be164482329687d

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-closing-instructions.json",
  "collection": "claims",
  "claimId": "claim_fd05edc9de6352f95be164482329687d",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "s10-closing-instructions",
  "before": {
    "claimId": "claim_fd05edc9de6352f95be164482329687d",
    "sourceUnitDigest": "150e95a64fd2a52cc454a2386a8dc3aec0b3a47eb54fb1fd8d02576899ea4461",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792076952136-42ac8e36@2026-10-15",
    "rationale": "L10-3: retain AGENTS.md#gitnexus-code-intelligence as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 515c0ae74369b29716645859cb36c1312aa0ecbf4602213b897d0bdee2ed537c, pinned at 980cb29312b8701f5ea639278f44e1a57a6e5c02."
  },
  "currentDecision": {
    "claimId": "claim_fd05edc9de6352f95be164482329687d",
    "sourceUnitDigest": "150e95a64fd2a52cc454a2386a8dc3aec0b3a47eb54fb1fd8d02576899ea4461",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "L10-3: retain AGENTS.md#gitnexus-code-intelligence as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f, pinned at 59b9b70876324e07135db53d2351f7db6a7e1746. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried."
  },
  "native": {
    "kind": "units",
    "sourcePath": "AGENTS.md",
    "unitDigest": "7e21885df02fa86d9033eceab65bd533c10a1d3f2050558e15d06ff344688416",
    "identityFingerprint": "90f2c0bea757e4b6d760c9285e2e357ff406f5b7e86be8712c375ef5f13385ed",
    "claimId": "claim_fd05edc9de6352f95be164482329687d",
    "sourceAnchor": "gitnexus-code-intelligence",
    "unitKind": "heading",
    "sourceUnitDigest": "150e95a64fd2a52cc454a2386a8dc3aec0b3a47eb54fb1fd8d02576899ea4461",
    "claimKind": "unclassified",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "heading",
      "level": 1,
      "title": "GitNexus — Code Intelligence",
      "anchor": "gitnexus-code-intelligence",
      "githubAnchor": "gitnexus-code-intelligence",
      "stableAnchor": "h-e383fa84e852",
      "startLine": 213,
      "endLine": 213,
      "textDigest": "150e95a64fd2a52cc454a2386a8dc3aec0b3a47eb54fb1fd8d02576899ea4461",
      "sample": "GitNexus — Code Intelligence",
      "sectionPayloadDigest": "1eda83dbf1720e219c9f3e3f46b9c2f3450fbfe82710ae49935a0d7a105d8db9",
      "followingBlockDigest": "39fe4d8d1ecc03cbf722efdf8de807822733f8f4f5cdd40cb10419c65ad79b46",
      "identityFingerprint": "90f2c0bea757e4b6d760c9285e2e357ff406f5b7e86be8712c375ef5f13385ed",
      "ancestry": [],
      "text": "# GitNexus — Code Intelligence",
      "sectionText": "# GitNexus — Code Intelligence\n\nThis project is indexed by GitNexus as **forgent** (58821 symbols, 81138 relationships, 300 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.\n\n> Index stale? Run `node .gitnexus/run.cjs analyze` from the project root — it auto-selects an available runner. No `.gitnexus/run.cjs` yet? `npx gitnexus analyze` (npm 11 crash → `npm i -g gitnexus`; #1939)."
    }
  },
  "currentTarget": null,
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Judgment",
    "reason": "outside-platform navigation or instruction decision; no carriage target"
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_fd05edc9de6352f95be164482329687d"
}
```

## Entry claim_ac6849769045271a57023dd684980fe6

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-closing-instructions.json",
  "collection": "claims",
  "claimId": "claim_ac6849769045271a57023dd684980fe6",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "s10-closing-instructions",
  "before": {
    "claimId": "claim_ac6849769045271a57023dd684980fe6",
    "sourceUnitDigest": "4739566357f3acd72b7f74ebe9d971eb577b915a0927fca5c39c2cae5cfe5c65",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792076952136-42ac8e36@2026-10-15",
    "rationale": "L10-3: retain AGENTS.md#installsetupdoctor-gate as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 515c0ae74369b29716645859cb36c1312aa0ecbf4602213b897d0bdee2ed537c, pinned at 980cb29312b8701f5ea639278f44e1a57a6e5c02."
  },
  "currentDecision": {
    "claimId": "claim_ac6849769045271a57023dd684980fe6",
    "sourceUnitDigest": "4739566357f3acd72b7f74ebe9d971eb577b915a0927fca5c39c2cae5cfe5c65",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "L10-3: retain AGENTS.md#installsetupdoctor-gate as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f, pinned at 59b9b70876324e07135db53d2351f7db6a7e1746. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried."
  },
  "native": {
    "kind": "units",
    "sourcePath": "AGENTS.md",
    "unitDigest": "1fc7aa45e22dc10c2dbc4fcd5a2230c58bb86de5870af58e58151a499f9f8643",
    "identityFingerprint": "63d04279fd2a1fc54070dcb38bdd5267b829ff597a2fe745710d7f94768fba4e",
    "claimId": "claim_ac6849769045271a57023dd684980fe6",
    "sourceAnchor": "installsetupdoctor-gate",
    "unitKind": "heading",
    "sourceUnitDigest": "4739566357f3acd72b7f74ebe9d971eb577b915a0927fca5c39c2cae5cfe5c65",
    "claimKind": "unclassified",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "heading",
      "level": 2,
      "title": "Install/setup/doctor gate",
      "anchor": "installsetupdoctor-gate",
      "githubAnchor": "installsetupdoctor-gate",
      "stableAnchor": "h-dc63102c2570",
      "startLine": 113,
      "endLine": 113,
      "textDigest": "4739566357f3acd72b7f74ebe9d971eb577b915a0927fca5c39c2cae5cfe5c65",
      "sample": "Install/setup/doctor gate",
      "sectionPayloadDigest": "136a17be664535a0899cf7112c5981d1786393916d863ca3f783899ad5aaf2eb",
      "followingBlockDigest": "3f149be4bf754b1ad1a12eb8d3e7a24a1db97ca4aa3cf15fd7cf3bae732b7f3f",
      "identityFingerprint": "63d04279fd2a1fc54070dcb38bdd5267b829ff597a2fe745710d7f94768fba4e",
      "ancestry": [
        "forgent"
      ],
      "text": "## Install/setup/doctor gate",
      "sectionText": "## Install/setup/doctor gate\n\n`docs/distribution-vision.md` sets the direction for this repo's own\ncài đặt/setup/doctor story. Before any change is done, ask:\n\n- Does this add a config default, env var, or infra dependency (a new\n  file it expects to exist, a tool it shells out to, a directory it\n  assumes is writable)? If yes, it must register into `fgos setup`'s\n  config-merge and `fgos doctor`'s check registry (`src/setup/checks.mjs`)\n  — not stand alone, undiscoverable by `doctor`.\n- Never hardcode an assumption about which install level (global vs\n  project) is active — per the vision doc, project config always\n  overwrites global, and fgOS stays aware of both without conflict.\n- If the change touches how fgOS gets installed, upgraded, or diagnosed at\n  all, read `docs/distribution-vision.md` and `docs/specs/distribution.md`\n  first — a new module gets a spec/config-registry entry before it gets\n  code, same bar as a new product area (question 2 above).\n- Does this change something a user of fgOS would see? If yes, add a line\n  to `## [Unreleased]` in `CHANGELOG.md`."
    }
  },
  "currentTarget": null,
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Judgment",
    "reason": "outside-platform navigation or instruction decision; no carriage target"
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_ac6849769045271a57023dd684980fe6"
}
```

## Entry claim_9474ae42b4d6e079fcf33fec49e746fa

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-closing-instructions.json",
  "collection": "claims",
  "claimId": "claim_9474ae42b4d6e079fcf33fec49e746fa",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "s10-closing-instructions",
  "before": {
    "claimId": "claim_9474ae42b4d6e079fcf33fec49e746fa",
    "sourceUnitDigest": "28440004ae9b19f77cd7e12234d43d8f163fcfe5868fb96b470f55d196de8861",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792076952136-42ac8e36@2026-10-15",
    "rationale": "L10-3: retain AGENTS.md#law as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 515c0ae74369b29716645859cb36c1312aa0ecbf4602213b897d0bdee2ed537c, pinned at 980cb29312b8701f5ea639278f44e1a57a6e5c02."
  },
  "currentDecision": {
    "claimId": "claim_9474ae42b4d6e079fcf33fec49e746fa",
    "sourceUnitDigest": "28440004ae9b19f77cd7e12234d43d8f163fcfe5868fb96b470f55d196de8861",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "L10-3: retain AGENTS.md#law as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f, pinned at 59b9b70876324e07135db53d2351f7db6a7e1746. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried."
  },
  "native": {
    "kind": "units",
    "sourcePath": "AGENTS.md",
    "unitDigest": "de1df04a038983af8c2904d37bd118fe0cf79e183304076cc9136fe07b464757",
    "identityFingerprint": "28440004ae9b19f77cd7e12234d43d8f163fcfe5868fb96b470f55d196de8861",
    "claimId": "claim_9474ae42b4d6e079fcf33fec49e746fa",
    "sourceAnchor": "law",
    "unitKind": "heading",
    "sourceUnitDigest": "28440004ae9b19f77cd7e12234d43d8f163fcfe5868fb96b470f55d196de8861",
    "claimKind": "unclassified",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "heading",
      "level": 3,
      "title": "law",
      "anchor": "law",
      "githubAnchor": "law",
      "stableAnchor": "h-88306b6a336c",
      "startLine": 263,
      "endLine": 263,
      "textDigest": "28440004ae9b19f77cd7e12234d43d8f163fcfe5868fb96b470f55d196de8861",
      "sample": "law",
      "sectionPayloadDigest": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      "followingBlockDigest": null,
      "identityFingerprint": "28440004ae9b19f77cd7e12234d43d8f163fcfe5868fb96b470f55d196de8861",
      "ancestry": [
        "GitNexus — Code Intelligence",
        "fgOS Effective Instructions"
      ],
      "text": "### law",
      "sectionText": "### law"
    }
  },
  "currentTarget": null,
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Judgment",
    "reason": "outside-platform navigation or instruction decision; no carriage target"
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_9474ae42b4d6e079fcf33fec49e746fa"
}
```

## Entry claim_133b6f931d35a06604813e97ac11bd8f

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-closing-instructions.json",
  "collection": "claims",
  "claimId": "claim_133b6f931d35a06604813e97ac11bd8f",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "s10-closing-instructions",
  "before": {
    "claimId": "claim_133b6f931d35a06604813e97ac11bd8f",
    "sourceUnitDigest": "f081560dd43881074ceded6248a3ead793add48968f3eedf2ff2aa7f6284951e",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792076952136-42ac8e36@2026-10-15",
    "rationale": "L10-3: retain AGENTS.md#never-do as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 515c0ae74369b29716645859cb36c1312aa0ecbf4602213b897d0bdee2ed537c, pinned at 980cb29312b8701f5ea639278f44e1a57a6e5c02."
  },
  "currentDecision": {
    "claimId": "claim_133b6f931d35a06604813e97ac11bd8f",
    "sourceUnitDigest": "f081560dd43881074ceded6248a3ead793add48968f3eedf2ff2aa7f6284951e",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "L10-3: retain AGENTS.md#never-do as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f, pinned at 59b9b70876324e07135db53d2351f7db6a7e1746. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried."
  },
  "native": {
    "kind": "units",
    "sourcePath": "AGENTS.md",
    "unitDigest": "e873cf37f739248eee0224ea543d02a9977ac6de94f24baae620e4996419e733",
    "identityFingerprint": "8af2b2f9f6ea42011e3c43d9d4e6c9dea0fbdb647c5d036f260eab9912d97535",
    "claimId": "claim_133b6f931d35a06604813e97ac11bd8f",
    "sourceAnchor": "never-do",
    "unitKind": "heading",
    "sourceUnitDigest": "f081560dd43881074ceded6248a3ead793add48968f3eedf2ff2aa7f6284951e",
    "claimKind": "unclassified",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "heading",
      "level": 2,
      "title": "Never Do",
      "anchor": "never-do",
      "githubAnchor": "never-do",
      "stableAnchor": "h-4ebfd4d2d745",
      "startLine": 228,
      "endLine": 228,
      "textDigest": "f081560dd43881074ceded6248a3ead793add48968f3eedf2ff2aa7f6284951e",
      "sample": "Never Do",
      "sectionPayloadDigest": "6f63dffd5c7d710ca600d3ad22016e4e73cf9729a299b36d624070a87429d6e1",
      "followingBlockDigest": "6f63dffd5c7d710ca600d3ad22016e4e73cf9729a299b36d624070a87429d6e1",
      "identityFingerprint": "8af2b2f9f6ea42011e3c43d9d4e6c9dea0fbdb647c5d036f260eab9912d97535",
      "ancestry": [
        "GitNexus — Code Intelligence"
      ],
      "text": "## Never Do",
      "sectionText": "## Never Do\n\n- NEVER edit a function, class, or method without first running `impact` on it.\n- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.\n- NEVER rename symbols with find-and-replace — use `rename` which understands the call graph.\n- NEVER commit changes without running `detect_changes()` to check affected scope."
    }
  },
  "currentTarget": null,
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Judgment",
    "reason": "outside-platform navigation or instruction decision; no carriage target"
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_133b6f931d35a06604813e97ac11bd8f"
}
```

## Entry claim_fde89656fbadabacb69e8f793b223377

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-closing-instructions.json",
  "collection": "claims",
  "claimId": "claim_fde89656fbadabacb69e8f793b223377",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "s10-closing-instructions",
  "before": {
    "claimId": "claim_fde89656fbadabacb69e8f793b223377",
    "sourceUnitDigest": "dc48182c384ef81504a14678e50d3c47a3358a2170c301b4cff15a0de7f7725a",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792076952136-42ac8e36@2026-10-15",
    "rationale": "L10-3: retain AGENTS.md#platform-operating-laws as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 515c0ae74369b29716645859cb36c1312aa0ecbf4602213b897d0bdee2ed537c, pinned at 980cb29312b8701f5ea639278f44e1a57a6e5c02."
  },
  "currentDecision": {
    "claimId": "claim_fde89656fbadabacb69e8f793b223377",
    "sourceUnitDigest": "dc48182c384ef81504a14678e50d3c47a3358a2170c301b4cff15a0de7f7725a",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "L10-3: retain AGENTS.md#platform-operating-laws as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f, pinned at 59b9b70876324e07135db53d2351f7db6a7e1746. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried."
  },
  "native": {
    "kind": "units",
    "sourcePath": "AGENTS.md",
    "unitDigest": "0354536faa4153dc95db6df263f73275e4a25d99efe037da70354410e7f4c970",
    "identityFingerprint": "32b040fb71f2f208f769259bca815d0bf06cda230b31e065b765cf776c7bac21",
    "claimId": "claim_fde89656fbadabacb69e8f793b223377",
    "sourceAnchor": "platform-operating-laws",
    "unitKind": "heading",
    "sourceUnitDigest": "dc48182c384ef81504a14678e50d3c47a3358a2170c301b4cff15a0de7f7725a",
    "claimKind": "unclassified",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "heading",
      "level": 4,
      "title": "Platform Operating Laws",
      "anchor": "platform-operating-laws",
      "githubAnchor": "platform-operating-laws",
      "stableAnchor": "h-ef2efa553f3f",
      "startLine": 274,
      "endLine": 274,
      "textDigest": "dc48182c384ef81504a14678e50d3c47a3358a2170c301b4cff15a0de7f7725a",
      "sample": "Platform Operating Laws",
      "sectionPayloadDigest": "0634893a1881205c0eb9275047c5b3a44f596f2dff7a47fb0d0e10aae07aebb4",
      "followingBlockDigest": "0634893a1881205c0eb9275047c5b3a44f596f2dff7a47fb0d0e10aae07aebb4",
      "identityFingerprint": "32b040fb71f2f208f769259bca815d0bf06cda230b31e065b765cf776c7bac21",
      "ancestry": [
        "Decision Question Template"
      ],
      "text": "#### Platform Operating Laws",
      "sectionText": "#### Platform Operating Laws\n\n- id: `platform-operating-laws`\n- source: `core/instructions/platform-laws.md`"
    }
  },
  "currentTarget": null,
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Judgment",
    "reason": "outside-platform navigation or instruction decision; no carriage target"
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_fde89656fbadabacb69e8f793b223377"
}
```

## Entry claim_8231e682b35899eed43b85ce92dbc6ba

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-closing-instructions.json",
  "collection": "claims",
  "claimId": "claim_8231e682b35899eed43b85ce92dbc6ba",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "s10-closing-instructions",
  "before": {
    "claimId": "claim_8231e682b35899eed43b85ce92dbc6ba",
    "sourceUnitDigest": "192d7bf6d359979a7ee22a18c66efd97acc8704687f07c222cc20bdf2cc14389",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792076952136-42ac8e36@2026-10-15",
    "rationale": "L10-3: retain AGENTS.md#platform-operating-laws-1 as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 515c0ae74369b29716645859cb36c1312aa0ecbf4602213b897d0bdee2ed537c, pinned at 980cb29312b8701f5ea639278f44e1a57a6e5c02."
  },
  "currentDecision": {
    "claimId": "claim_8231e682b35899eed43b85ce92dbc6ba",
    "sourceUnitDigest": "192d7bf6d359979a7ee22a18c66efd97acc8704687f07c222cc20bdf2cc14389",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "L10-3: retain AGENTS.md#platform-operating-laws-1 as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f, pinned at 59b9b70876324e07135db53d2351f7db6a7e1746. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried."
  },
  "native": {
    "kind": "units",
    "sourcePath": "AGENTS.md",
    "unitDigest": "f3c82916dd872269bef1ac1d81471c525fad070e463f3c14107a957b72db4877",
    "identityFingerprint": "9d6dcb22bd41cdf5a71ede72b70557de9da3f1342df41b8501d212e2f9070bf1",
    "claimId": "claim_8231e682b35899eed43b85ce92dbc6ba",
    "sourceAnchor": "platform-operating-laws-1",
    "unitKind": "heading",
    "sourceUnitDigest": "192d7bf6d359979a7ee22a18c66efd97acc8704687f07c222cc20bdf2cc14389",
    "claimKind": "unclassified",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "heading",
      "level": 1,
      "title": "Platform Operating Laws",
      "anchor": "platform-operating-laws-1",
      "githubAnchor": "platform-operating-laws-1",
      "stableAnchor": "h-b5c9113b820e",
      "startLine": 279,
      "endLine": 279,
      "textDigest": "192d7bf6d359979a7ee22a18c66efd97acc8704687f07c222cc20bdf2cc14389",
      "sample": "Platform Operating Laws",
      "sectionPayloadDigest": "af2187fac10d6b881f350198038d5aed0e8043091dead5b59a26b375f12394b5",
      "followingBlockDigest": "7e4431ca6a7e941fe10d3962f79815b135aeb90897d2ab15817a4e7a903bd2a7",
      "identityFingerprint": "9d6dcb22bd41cdf5a71ede72b70557de9da3f1342df41b8501d212e2f9070bf1",
      "ancestry": [],
      "text": "# Platform Operating Laws",
      "sectionText": "# Platform Operating Laws\n\nPlatform laws L1-L8 are locked in `docs/platform-foundations.md` and define immutable platform invariants for fgOS:\n\n- **L1 — Hai vật lý của tri thức: Log vs State** (`docs/platform-foundations.md#l1--hai-vt-l-ca-tri-thc-log-vs-state`)\n- **L2 — Kiến trúc memory hai tầng** (`docs/platform-foundations.md#l2--kin-trc-memory-hai-tng`)\n- **L3 — Luật store: truth ở JSONL, db là view** (`docs/platform-foundations.md#l3--lut-store-truth--jsonl-db-l-view`)\n- **L4 — Routing model theo audience của từng interface** (`docs/platform-foundations.md#l4--routing-model-theo-audience-ca-tng-interface`)\n- **L5 — Definition of done: sáu câu hỏi** (`docs/platform-foundations.md#l5--definition-of-done-su-cu-hi`)\n- **L6 — Maturity ladder F0–F5** (`docs/platform-foundations.md#l6--maturity-ladder-f0f5`)\n- **L7 — Durability ladder** (`docs/platform-foundations.md#l7--durability-ladder`)\n- **L8 — Doctrine placement rule (always-loaded layer)** (`docs/platform-foundations.md#l8--doctrine-placement-rule-always-loaded-layer`)\n\nAuthoritative statements, rationales, evidence sources, and review thresholds are defined exclusively in `docs/platform-foundations.md`. Changing any locked law requires superseding its decision ID rather than editing in place.\n\n<!-- fgos:instruction-projection:end -->"
    }
  },
  "currentTarget": null,
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Judgment",
    "reason": "outside-platform navigation or instruction decision; no carriage target"
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_8231e682b35899eed43b85ce92dbc6ba"
}
```

## Entry claim_dadecacb903167be7252b40d75033a56

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-closing-instructions.json",
  "collection": "claims",
  "claimId": "claim_dadecacb903167be7252b40d75033a56",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "s10-closing-instructions",
  "before": {
    "claimId": "claim_dadecacb903167be7252b40d75033a56",
    "sourceUnitDigest": "7a863d1c86d51e3842a3abdd6ab13b94240b726f456143e1e129be217e939bc6",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792076952136-42ac8e36@2026-10-15",
    "rationale": "L10-3: retain AGENTS.md#product-priority-order-d-adr0030-docsspecsrunnermd as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 515c0ae74369b29716645859cb36c1312aa0ecbf4602213b897d0bdee2ed537c, pinned at 980cb29312b8701f5ea639278f44e1a57a6e5c02."
  },
  "currentDecision": {
    "claimId": "claim_dadecacb903167be7252b40d75033a56",
    "sourceUnitDigest": "7a863d1c86d51e3842a3abdd6ab13b94240b726f456143e1e129be217e939bc6",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "L10-3: retain AGENTS.md#product-priority-order-d-adr0030-docsspecsrunnermd as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f, pinned at 59b9b70876324e07135db53d2351f7db6a7e1746. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried."
  },
  "native": {
    "kind": "units",
    "sourcePath": "AGENTS.md",
    "unitDigest": "b23e5d50ce12bca6c31aa4cb5a1623155014fa1857af46db82a691211d154f68",
    "identityFingerprint": "e0c69764781bb2c94ed8565f9eea8f2259a9950831e630a818a3c6331e53c58c",
    "claimId": "claim_dadecacb903167be7252b40d75033a56",
    "sourceAnchor": "product-priority-order-d-adr0030-docsspecsrunnermd",
    "unitKind": "heading",
    "sourceUnitDigest": "7a863d1c86d51e3842a3abdd6ab13b94240b726f456143e1e129be217e939bc6",
    "claimKind": "unclassified",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "heading",
      "level": 2,
      "title": "Product priority order (D-ADR0030, docs/specs/runner.md)",
      "anchor": "product-priority-order-d-adr0030-docsspecsrunnermd",
      "githubAnchor": "product-priority-order-d-adr0030-docsspecsrunnermd",
      "stableAnchor": "h-068daad8f921",
      "startLine": 16,
      "endLine": 16,
      "textDigest": "7a863d1c86d51e3842a3abdd6ab13b94240b726f456143e1e129be217e939bc6",
      "sample": "Product priority order (D-ADR0030, docs/specs/runner.md)",
      "sectionPayloadDigest": "88a81016769ea1d2903cfb176c5a8b27145f6d4bdcfcc6b2a27f820814143a15",
      "followingBlockDigest": "1647ee808cc12762f3eebd5a3caa23b1b24da3fddbd71297903d0ddb798ed718",
      "identityFingerprint": "e0c69764781bb2c94ed8565f9eea8f2259a9950831e630a818a3c6331e53c58c",
      "ancestry": [
        "forgent"
      ],
      "text": "## Product priority order (D-ADR0030, docs/specs/runner.md)",
      "sectionText": "## Product priority order (D-ADR0030, docs/specs/runner.md)\n\n1. **Ship Faster** — giao nhanh hơn, không đoán mò, giảm friction/better-dev-ux, ít chờ đợi.\n2. **Release con người** — giải phóng con người khỏi việc ngồi canh chờ trả lời. Hệ thống tự phán đoán, tự vận hành ở mức cao nhất có thể; chỉ hỏi người khi thật sự cần, và khi hỏi thì gom thành bộ để mỗi lần người quay lại trả lời được nhiều nhất rồi đi tiếp; mỗi câu theo mẫu câu hỏi quyết định (`core/skills/_shared/decision-question.md`). Tự quyết trong khung đã duyệt (phạm vi + ngân sách ghi lúc duyệt); sắp vượt khung thì dừng và hỏi theo mẫu. Một câu hỏi treo không được nghẽn phần việc khác của cùng item còn tiến được — stage/skill vì vậy phải chia nhỏ, mịn, mỗi mảnh park/tiến độc lập.\n   Khi phân tích của chính agent đã chọn rõ một phương án, hãy quyết và báo cáo, không hỏi lại. Chỉ hỏi khi các phương án thật sự ngang nhau hoặc phụ thuộc vào ý định của người dùng.\n3. **DoD** — reproducibly verifiable result + evidence-linked documentation.\n4. **Polish Sau DoD** — hoàn thiện sau ngưỡng, không mở scope.\n\nTốc độ ở mục 1 là tốc độ ship của **project đang DÙNG fgOS** (fgOS không loại trừ khi tự dogfood) — không phải tốc độ tự thân team fgOS build một tính năng của chính fgOS. Đừng chọn phương án rẻ để fgOS tự triển khai nếu nó làm project dùng fgOS chậm hơn.\n\nThứ tự cố định — bậc dưới không ghi đè bậc trên. Chi tiết: docs/specs/runner.md's \"Lịch sử quyết định\" § D-ADR0030 (mở rộng D-ADR0025; narrative đầy đủ, docs/decisions/*.md corpus đã retired tsk-1lv-4)."
    }
  },
  "currentTarget": null,
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Judgment",
    "reason": "outside-platform navigation or instruction decision; no carriage target"
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_dadecacb903167be7252b40d75033a56"
}
```

## Entry claim_2c843f49586c14b6d70149ae591d47f9

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-closing-instructions.json",
  "collection": "claims",
  "claimId": "claim_2c843f49586c14b6d70149ae591d47f9",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "s10-closing-instructions",
  "before": {
    "claimId": "claim_2c843f49586c14b6d70149ae591d47f9",
    "sourceUnitDigest": "b0c5afec8bbc85b96206854945bcd84f6ca85f3995ba34cd7efc69907c0d5a29",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792076952136-42ac8e36@2026-10-15",
    "rationale": "L10-3: retain AGENTS.md#ranh-giới-sứ-mệnh-d-adr0035-docsspecsplatform-foundationsmd as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 515c0ae74369b29716645859cb36c1312aa0ecbf4602213b897d0bdee2ed537c, pinned at 980cb29312b8701f5ea639278f44e1a57a6e5c02."
  },
  "currentDecision": {
    "claimId": "claim_2c843f49586c14b6d70149ae591d47f9",
    "sourceUnitDigest": "b0c5afec8bbc85b96206854945bcd84f6ca85f3995ba34cd7efc69907c0d5a29",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "L10-3: retain AGENTS.md#ranh-giới-sứ-mệnh-d-adr0035-docsspecsplatform-foundationsmd as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f, pinned at 59b9b70876324e07135db53d2351f7db6a7e1746. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried."
  },
  "native": {
    "kind": "units",
    "sourcePath": "AGENTS.md",
    "unitDigest": "b95650b3b0b8b23330947abe9f4622c3aef7d43f9f31eb139740144b2be6ef48",
    "identityFingerprint": "36a6e08c9c128784285c5a96c1cb67ae78e2f153f6d389f9bdbb355f86a9ebe4",
    "claimId": "claim_2c843f49586c14b6d70149ae591d47f9",
    "sourceAnchor": "ranh-giới-sứ-mệnh-d-adr0035-docsspecsplatform-foundationsmd",
    "unitKind": "heading",
    "sourceUnitDigest": "b0c5afec8bbc85b96206854945bcd84f6ca85f3995ba34cd7efc69907c0d5a29",
    "claimKind": "unclassified",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "heading",
      "level": 2,
      "title": "Ranh giới sứ mệnh (D-ADR0035, docs/specs/platform-foundations.md)",
      "anchor": "ranh-giới-sứ-mệnh-d-adr0035-docsspecsplatform-foundationsmd",
      "githubAnchor": "ranh-giới-sứ-mệnh-d-adr0035-docsspecsplatform-foundationsmd",
      "stableAnchor": "h-24d05552722a",
      "startLine": 28,
      "endLine": 28,
      "textDigest": "b0c5afec8bbc85b96206854945bcd84f6ca85f3995ba34cd7efc69907c0d5a29",
      "sample": "Ranh giới sứ mệnh (D-ADR0035, docs/specs/platform-foundations.md)",
      "sectionPayloadDigest": "aaa7d6e4db6d375f3fa0da034424e3cdfef4b3486d7ff842f1fd9e6e11ad6f31",
      "followingBlockDigest": "2f43e6ba7d13c017035a4295381b83e9a4d21eaf658d0c1f90f4bbf9608c137f",
      "identityFingerprint": "36a6e08c9c128784285c5a96c1cb67ae78e2f153f6d389f9bdbb355f86a9ebe4",
      "ancestry": [
        "forgent"
      ],
      "text": "## Ranh giới sứ mệnh (D-ADR0035, docs/specs/platform-foundations.md)",
      "sectionText": "## Ranh giới sứ mệnh (D-ADR0035, docs/specs/platform-foundations.md)\n\nfgOS tồn tại để: \n 1. phát triển các project khác \n 2. làm nền vận hành các business base workflow \n \nfgOS KHÔNG phải để (3) tự phát triển chính nó. Mission #3 là dogfood cần thiết trong lúc xây, không phải lý do fgOS tồn tại.  Khi làm việc trong chính repo (nơi fgOS tự-host trên chính source của mình), đừng mặc định coi \"sửa fgOS\" là mục tiêu chỉ vì đó là việc trước mắt — hỏi việc đang làm có phục vụ mission #1/#2 (năng lực fgOS mang lại cho project/workflow khác) hay chỉ tiện cho chính đội fgOS (mission #3). fgOS đã cài global và đang vận hành thật trên nhiều project khác ngoài repo này — mission #1/#2 không phải lý thuyết. Chi tiết + bằng chứng: docs/specs/platform-foundations.md's \"Lịch sử quyết định\" § D-ADR0035 (docs/decisions/*.md corpus đã retired tsk-1lv-4)."
    }
  },
  "currentTarget": null,
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Judgment",
    "reason": "outside-platform navigation or instruction decision; no carriage target"
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_2c843f49586c14b6d70149ae591d47f9"
}
```

## Entry claim_42108ffe5c72a9f3ca2c7ef904fd14ec

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-closing-instructions.json",
  "collection": "claims",
  "claimId": "claim_42108ffe5c72a9f3ca2c7ef904fd14ec",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "s10-closing-instructions",
  "before": {
    "claimId": "claim_42108ffe5c72a9f3ca2c7ef904fd14ec",
    "sourceUnitDigest": "14d6f595788e8fc244f48477644d5527eeba45c4172ee04717caf23b04cb172e",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792076952136-42ac8e36@2026-10-15",
    "rationale": "L10-3: retain AGENTS.md#resources as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 515c0ae74369b29716645859cb36c1312aa0ecbf4602213b897d0bdee2ed537c, pinned at 980cb29312b8701f5ea639278f44e1a57a6e5c02."
  },
  "currentDecision": {
    "claimId": "claim_42108ffe5c72a9f3ca2c7ef904fd14ec",
    "sourceUnitDigest": "14d6f595788e8fc244f48477644d5527eeba45c4172ee04717caf23b04cb172e",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "L10-3: retain AGENTS.md#resources as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f, pinned at 59b9b70876324e07135db53d2351f7db6a7e1746. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried."
  },
  "native": {
    "kind": "units",
    "sourcePath": "AGENTS.md",
    "unitDigest": "47c3568ddec4bc9a7f6ec4204979a30b266331dcb09c21d41582d97a07d97b47",
    "identityFingerprint": "833eaa198037a7b8bb2619b6a371f2efa587939fd9b66541b45b5e8c14a02d93",
    "claimId": "claim_42108ffe5c72a9f3ca2c7ef904fd14ec",
    "sourceAnchor": "resources",
    "unitKind": "heading",
    "sourceUnitDigest": "14d6f595788e8fc244f48477644d5527eeba45c4172ee04717caf23b04cb172e",
    "claimKind": "unclassified",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "heading",
      "level": 2,
      "title": "Resources",
      "anchor": "resources",
      "githubAnchor": "resources",
      "stableAnchor": "h-8c6a93fa209d",
      "startLine": 235,
      "endLine": 235,
      "textDigest": "14d6f595788e8fc244f48477644d5527eeba45c4172ee04717caf23b04cb172e",
      "sample": "Resources",
      "sectionPayloadDigest": "b64e3f9772c143e0d911c16218f5a9f280f96b0c1466f43f52e5aa4d63855221",
      "followingBlockDigest": "b64e3f9772c143e0d911c16218f5a9f280f96b0c1466f43f52e5aa4d63855221",
      "identityFingerprint": "833eaa198037a7b8bb2619b6a371f2efa587939fd9b66541b45b5e8c14a02d93",
      "ancestry": [
        "GitNexus — Code Intelligence"
      ],
      "text": "## Resources",
      "sectionText": "## Resources\n\n| Resource | Use for |\n|----------|---------|\n| `gitnexus://repo/forgent/context` | Codebase overview, check index freshness |\n| `gitnexus://repo/forgent/clusters` | All functional areas |\n| `gitnexus://repo/forgent/processes` | All execution flows |\n| `gitnexus://repo/forgent/process/{name}` | Step-by-step execution trace |"
    }
  },
  "currentTarget": null,
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Judgment",
    "reason": "outside-platform navigation or instruction decision; no carriage target"
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_42108ffe5c72a9f3ca2c7ef904fd14ec"
}
```

## Entry claim_5f15ada3e8a013ad4b1c962bd082ea68

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-closing-instructions.json",
  "collection": "claims",
  "claimId": "claim_5f15ada3e8a013ad4b1c962bd082ea68",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "s10-closing-instructions",
  "before": {
    "claimId": "claim_5f15ada3e8a013ad4b1c962bd082ea68",
    "sourceUnitDigest": "52ff86d66f342109d00adeffc09b80352fec793ccd934413bf59a0d8dd0d32c2",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792076952136-42ac8e36@2026-10-15",
    "rationale": "L10-3: retain AGENTS.md#rul11-tùm-lum-không-phải-nặng-d-adr0054-supersedes-d-adr0036-docsspecsplatform-foundationsmd as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 515c0ae74369b29716645859cb36c1312aa0ecbf4602213b897d0bdee2ed537c, pinned at 980cb29312b8701f5ea639278f44e1a57a6e5c02."
  },
  "currentDecision": {
    "claimId": "claim_5f15ada3e8a013ad4b1c962bd082ea68",
    "sourceUnitDigest": "52ff86d66f342109d00adeffc09b80352fec793ccd934413bf59a0d8dd0d32c2",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "L10-3: retain AGENTS.md#rul11-tùm-lum-không-phải-nặng-d-adr0054-supersedes-d-adr0036-docsspecsplatform-foundationsmd as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f, pinned at 59b9b70876324e07135db53d2351f7db6a7e1746. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried."
  },
  "native": {
    "kind": "units",
    "sourcePath": "AGENTS.md",
    "unitDigest": "9c29970d9665aa032e9021ce1ac20794d0d5531d1319052264dabd4c87686a4d",
    "identityFingerprint": "4dbcd5d22c9272810b60cf3b65b18893f6fec1a78034dde8fd217fec2524b728",
    "claimId": "claim_5f15ada3e8a013ad4b1c962bd082ea68",
    "sourceAnchor": "rul11-tùm-lum-không-phải-nặng-d-adr0054-supersedes-d-adr0036-docsspecsplatform-foundationsmd",
    "unitKind": "heading",
    "sourceUnitDigest": "52ff86d66f342109d00adeffc09b80352fec793ccd934413bf59a0d8dd0d32c2",
    "claimKind": "decision",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "heading",
      "level": 2,
      "title": "RUL11 — tùm lum, không phải nặng (D-ADR0054, supersedes D-ADR0036, docs/specs/platform-foundations.md)",
      "anchor": "rul11-tùm-lum-không-phải-nặng-d-adr0054-supersedes-d-adr0036-docsspecsplatform-foundationsmd",
      "githubAnchor": "rul11-tùm-lum-không-phải-nặng-d-adr0054-supersedes-d-adr0036-docsspecsplatform-foundationsmd",
      "stableAnchor": "h-21214f60de5c",
      "startLine": 138,
      "endLine": 138,
      "textDigest": "52ff86d66f342109d00adeffc09b80352fec793ccd934413bf59a0d8dd0d32c2",
      "sample": "RUL11 — tùm lum, không phải nặng (D-ADR0054, supersedes D-ADR0036, docs/specs/platform-foundations.md)",
      "sectionPayloadDigest": "d5348e589de1e3d325ade1ee9ad282e22a625a581c92c6360897dd5e19b193ac",
      "followingBlockDigest": "38f511a5d090b7f9fc9b928ea29af5d75e01bfe5c18e3287977d5a335e2a7fcf",
      "identityFingerprint": "4dbcd5d22c9272810b60cf3b65b18893f6fec1a78034dde8fd217fec2524b728",
      "ancestry": [
        "forgent"
      ],
      "text": "## RUL11 — tùm lum, không phải nặng (D-ADR0054, supersedes D-ADR0036, docs/specs/platform-foundations.md)",
      "sectionText": "## RUL11 — tùm lum, không phải nặng (D-ADR0054, supersedes D-ADR0036, docs/specs/platform-foundations.md)\n\nViệc trở nặng không vì bản chất nó lớn mà vì thiếu và quên — tên đúng của\ntình trạng đó là tùm lum, không phải nặng. Khi thấy tùm lum trong phạm vi\nviệc đang làm, gom lại — gom tới khi hết; quy mô không bao giờ là lý do miễn\ntrừ. Tùm lum thấy ngoài phạm vi thì ghi thành item riêng; gom mà phải xây\ncông cụ mới là một câu hỏi quyết định. Đích của mọi lần gom\nlà một hình dạng duy nhất: ranh giới rõ, contract tường minh, đổi và biến\nhình dễ, không chắp vá.\n\nkhong phai no nang ma no tum lum"
    }
  },
  "currentTarget": null,
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Judgment",
    "reason": "outside-platform navigation or instruction decision; no carriage target"
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_5f15ada3e8a013ad4b1c962bd082ea68"
}
```

## Entry claim_12e5db9cba7b51a5d83d737740f873f3

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-closing-instructions.json",
  "collection": "claims",
  "claimId": "claim_12e5db9cba7b51a5d83d737740f873f3",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "s10-closing-instructions",
  "before": {
    "claimId": "claim_12e5db9cba7b51a5d83d737740f873f3",
    "sourceUnitDigest": "960948ac07d48bbfa4a8aacadb3243d066876e5789243ea58d067719ef620c85",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792076952136-42ac8e36@2026-10-15",
    "rationale": "L10-3: retain AGENTS.md#scratch-artifacts as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 515c0ae74369b29716645859cb36c1312aa0ecbf4602213b897d0bdee2ed537c, pinned at 980cb29312b8701f5ea639278f44e1a57a6e5c02."
  },
  "currentDecision": {
    "claimId": "claim_12e5db9cba7b51a5d83d737740f873f3",
    "sourceUnitDigest": "960948ac07d48bbfa4a8aacadb3243d066876e5789243ea58d067719ef620c85",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "L10-3: retain AGENTS.md#scratch-artifacts as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f, pinned at 59b9b70876324e07135db53d2351f7db6a7e1746. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried."
  },
  "native": {
    "kind": "units",
    "sourcePath": "AGENTS.md",
    "unitDigest": "447cd419cf40ea458f036ce4af2c7e37323d3e8a6579393bb74138e9a0cea917",
    "identityFingerprint": "89686e887dfa5b4776c167cf9d391470ac239da19d2e94781308b47c4d7ff297",
    "claimId": "claim_12e5db9cba7b51a5d83d737740f873f3",
    "sourceAnchor": "scratch-artifacts",
    "unitKind": "heading",
    "sourceUnitDigest": "960948ac07d48bbfa4a8aacadb3243d066876e5789243ea58d067719ef620c85",
    "claimKind": "unclassified",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "heading",
      "level": 2,
      "title": "Scratch artifacts",
      "anchor": "scratch-artifacts",
      "githubAnchor": "scratch-artifacts",
      "stableAnchor": "h-1dfd5f9c30aa",
      "startLine": 72,
      "endLine": 72,
      "textDigest": "960948ac07d48bbfa4a8aacadb3243d066876e5789243ea58d067719ef620c85",
      "sample": "Scratch artifacts",
      "sectionPayloadDigest": "ce273268d1c631cd2401722d415ec5e2fed97fab11ed089d8f81259f80152f80",
      "followingBlockDigest": "ce273268d1c631cd2401722d415ec5e2fed97fab11ed089d8f81259f80152f80",
      "identityFingerprint": "89686e887dfa5b4776c167cf9d391470ac239da19d2e94781308b47c4d7ff297",
      "ancestry": [
        "forgent"
      ],
      "text": "## Scratch artifacts",
      "sectionText": "## Scratch artifacts\n\nKeep draft scripts, logs, patches and dumps out of the repository root. Use\n`.fgos/runtime/tmp/`, falling back to `${TMPDIR:-/tmp}/fgos-work/`.\n`.githooks/pre-commit` owns the single root-file allowlist and refuses new root\nfiles outside it, including linked worktrees. Legitimate root additions require\nan allowlist change in a separate commit, landed on main before the addition.\nThe hook runs only when wired via `npm run setup:hooks`; `fgos doctor` checks\nthat wiring with `main-checkout-hook-wired`. `MERGE_HEAD` skips only the root\nguard, never existing data-loss guards."
    }
  },
  "currentTarget": null,
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Judgment",
    "reason": "outside-platform navigation or instruction decision; no carriage target"
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_12e5db9cba7b51a5d83d737740f873f3"
}
```

## Entry claim_9dd28187a839e2ce10f2e9dd3f020cdf

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-closing-instructions.json",
  "collection": "claims",
  "claimId": "claim_9dd28187a839e2ce10f2e9dd3f020cdf",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "s10-closing-instructions",
  "before": {
    "claimId": "claim_9dd28187a839e2ce10f2e9dd3f020cdf",
    "sourceUnitDigest": "ea437289b5b734237fdab9974e6b10855573dcba1c6a707ea7f51dc0d5c60c1e",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792076952136-42ac8e36@2026-10-15",
    "rationale": "L10-3: retain AGENTS.md#starting-the-fgos-gateway-one-door-never-a-raw-process as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 515c0ae74369b29716645859cb36c1312aa0ecbf4602213b897d0bdee2ed537c, pinned at 980cb29312b8701f5ea639278f44e1a57a6e5c02."
  },
  "currentDecision": {
    "claimId": "claim_9dd28187a839e2ce10f2e9dd3f020cdf",
    "sourceUnitDigest": "ea437289b5b734237fdab9974e6b10855573dcba1c6a707ea7f51dc0d5c60c1e",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "L10-3: retain AGENTS.md#starting-the-fgos-gateway-one-door-never-a-raw-process as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f, pinned at 59b9b70876324e07135db53d2351f7db6a7e1746. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried."
  },
  "native": {
    "kind": "units",
    "sourcePath": "AGENTS.md",
    "unitDigest": "25e50de9c5068dbf869d761965a07d7e23c716d006daf288c1186b30e7daf364",
    "identityFingerprint": "cce8c70423a062205dfc24d7706bc6ad3ee008e3de1a9752d90fef8ebc9fa1c3",
    "claimId": "claim_9dd28187a839e2ce10f2e9dd3f020cdf",
    "sourceAnchor": "starting-the-fgos-gateway-one-door-never-a-raw-process",
    "unitKind": "heading",
    "sourceUnitDigest": "ea437289b5b734237fdab9974e6b10855573dcba1c6a707ea7f51dc0d5c60c1e",
    "claimKind": "unclassified",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "heading",
      "level": 2,
      "title": "Starting the fgos gateway — one door, never a raw process",
      "anchor": "starting-the-fgos-gateway-one-door-never-a-raw-process",
      "githubAnchor": "starting-the-fgos-gateway-one-door-never-a-raw-process",
      "stableAnchor": "h-4a1d4cf49fd0",
      "startLine": 178,
      "endLine": 178,
      "textDigest": "ea437289b5b734237fdab9974e6b10855573dcba1c6a707ea7f51dc0d5c60c1e",
      "sample": "Starting the fgos gateway — one door, never a raw process",
      "sectionPayloadDigest": "ef5cbba01528872900e82f37785833b107cd0e4ee5d95379c8e9cae8a6f1a90c",
      "followingBlockDigest": "ef5cbba01528872900e82f37785833b107cd0e4ee5d95379c8e9cae8a6f1a90c",
      "identityFingerprint": "cce8c70423a062205dfc24d7706bc6ad3ee008e3de1a9752d90fef8ebc9fa1c3",
      "ancestry": [
        "forgent"
      ],
      "text": "## Starting the fgos gateway — one door, never a raw process",
      "sectionText": "## Starting the fgos gateway — one door, never a raw process\n\n**If a task needs the fgos gateway (REST API + web dashboard, binary `fgos-gateway` built from `apps/fgos-gateway`) running, run `fgos gateway start` — never a hand-rolled `cargo run`/`nohup`/`tmux`/systemd invocation.** (tsk-31v) This is the one place that builds the release binary and spawns it detached, so the process outlives the CLI call. `fgos gateway status` reports real liveness plus an actual `/v1/contract` reachability check; `fgos gateway stop` sends SIGTERM and clears the registry. The gateway's own MCP surface (`search`/`execute`, `apps/fgos-gateway/src/mcp.rs`) is mounted on this SAME process — it cannot bootstrap itself, so starting the gateway is always a `fgos` CLI call, never an MCP tool call.\n\n<!-- mdview:START -->"
    }
  },
  "currentTarget": null,
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Judgment",
    "reason": "outside-platform navigation or instruction decision; no carriage target"
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_9dd28187a839e2ce10f2e9dd3f020cdf"
}
```

## Entry claim_89185e56cc8ad38646b1045d993b3eb3

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-closing-instructions.json",
  "collection": "claims",
  "claimId": "claim_89185e56cc8ad38646b1045d993b3eb3",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "s10-closing-instructions",
  "before": {
    "claimId": "claim_89185e56cc8ad38646b1045d993b3eb3",
    "sourceUnitDigest": "0e1c4d453af7446fe6407a536afd028a8ba765267631778c410e15f2b8c03d3a",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792076952136-42ac8e36@2026-10-15",
    "rationale": "L10-3: retain AGENTS.md#unheaded-block-1 as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 515c0ae74369b29716645859cb36c1312aa0ecbf4602213b897d0bdee2ed537c, pinned at 980cb29312b8701f5ea639278f44e1a57a6e5c02."
  },
  "currentDecision": {
    "claimId": "claim_89185e56cc8ad38646b1045d993b3eb3",
    "sourceUnitDigest": "0e1c4d453af7446fe6407a536afd028a8ba765267631778c410e15f2b8c03d3a",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "L10-3: retain AGENTS.md#unheaded-block-1 as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f, pinned at 59b9b70876324e07135db53d2351f7db6a7e1746. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried."
  },
  "native": {
    "kind": "units",
    "sourcePath": "AGENTS.md",
    "unitDigest": "7abfe542e18d9618e720a67ffe6328458d08df20f7468d1974f71a558535bf7d",
    "identityFingerprint": "7abfe542e18d9618e720a67ffe6328458d08df20f7468d1974f71a558535bf7d",
    "claimId": "claim_89185e56cc8ad38646b1045d993b3eb3",
    "sourceAnchor": "unheaded-block-1",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "0e1c4d453af7446fe6407a536afd028a8ba765267631778c410e15f2b8c03d3a",
    "claimKind": "unclassified",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-1",
      "githubAnchor": "unheaded-block-1",
      "stableAnchor": "unheaded-block-1",
      "title": "Unheaded block 1",
      "startLine": 3,
      "endLine": 3,
      "textDigest": "0e1c4d453af7446fe6407a536afd028a8ba765267631778c410e15f2b8c03d3a",
      "sample": "**The Foundation for Generative Agents.**",
      "identityFingerprint": "7abfe542e18d9618e720a67ffe6328458d08df20f7468d1974f71a558535bf7d",
      "ancestry": [
        "forgent"
      ],
      "text": "**The Foundation for Generative Agents.**"
    }
  },
  "currentTarget": null,
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Judgment",
    "reason": "outside-platform navigation or instruction decision; no carriage target"
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_89185e56cc8ad38646b1045d993b3eb3"
}
```

## Entry claim_ea03152273de3a7844527cc84b92cdfd

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-closing-instructions.json",
  "collection": "claims",
  "claimId": "claim_ea03152273de3a7844527cc84b92cdfd",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "s10-closing-instructions",
  "before": {
    "claimId": "claim_ea03152273de3a7844527cc84b92cdfd",
    "sourceUnitDigest": "d511b50a182ac22df8994c43e7b61c81d2826a9279fa331e4a09a65d8d233874",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792076952136-42ac8e36@2026-10-15",
    "rationale": "L10-3: retain AGENTS.md#unheaded-block-10 as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 515c0ae74369b29716645859cb36c1312aa0ecbf4602213b897d0bdee2ed537c, pinned at 980cb29312b8701f5ea639278f44e1a57a6e5c02."
  },
  "currentDecision": {
    "claimId": "claim_ea03152273de3a7844527cc84b92cdfd",
    "sourceUnitDigest": "d511b50a182ac22df8994c43e7b61c81d2826a9279fa331e4a09a65d8d233874",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "L10-3: retain AGENTS.md#unheaded-block-10 as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f, pinned at 59b9b70876324e07135db53d2351f7db6a7e1746. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried."
  },
  "native": {
    "kind": "units",
    "sourcePath": "AGENTS.md",
    "unitDigest": "2bd9f2cc8633ecc85a74f179e9b3055d331cad945ef9793df35773a2aab2cec4",
    "identityFingerprint": "2bd9f2cc8633ecc85a74f179e9b3055d331cad945ef9793df35773a2aab2cec4",
    "claimId": "claim_ea03152273de3a7844527cc84b92cdfd",
    "sourceAnchor": "unheaded-block-10",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "d511b50a182ac22df8994c43e7b61c81d2826a9279fa331e4a09a65d8d233874",
    "claimKind": "specification",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-10",
      "githubAnchor": "unheaded-block-10",
      "stableAnchor": "unheaded-block-10",
      "title": "Unheaded block 10",
      "startLine": 43,
      "endLine": 50,
      "textDigest": "d511b50a182ac22df8994c43e7b61c81d2826a9279fa331e4a09a65d8d233874",
      "sample": "**Prior art before design.** Before designing a mechanism, find out what already existed\nand why it went away: `git log -S'<symbol>'` / `-G` on the symbol, config key and spec term",
      "identityFingerprint": "2bd9f2cc8633ecc85a74f179e9b3055d331cad945ef9793df35773a2aab2cec4",
      "ancestry": [
        "forgent",
        "Before touching code"
      ],
      "text": "**Prior art before design.** Before designing a mechanism, find out what already existed\nand why it went away: `git log -S'<symbol>'` / `-G` on the symbol, config key and spec term,\nalso under the executor ids and names the thing had before the renames (ids were renamed and\ndormant ones deleted), and read the area spec's \"Lịch sử quyết định\" and settled-facts\nsections. A plan's facts phase answers \"what existed before, and which change removed it,\nand was that intended?\" next to its questions about current code. Reuse or extend what is\nfound; say in the plan what was reused and what was missing.\n**Convention paths.** For report, plan, and journal names and locations—including paths placed in briefs for other agents—use `fgos convention name|path --json`, never construct them; parallel agents MUST choose distinct slugs, and pre-commit `convention check` warnings do not block commits."
    }
  },
  "currentTarget": null,
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Judgment",
    "reason": "outside-platform navigation or instruction decision; no carriage target"
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_ea03152273de3a7844527cc84b92cdfd"
}
```

## Entry claim_8ce5210314473b1e660025261f39ae5a

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-closing-instructions.json",
  "collection": "claims",
  "claimId": "claim_8ce5210314473b1e660025261f39ae5a",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "s10-closing-instructions",
  "before": {
    "claimId": "claim_8ce5210314473b1e660025261f39ae5a",
    "sourceUnitDigest": "0ac33ce3b212c69bd641ab67172cc109ba70735d9242bbee1b913ae1ff922aa1",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792076952136-42ac8e36@2026-10-15",
    "rationale": "L10-3: retain AGENTS.md#unheaded-block-11 as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 515c0ae74369b29716645859cb36c1312aa0ecbf4602213b897d0bdee2ed537c, pinned at 980cb29312b8701f5ea639278f44e1a57a6e5c02."
  },
  "currentDecision": {
    "claimId": "claim_8ce5210314473b1e660025261f39ae5a",
    "sourceUnitDigest": "0ac33ce3b212c69bd641ab67172cc109ba70735d9242bbee1b913ae1ff922aa1",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "L10-3: retain AGENTS.md#unheaded-block-11 as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f, pinned at 59b9b70876324e07135db53d2351f7db6a7e1746. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried."
  },
  "native": {
    "kind": "units",
    "sourcePath": "AGENTS.md",
    "unitDigest": "829ea882876aaf6865eee624f2f63ed8c3a3a0a55a419ba7ae9e5225f9862bc9",
    "identityFingerprint": "829ea882876aaf6865eee624f2f63ed8c3a3a0a55a419ba7ae9e5225f9862bc9",
    "claimId": "claim_8ce5210314473b1e660025261f39ae5a",
    "sourceAnchor": "unheaded-block-11",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "0ac33ce3b212c69bd641ab67172cc109ba70735d9242bbee1b913ae1ff922aa1",
    "claimKind": "historical-context",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-11",
      "githubAnchor": "unheaded-block-11",
      "stableAnchor": "unheaded-block-11",
      "title": "Unheaded block 11",
      "startLine": 54,
      "endLine": 54,
      "textDigest": "0ac33ce3b212c69bd641ab67172cc109ba70735d9242bbee1b913ae1ff922aa1",
      "sample": "A stranger agent with no chat history should be able to answer, for any change:",
      "identityFingerprint": "829ea882876aaf6865eee624f2f63ed8c3a3a0a55a419ba7ae9e5225f9862bc9",
      "ancestry": [
        "forgent",
        "Definition of done (platform-foundations L5)"
      ],
      "text": "A stranger agent with no chat history should be able to answer, for any change:"
    }
  },
  "currentTarget": null,
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Judgment",
    "reason": "outside-platform navigation or instruction decision; no carriage target"
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_8ce5210314473b1e660025261f39ae5a"
}
```

## Entry claim_d0e83fdb2650d447afd25c0f61efc4ec

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-closing-instructions.json",
  "collection": "claims",
  "claimId": "claim_d0e83fdb2650d447afd25c0f61efc4ec",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "s10-closing-instructions",
  "before": {
    "claimId": "claim_d0e83fdb2650d447afd25c0f61efc4ec",
    "sourceUnitDigest": "b390474069d64b0572bd78c4c0e0e47c2da91a5114360b4da7eb36cfea82a3b4",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792076952136-42ac8e36@2026-10-15",
    "rationale": "L10-3: retain AGENTS.md#unheaded-block-12 as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 515c0ae74369b29716645859cb36c1312aa0ecbf4602213b897d0bdee2ed537c, pinned at 980cb29312b8701f5ea639278f44e1a57a6e5c02."
  },
  "currentDecision": {
    "claimId": "claim_d0e83fdb2650d447afd25c0f61efc4ec",
    "sourceUnitDigest": "b390474069d64b0572bd78c4c0e0e47c2da91a5114360b4da7eb36cfea82a3b4",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "L10-3: retain AGENTS.md#unheaded-block-12 as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f, pinned at 59b9b70876324e07135db53d2351f7db6a7e1746. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried."
  },
  "native": {
    "kind": "units",
    "sourcePath": "AGENTS.md",
    "unitDigest": "6aefb1fae238d8a78b7361cc040a66e5fb04ddd786e1f3f990a8ad03da84cedc",
    "identityFingerprint": "6aefb1fae238d8a78b7361cc040a66e5fb04ddd786e1f3f990a8ad03da84cedc",
    "claimId": "claim_d0e83fdb2650d447afd25c0f61efc4ec",
    "sourceAnchor": "unheaded-block-12",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "b390474069d64b0572bd78c4c0e0e47c2da91a5114360b4da7eb36cfea82a3b4",
    "claimKind": "specification",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-12",
      "githubAnchor": "unheaded-block-12",
      "stableAnchor": "unheaded-block-12",
      "title": "Unheaded block 12",
      "startLine": 56,
      "endLine": 70,
      "textDigest": "b390474069d64b0572bd78c4c0e0e47c2da91a5114360b4da7eb36cfea82a3b4",
      "sample": "1. **What to read first?** `docs/specs/reading-map.md`, then the relevant area spec.\n2. **What kind of work is this?** Check it against the area's spec and\n   `docs/backlog.md`; a ",
      "identityFingerprint": "6aefb1fae238d8a78b7361cc040a66e5fb04ddd786e1f3f990a8ad03da84cedc",
      "ancestry": [
        "forgent",
        "Definition of done (platform-foundations L5)"
      ],
      "text": "1. **What to read first?** `docs/specs/reading-map.md`, then the relevant area spec.\n2. **What kind of work is this?** Check it against the area's spec and\n   `docs/backlog.md`; a new product area gets a spec before it gets code.\n3. **What contract does it touch?** `docs/routing-handoff-contract.md` for\n   agent-to-agent boundaries; the area spec's Shared Entities table for\n   in-process contracts.\n4. **How much risk?** Does it change a locked law in `docs/platform-foundations.md`,\n   or existing covered behavior in the test suite? Either raises the bar.\n5. **What proof means done?** `npm test` (state + cli + runner + e2e suite) green;\n   new or changed behavior gets a matching test. Green must come from real\n   behavior: never add an env switch, flag, or test-only code branch that skips\n   checks to make tests pass; fix production code or the fixture instead.\n6. **What learning gets left behind?** A settled decision goes into\n   `docs/decisions/`; a settled spec fact goes into the relevant\n   `docs/specs/<area>.md`."
    }
  },
  "currentTarget": null,
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Judgment",
    "reason": "outside-platform navigation or instruction decision; no carriage target"
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_d0e83fdb2650d447afd25c0f61efc4ec"
}
```

## Entry claim_ad994bc3d2c97fb0d69e749535454434

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-closing-instructions.json",
  "collection": "claims",
  "claimId": "claim_ad994bc3d2c97fb0d69e749535454434",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "s10-closing-instructions",
  "before": {
    "claimId": "claim_ad994bc3d2c97fb0d69e749535454434",
    "sourceUnitDigest": "ce273268d1c631cd2401722d415ec5e2fed97fab11ed089d8f81259f80152f80",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792076952136-42ac8e36@2026-10-15",
    "rationale": "L10-3: retain AGENTS.md#unheaded-block-13 as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 515c0ae74369b29716645859cb36c1312aa0ecbf4602213b897d0bdee2ed537c, pinned at 980cb29312b8701f5ea639278f44e1a57a6e5c02."
  },
  "currentDecision": {
    "claimId": "claim_ad994bc3d2c97fb0d69e749535454434",
    "sourceUnitDigest": "ce273268d1c631cd2401722d415ec5e2fed97fab11ed089d8f81259f80152f80",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "L10-3: retain AGENTS.md#unheaded-block-13 as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f, pinned at 59b9b70876324e07135db53d2351f7db6a7e1746. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried."
  },
  "native": {
    "kind": "units",
    "sourcePath": "AGENTS.md",
    "unitDigest": "c4dd883ef0fa26ab86a407e188a73a12f925f0e9537b2348c8c865c033b58926",
    "identityFingerprint": "c4dd883ef0fa26ab86a407e188a73a12f925f0e9537b2348c8c865c033b58926",
    "claimId": "claim_ad994bc3d2c97fb0d69e749535454434",
    "sourceAnchor": "unheaded-block-13",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "ce273268d1c631cd2401722d415ec5e2fed97fab11ed089d8f81259f80152f80",
    "claimKind": "unclassified",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-13",
      "githubAnchor": "unheaded-block-13",
      "stableAnchor": "unheaded-block-13",
      "title": "Unheaded block 13",
      "startLine": 74,
      "endLine": 81,
      "textDigest": "ce273268d1c631cd2401722d415ec5e2fed97fab11ed089d8f81259f80152f80",
      "sample": "Keep draft scripts, logs, patches and dumps out of the repository root. Use\n`.fgos/runtime/tmp/`, falling back to `${TMPDIR:-/tmp}/fgos-work/`.\n`.githooks/pre-commit` owns the sing",
      "identityFingerprint": "c4dd883ef0fa26ab86a407e188a73a12f925f0e9537b2348c8c865c033b58926",
      "ancestry": [
        "forgent",
        "Scratch artifacts"
      ],
      "text": "Keep draft scripts, logs, patches and dumps out of the repository root. Use\n`.fgos/runtime/tmp/`, falling back to `${TMPDIR:-/tmp}/fgos-work/`.\n`.githooks/pre-commit` owns the single root-file allowlist and refuses new root\nfiles outside it, including linked worktrees. Legitimate root additions require\nan allowlist change in a separate commit, landed on main before the addition.\nThe hook runs only when wired via `npm run setup:hooks`; `fgos doctor` checks\nthat wiring with `main-checkout-hook-wired`. `MERGE_HEAD` skips only the root\nguard, never existing data-loss guards."
    }
  },
  "currentTarget": null,
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Judgment",
    "reason": "outside-platform navigation or instruction decision; no carriage target"
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_ad994bc3d2c97fb0d69e749535454434"
}
```

## Entry claim_bb94912817abe39b4f476ea70b22d3ae

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-closing-instructions.json",
  "collection": "claims",
  "claimId": "claim_bb94912817abe39b4f476ea70b22d3ae",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "s10-closing-instructions",
  "before": {
    "claimId": "claim_bb94912817abe39b4f476ea70b22d3ae",
    "sourceUnitDigest": "1eaa0634f12da821254d772ea6bed7a0e6ecd4541de713eba0f573ab4b2c1052",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792076952136-42ac8e36@2026-10-15",
    "rationale": "L10-3: retain AGENTS.md#unheaded-block-15 as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 515c0ae74369b29716645859cb36c1312aa0ecbf4602213b897d0bdee2ed537c, pinned at 980cb29312b8701f5ea639278f44e1a57a6e5c02."
  },
  "currentDecision": {
    "claimId": "claim_bb94912817abe39b4f476ea70b22d3ae",
    "sourceUnitDigest": "1eaa0634f12da821254d772ea6bed7a0e6ecd4541de713eba0f573ab4b2c1052",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "L10-3: retain AGENTS.md#unheaded-block-15 as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f, pinned at 59b9b70876324e07135db53d2351f7db6a7e1746. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried."
  },
  "native": {
    "kind": "units",
    "sourcePath": "AGENTS.md",
    "unitDigest": "c44506d16346f698e2b2a257e746d89512e0b7fe7bbf602f1dd3ce5da8ba2568",
    "identityFingerprint": "c44506d16346f698e2b2a257e746d89512e0b7fe7bbf602f1dd3ce5da8ba2568",
    "claimId": "claim_bb94912817abe39b4f476ea70b22d3ae",
    "sourceAnchor": "unheaded-block-15",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "1eaa0634f12da821254d772ea6bed7a0e6ecd4541de713eba0f573ab4b2c1052",
    "claimKind": "unclassified",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-15",
      "githubAnchor": "unheaded-block-15",
      "stableAnchor": "unheaded-block-15",
      "title": "Unheaded block 15",
      "startLine": 96,
      "endLine": 102,
      "textDigest": "1eaa0634f12da821254d772ea6bed7a0e6ecd4541de713eba0f573ab4b2c1052",
      "sample": "Plain `fgos` runs the activated release recorded in\n`.fgos/installation/activation.json`, not newly edited `bin/` or `src/` bytes.\nUse `npm run fgos:dev -- <verb> [args]` to run wo",
      "identityFingerprint": "c44506d16346f698e2b2a257e746d89512e0b7fe7bbf602f1dd3ce5da8ba2568",
      "ancestry": [
        "forgent",
        "Legacy-Node CLI Ownership Boundary"
      ],
      "text": "Plain `fgos` runs the activated release recorded in\n`.fgos/installation/activation.json`, not newly edited `bin/` or `src/` bytes.\nUse `npm run fgos:dev -- <verb> [args]` to run working-tree code through the Rust\nhost. It preserves caller cwd via `INIT_CWD`, honors `CARGO_TARGET_DIR`, and\nmaterializes confined per-invocation artifacts under `.fgos/runtime/dev-host/`,\nremoving only its own directory after the child exits. Serialize invocations\nacross worktrees only where their Cargo target is actually shared."
    }
  },
  "currentTarget": null,
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Judgment",
    "reason": "outside-platform navigation or instruction decision; no carriage target"
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_bb94912817abe39b4f476ea70b22d3ae"
}
```

## Entry claim_01354c596b32d883dcceda730047e156

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-closing-instructions.json",
  "collection": "claims",
  "claimId": "claim_01354c596b32d883dcceda730047e156",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "s10-closing-instructions",
  "before": {
    "claimId": "claim_01354c596b32d883dcceda730047e156",
    "sourceUnitDigest": "879d83e8c8148a4e7cdc6086a8b06d7d7093e97e9cdddb7c0db1412443574e50",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792076952136-42ac8e36@2026-10-15",
    "rationale": "L10-3: retain AGENTS.md#unheaded-block-16 as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 515c0ae74369b29716645859cb36c1312aa0ecbf4602213b897d0bdee2ed537c, pinned at 980cb29312b8701f5ea639278f44e1a57a6e5c02."
  },
  "currentDecision": {
    "claimId": "claim_01354c596b32d883dcceda730047e156",
    "sourceUnitDigest": "879d83e8c8148a4e7cdc6086a8b06d7d7093e97e9cdddb7c0db1412443574e50",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "L10-3: retain AGENTS.md#unheaded-block-16 as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f, pinned at 59b9b70876324e07135db53d2351f7db6a7e1746. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried."
  },
  "native": {
    "kind": "units",
    "sourcePath": "AGENTS.md",
    "unitDigest": "d23d1df6cd4978077e3cf266d13f225875ed20e6e7e2565660b4b1187e0a2d84",
    "identityFingerprint": "d23d1df6cd4978077e3cf266d13f225875ed20e6e7e2565660b4b1187e0a2d84",
    "claimId": "claim_01354c596b32d883dcceda730047e156",
    "sourceAnchor": "unheaded-block-16",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "879d83e8c8148a4e7cdc6086a8b06d7d7093e97e9cdddb7c0db1412443574e50",
    "claimKind": "unclassified",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-16",
      "githubAnchor": "unheaded-block-16",
      "stableAnchor": "unheaded-block-16",
      "title": "Unheaded block 16",
      "startLine": 104,
      "endLine": 111,
      "textDigest": "879d83e8c8148a4e7cdc6086a8b06d7d7093e97e9cdddb7c0db1412443574e50",
      "sample": "`fgos doctor` check `active-release-matches-checkout` compares the owned source\ncheckout's working-tree Node payload with its activation; it does not certify\nRust freshness. Depend",
      "identityFingerprint": "d23d1df6cd4978077e3cf266d13f225875ed20e6e7e2565660b4b1187e0a2d84",
      "ancestry": [
        "forgent",
        "Legacy-Node CLI Ownership Boundary"
      ],
      "text": "`fgos doctor` check `active-release-matches-checkout` compares the owned source\ncheckout's working-tree Node payload with its activation; it does not certify\nRust freshness. Dependencies do not count as drift, but symlink/unsafe manifest\nentries still fail. It skips activation owned by main from a linked worktree\nand the same-checkout dev manifest. To update plain `fgos`, build/stage/activate\nthe intended tree, then verify doctor through the installed shim. Old-release\n`fgos setup` can overwrite generated render headers until that release is\nrestaged; activation never refreshes itself merely because source was edited."
    }
  },
  "currentTarget": null,
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Judgment",
    "reason": "outside-platform navigation or instruction decision; no carriage target"
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_01354c596b32d883dcceda730047e156"
}
```

## Entry claim_143633192ebdc23ebdd1b38df0ae42b0

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-closing-instructions.json",
  "collection": "claims",
  "claimId": "claim_143633192ebdc23ebdd1b38df0ae42b0",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "s10-closing-instructions",
  "before": {
    "claimId": "claim_143633192ebdc23ebdd1b38df0ae42b0",
    "sourceUnitDigest": "3f149be4bf754b1ad1a12eb8d3e7a24a1db97ca4aa3cf15fd7cf3bae732b7f3f",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792076952136-42ac8e36@2026-10-15",
    "rationale": "L10-3: retain AGENTS.md#unheaded-block-17 as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 515c0ae74369b29716645859cb36c1312aa0ecbf4602213b897d0bdee2ed537c, pinned at 980cb29312b8701f5ea639278f44e1a57a6e5c02."
  },
  "currentDecision": {
    "claimId": "claim_143633192ebdc23ebdd1b38df0ae42b0",
    "sourceUnitDigest": "3f149be4bf754b1ad1a12eb8d3e7a24a1db97ca4aa3cf15fd7cf3bae732b7f3f",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "L10-3: retain AGENTS.md#unheaded-block-17 as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f, pinned at 59b9b70876324e07135db53d2351f7db6a7e1746. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried."
  },
  "native": {
    "kind": "units",
    "sourcePath": "AGENTS.md",
    "unitDigest": "1f4df04e8a093a9e4b545f4fc3b8f13f8779e11f879d4d329ed60ff33a202e11",
    "identityFingerprint": "1f4df04e8a093a9e4b545f4fc3b8f13f8779e11f879d4d329ed60ff33a202e11",
    "claimId": "claim_143633192ebdc23ebdd1b38df0ae42b0",
    "sourceAnchor": "unheaded-block-17",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "3f149be4bf754b1ad1a12eb8d3e7a24a1db97ca4aa3cf15fd7cf3bae732b7f3f",
    "claimKind": "vision",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-17",
      "githubAnchor": "unheaded-block-17",
      "stableAnchor": "unheaded-block-17",
      "title": "Unheaded block 17",
      "startLine": 115,
      "endLine": 116,
      "textDigest": "3f149be4bf754b1ad1a12eb8d3e7a24a1db97ca4aa3cf15fd7cf3bae732b7f3f",
      "sample": "`docs/distribution-vision.md` sets the direction for this repo's own\ncài đặt/setup/doctor story. Before any change is done, ask:",
      "identityFingerprint": "1f4df04e8a093a9e4b545f4fc3b8f13f8779e11f879d4d329ed60ff33a202e11",
      "ancestry": [
        "forgent",
        "Install/setup/doctor gate"
      ],
      "text": "`docs/distribution-vision.md` sets the direction for this repo's own\ncài đặt/setup/doctor story. Before any change is done, ask:"
    }
  },
  "currentTarget": null,
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Judgment",
    "reason": "outside-platform navigation or instruction decision; no carriage target"
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_143633192ebdc23ebdd1b38df0ae42b0"
}
```

## Entry claim_423281216eb15889f63560a84ca0959a

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-closing-instructions.json",
  "collection": "claims",
  "claimId": "claim_423281216eb15889f63560a84ca0959a",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "s10-closing-instructions",
  "before": {
    "claimId": "claim_423281216eb15889f63560a84ca0959a",
    "sourceUnitDigest": "e33601b47f3590f43b695faa7647181ca8e7d5ee83cb8944bcf976ff4e801197",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792076952136-42ac8e36@2026-10-15",
    "rationale": "L10-3: retain AGENTS.md#unheaded-block-18 as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 515c0ae74369b29716645859cb36c1312aa0ecbf4602213b897d0bdee2ed537c, pinned at 980cb29312b8701f5ea639278f44e1a57a6e5c02."
  },
  "currentDecision": {
    "claimId": "claim_423281216eb15889f63560a84ca0959a",
    "sourceUnitDigest": "e33601b47f3590f43b695faa7647181ca8e7d5ee83cb8944bcf976ff4e801197",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "L10-3: retain AGENTS.md#unheaded-block-18 as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f, pinned at 59b9b70876324e07135db53d2351f7db6a7e1746. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried."
  },
  "native": {
    "kind": "units",
    "sourcePath": "AGENTS.md",
    "unitDigest": "f1db613f54535e0036ed5c2f758b8e4f15e9f78fc89f3d3e30282c24507e9147",
    "identityFingerprint": "f1db613f54535e0036ed5c2f758b8e4f15e9f78fc89f3d3e30282c24507e9147",
    "claimId": "claim_423281216eb15889f63560a84ca0959a",
    "sourceAnchor": "unheaded-block-18",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "e33601b47f3590f43b695faa7647181ca8e7d5ee83cb8944bcf976ff4e801197",
    "claimKind": "unclassified",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-18",
      "githubAnchor": "unheaded-block-18",
      "stableAnchor": "unheaded-block-18",
      "title": "Unheaded block 18",
      "startLine": 118,
      "endLine": 131,
      "textDigest": "e33601b47f3590f43b695faa7647181ca8e7d5ee83cb8944bcf976ff4e801197",
      "sample": "- Does this add a config default, env var, or infra dependency (a new\n  file it expects to exist, a tool it shells out to, a directory it\n  assumes is writable)? If yes, it must re",
      "identityFingerprint": "f1db613f54535e0036ed5c2f758b8e4f15e9f78fc89f3d3e30282c24507e9147",
      "ancestry": [
        "forgent",
        "Install/setup/doctor gate"
      ],
      "text": "- Does this add a config default, env var, or infra dependency (a new\n  file it expects to exist, a tool it shells out to, a directory it\n  assumes is writable)? If yes, it must register into `fgos setup`'s\n  config-merge and `fgos doctor`'s check registry (`src/setup/checks.mjs`)\n  — not stand alone, undiscoverable by `doctor`.\n- Never hardcode an assumption about which install level (global vs\n  project) is active — per the vision doc, project config always\n  overwrites global, and fgOS stays aware of both without conflict.\n- If the change touches how fgOS gets installed, upgraded, or diagnosed at\n  all, read `docs/distribution-vision.md` and `docs/specs/distribution.md`\n  first — a new module gets a spec/config-registry entry before it gets\n  code, same bar as a new product area (question 2 above).\n- Does this change something a user of fgOS would see? If yes, add a line\n  to `## [Unreleased]` in `CHANGELOG.md`."
    }
  },
  "currentTarget": null,
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Judgment",
    "reason": "outside-platform navigation or instruction decision; no carriage target"
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_423281216eb15889f63560a84ca0959a"
}
```

## Entry claim_2240f88d1d1a961cc8ce6c8517572f36

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-closing-instructions.json",
  "collection": "claims",
  "claimId": "claim_2240f88d1d1a961cc8ce6c8517572f36",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "s10-closing-instructions",
  "before": {
    "claimId": "claim_2240f88d1d1a961cc8ce6c8517572f36",
    "sourceUnitDigest": "d8b0fa240f28f96e7b3f9f24704c72a898d7b0d64a37662d2179c5f0c7216a71",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792076952136-42ac8e36@2026-10-15",
    "rationale": "L10-3: retain AGENTS.md#unheaded-block-19 as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 515c0ae74369b29716645859cb36c1312aa0ecbf4602213b897d0bdee2ed537c, pinned at 980cb29312b8701f5ea639278f44e1a57a6e5c02."
  },
  "currentDecision": {
    "claimId": "claim_2240f88d1d1a961cc8ce6c8517572f36",
    "sourceUnitDigest": "d8b0fa240f28f96e7b3f9f24704c72a898d7b0d64a37662d2179c5f0c7216a71",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "L10-3: retain AGENTS.md#unheaded-block-19 as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f, pinned at 59b9b70876324e07135db53d2351f7db6a7e1746. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried."
  },
  "native": {
    "kind": "units",
    "sourcePath": "AGENTS.md",
    "unitDigest": "cad0dc701ee2d9490016c461844c4577a74e05715278200a6f89553950039951",
    "identityFingerprint": "cad0dc701ee2d9490016c461844c4577a74e05715278200a6f89553950039951",
    "claimId": "claim_2240f88d1d1a961cc8ce6c8517572f36",
    "sourceAnchor": "unheaded-block-19",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "d8b0fa240f28f96e7b3f9f24704c72a898d7b0d64a37662d2179c5f0c7216a71",
    "claimKind": "decision",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-19",
      "githubAnchor": "unheaded-block-19",
      "stableAnchor": "unheaded-block-19",
      "title": "Unheaded block 19",
      "startLine": 135,
      "endLine": 136,
      "textDigest": "d8b0fa240f28f96e7b3f9f24704c72a898d7b0d64a37662d2179c5f0c7216a71",
      "sample": "Laws in `docs/platform-foundations.md` are fixed until their named review\nthreshold is hit. Changing one supersedes its decision ID — never edit it in place.",
      "identityFingerprint": "cad0dc701ee2d9490016c461844c4577a74e05715278200a6f89553950039951",
      "ancestry": [
        "forgent",
        "Changing a locked law"
      ],
      "text": "Laws in `docs/platform-foundations.md` are fixed until their named review\nthreshold is hit. Changing one supersedes its decision ID — never edit it in place."
    }
  },
  "currentTarget": null,
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Judgment",
    "reason": "outside-platform navigation or instruction decision; no carriage target"
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_2240f88d1d1a961cc8ce6c8517572f36"
}
```

## Entry claim_9651770c2d3f7530312292fe3e96176b

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-closing-instructions.json",
  "collection": "claims",
  "claimId": "claim_9651770c2d3f7530312292fe3e96176b",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "s10-closing-instructions",
  "before": {
    "claimId": "claim_9651770c2d3f7530312292fe3e96176b",
    "sourceUnitDigest": "babd3d9aafc706794ad0a450194ec0cc7eef902802d73a383fb4ddf3e94392e5",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792076952136-42ac8e36@2026-10-15",
    "rationale": "L10-3: retain AGENTS.md#unheaded-block-2 as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 515c0ae74369b29716645859cb36c1312aa0ecbf4602213b897d0bdee2ed537c, pinned at 980cb29312b8701f5ea639278f44e1a57a6e5c02."
  },
  "currentDecision": {
    "claimId": "claim_9651770c2d3f7530312292fe3e96176b",
    "sourceUnitDigest": "babd3d9aafc706794ad0a450194ec0cc7eef902802d73a383fb4ddf3e94392e5",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "L10-3: retain AGENTS.md#unheaded-block-2 as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f, pinned at 59b9b70876324e07135db53d2351f7db6a7e1746. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried."
  },
  "native": {
    "kind": "units",
    "sourcePath": "AGENTS.md",
    "unitDigest": "3d1392fda430780460dfe609f7d4bebbfa0f030252e2501aafc922a6df323dab",
    "identityFingerprint": "3d1392fda430780460dfe609f7d4bebbfa0f030252e2501aafc922a6df323dab",
    "claimId": "claim_9651770c2d3f7530312292fe3e96176b",
    "sourceAnchor": "unheaded-block-2",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "babd3d9aafc706794ad0a450194ec0cc7eef902802d73a383fb4ddf3e94392e5",
    "claimKind": "unclassified",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-2",
      "githubAnchor": "unheaded-block-2",
      "stableAnchor": "unheaded-block-2",
      "title": "Unheaded block 2",
      "startLine": 5,
      "endLine": 5,
      "textDigest": "babd3d9aafc706794ad0a450194ec0cc7eef902802d73a383fb4ddf3e94392e5",
      "sample": "Forgent (fgOS) is the platform layer for building and running agent applications — the infrastructure, skills, and automation that sit beneath every agent app, so developers can fo",
      "identityFingerprint": "3d1392fda430780460dfe609f7d4bebbfa0f030252e2501aafc922a6df323dab",
      "ancestry": [
        "forgent"
      ],
      "text": "Forgent (fgOS) is the platform layer for building and running agent applications — the infrastructure, skills, and automation that sit beneath every agent app, so developers can forge new agents instead of building everything from scratch."
    }
  },
  "currentTarget": null,
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Judgment",
    "reason": "outside-platform navigation or instruction decision; no carriage target"
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_9651770c2d3f7530312292fe3e96176b"
}
```

## Entry claim_bb0f60933b1e135c60b80e82db86625d

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-closing-instructions.json",
  "collection": "claims",
  "claimId": "claim_bb0f60933b1e135c60b80e82db86625d",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "s10-closing-instructions",
  "before": {
    "claimId": "claim_bb0f60933b1e135c60b80e82db86625d",
    "sourceUnitDigest": "38f511a5d090b7f9fc9b928ea29af5d75e01bfe5c18e3287977d5a335e2a7fcf",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792076952136-42ac8e36@2026-10-15",
    "rationale": "L10-3: retain AGENTS.md#unheaded-block-20 as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 515c0ae74369b29716645859cb36c1312aa0ecbf4602213b897d0bdee2ed537c, pinned at 980cb29312b8701f5ea639278f44e1a57a6e5c02."
  },
  "currentDecision": {
    "claimId": "claim_bb0f60933b1e135c60b80e82db86625d",
    "sourceUnitDigest": "38f511a5d090b7f9fc9b928ea29af5d75e01bfe5c18e3287977d5a335e2a7fcf",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "L10-3: retain AGENTS.md#unheaded-block-20 as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f, pinned at 59b9b70876324e07135db53d2351f7db6a7e1746. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried."
  },
  "native": {
    "kind": "units",
    "sourcePath": "AGENTS.md",
    "unitDigest": "c55032e5be8b07532df393b7d063e8b759b9c801cb118cb611059d08f021481a",
    "identityFingerprint": "c55032e5be8b07532df393b7d063e8b759b9c801cb118cb611059d08f021481a",
    "claimId": "claim_bb0f60933b1e135c60b80e82db86625d",
    "sourceAnchor": "unheaded-block-20",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "38f511a5d090b7f9fc9b928ea29af5d75e01bfe5c18e3287977d5a335e2a7fcf",
    "claimKind": "unclassified",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-20",
      "githubAnchor": "unheaded-block-20",
      "stableAnchor": "unheaded-block-20",
      "title": "Unheaded block 20",
      "startLine": 140,
      "endLine": 146,
      "textDigest": "38f511a5d090b7f9fc9b928ea29af5d75e01bfe5c18e3287977d5a335e2a7fcf",
      "sample": "Việc trở nặng không vì bản chất nó lớn mà vì thiếu và quên — tên đúng của\ntình trạng đó là tùm lum, không phải nặng. Khi thấy tùm lum trong phạm vi\nviệc đang làm, gom lại — gom tới",
      "identityFingerprint": "c55032e5be8b07532df393b7d063e8b759b9c801cb118cb611059d08f021481a",
      "ancestry": [
        "forgent",
        "RUL11 — tùm lum, không phải nặng (D-ADR0054, supersedes D-ADR0036, docs/specs/platform-foundations.md)"
      ],
      "text": "Việc trở nặng không vì bản chất nó lớn mà vì thiếu và quên — tên đúng của\ntình trạng đó là tùm lum, không phải nặng. Khi thấy tùm lum trong phạm vi\nviệc đang làm, gom lại — gom tới khi hết; quy mô không bao giờ là lý do miễn\ntrừ. Tùm lum thấy ngoài phạm vi thì ghi thành item riêng; gom mà phải xây\ncông cụ mới là một câu hỏi quyết định. Đích của mọi lần gom\nlà một hình dạng duy nhất: ranh giới rõ, contract tường minh, đổi và biến\nhình dễ, không chắp vá."
    }
  },
  "currentTarget": null,
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Judgment",
    "reason": "outside-platform navigation or instruction decision; no carriage target"
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_bb0f60933b1e135c60b80e82db86625d"
}
```

## Entry claim_442a4d4d948d6535b15da70f73519395

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-closing-instructions.json",
  "collection": "claims",
  "claimId": "claim_442a4d4d948d6535b15da70f73519395",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "s10-closing-instructions",
  "before": {
    "claimId": "claim_442a4d4d948d6535b15da70f73519395",
    "sourceUnitDigest": "48a48fccb2f49e68118ccf48cd466cc2fda6ecfd606caeaac32f64a387c72841",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792076952136-42ac8e36@2026-10-15",
    "rationale": "L10-3: retain AGENTS.md#unheaded-block-21 as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 515c0ae74369b29716645859cb36c1312aa0ecbf4602213b897d0bdee2ed537c, pinned at 980cb29312b8701f5ea639278f44e1a57a6e5c02."
  },
  "currentDecision": {
    "claimId": "claim_442a4d4d948d6535b15da70f73519395",
    "sourceUnitDigest": "48a48fccb2f49e68118ccf48cd466cc2fda6ecfd606caeaac32f64a387c72841",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "L10-3: retain AGENTS.md#unheaded-block-21 as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f, pinned at 59b9b70876324e07135db53d2351f7db6a7e1746. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried."
  },
  "native": {
    "kind": "units",
    "sourcePath": "AGENTS.md",
    "unitDigest": "58845dac9fa56af575c4751d6eb9bb4917924c7aae974a87177386224194eebb",
    "identityFingerprint": "58845dac9fa56af575c4751d6eb9bb4917924c7aae974a87177386224194eebb",
    "claimId": "claim_442a4d4d948d6535b15da70f73519395",
    "sourceAnchor": "unheaded-block-21",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "48a48fccb2f49e68118ccf48cd466cc2fda6ecfd606caeaac32f64a387c72841",
    "claimKind": "unclassified",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-21",
      "githubAnchor": "unheaded-block-21",
      "stableAnchor": "unheaded-block-21",
      "title": "Unheaded block 21",
      "startLine": 148,
      "endLine": 148,
      "textDigest": "48a48fccb2f49e68118ccf48cd466cc2fda6ecfd606caeaac32f64a387c72841",
      "sample": "khong phai no nang ma no tum lum",
      "identityFingerprint": "58845dac9fa56af575c4751d6eb9bb4917924c7aae974a87177386224194eebb",
      "ancestry": [
        "forgent",
        "RUL11 — tùm lum, không phải nặng (D-ADR0054, supersedes D-ADR0036, docs/specs/platform-foundations.md)"
      ],
      "text": "khong phai no nang ma no tum lum"
    }
  },
  "currentTarget": null,
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Judgment",
    "reason": "outside-platform navigation or instruction decision; no carriage target"
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_442a4d4d948d6535b15da70f73519395"
}
```

## Entry claim_bfd24ffa5a43c26830bb9771c04de7f1

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-closing-instructions.json",
  "collection": "claims",
  "claimId": "claim_bfd24ffa5a43c26830bb9771c04de7f1",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "s10-closing-instructions",
  "before": {
    "claimId": "claim_bfd24ffa5a43c26830bb9771c04de7f1",
    "sourceUnitDigest": "b093c6fb2a5d0ad347222f5cd68b1b44614799ac24ed54b60a29134c5f7ddfb8",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792076952136-42ac8e36@2026-10-15",
    "rationale": "L10-3: retain AGENTS.md#unheaded-block-22 as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 515c0ae74369b29716645859cb36c1312aa0ecbf4602213b897d0bdee2ed537c, pinned at 980cb29312b8701f5ea639278f44e1a57a6e5c02."
  },
  "currentDecision": {
    "claimId": "claim_bfd24ffa5a43c26830bb9771c04de7f1",
    "sourceUnitDigest": "b093c6fb2a5d0ad347222f5cd68b1b44614799ac24ed54b60a29134c5f7ddfb8",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "L10-3: retain AGENTS.md#unheaded-block-22 as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f, pinned at 59b9b70876324e07135db53d2351f7db6a7e1746. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried."
  },
  "native": {
    "kind": "units",
    "sourcePath": "AGENTS.md",
    "unitDigest": "32131ae0ab24fa7ab8ccc53bf267eee749d6b8ce58bd17d7f0b960d4e21c35ae",
    "identityFingerprint": "32131ae0ab24fa7ab8ccc53bf267eee749d6b8ce58bd17d7f0b960d4e21c35ae",
    "claimId": "claim_bfd24ffa5a43c26830bb9771c04de7f1",
    "sourceAnchor": "unheaded-block-22",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "b093c6fb2a5d0ad347222f5cd68b1b44614799ac24ed54b60a29134c5f7ddfb8",
    "claimKind": "unclassified",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-22",
      "githubAnchor": "unheaded-block-22",
      "stableAnchor": "unheaded-block-22",
      "title": "Unheaded block 22",
      "startLine": 152,
      "endLine": 152,
      "textDigest": "b093c6fb2a5d0ad347222f5cd68b1b44614799ac24ed54b60a29134c5f7ddfb8",
      "sample": "`fgos run` is the primary door for executing new work in the execution core.",
      "identityFingerprint": "32131ae0ab24fa7ab8ccc53bf267eee749d6b8ce58bd17d7f0b960d4e21c35ae",
      "ancestry": [
        "forgent",
        "Dispatch — routing work to an executor"
      ],
      "text": "`fgos run` is the primary door for executing new work in the execution core."
    }
  },
  "currentTarget": null,
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Judgment",
    "reason": "outside-platform navigation or instruction decision; no carriage target"
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_bfd24ffa5a43c26830bb9771c04de7f1"
}
```

## Entry claim_33713bd504d89af5cfb1eb5d6fa16d01

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-closing-instructions.json",
  "collection": "claims",
  "claimId": "claim_33713bd504d89af5cfb1eb5d6fa16d01",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "s10-closing-instructions",
  "before": {
    "claimId": "claim_33713bd504d89af5cfb1eb5d6fa16d01",
    "sourceUnitDigest": "88710807df8d6f060e3bd95f8ead6bdab4cca68dd6aed10fad45ebd46ac64333",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792076952136-42ac8e36@2026-10-15",
    "rationale": "L10-3: retain AGENTS.md#unheaded-block-23 as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 515c0ae74369b29716645859cb36c1312aa0ecbf4602213b897d0bdee2ed537c, pinned at 980cb29312b8701f5ea639278f44e1a57a6e5c02."
  },
  "currentDecision": {
    "claimId": "claim_33713bd504d89af5cfb1eb5d6fa16d01",
    "sourceUnitDigest": "88710807df8d6f060e3bd95f8ead6bdab4cca68dd6aed10fad45ebd46ac64333",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "L10-3: retain AGENTS.md#unheaded-block-23 as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f, pinned at 59b9b70876324e07135db53d2351f7db6a7e1746. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried."
  },
  "native": {
    "kind": "units",
    "sourcePath": "AGENTS.md",
    "unitDigest": "f835ee42aee59e3f916f5f10376a6e0fbde1b9d8e35407abaf21a7632a89ebdb",
    "identityFingerprint": "f835ee42aee59e3f916f5f10376a6e0fbde1b9d8e35407abaf21a7632a89ebdb",
    "claimId": "claim_33713bd504d89af5cfb1eb5d6fa16d01",
    "sourceAnchor": "unheaded-block-23",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "88710807df8d6f060e3bd95f8ead6bdab4cca68dd6aed10fad45ebd46ac64333",
    "claimKind": "unclassified",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-23",
      "githubAnchor": "unheaded-block-23",
      "stableAnchor": "unheaded-block-23",
      "title": "Unheaded block 23",
      "startLine": 154,
      "endLine": 154,
      "textDigest": "88710807df8d6f060e3bd95f8ead6bdab4cca68dd6aed10fad45ebd46ac64333",
      "sample": "**Two doors, one runUnit — the preferred path for new work.** One task: `fgos run \"<prompt>\" [--provider <id>] [--writes <paths> --worktree <path>]` builds a Unit from the prompt (",
      "identityFingerprint": "f835ee42aee59e3f916f5f10376a6e0fbde1b9d8e35407abaf21a7632a89ebdb",
      "ancestry": [
        "forgent",
        "Dispatch — routing work to an executor"
      ],
      "text": "**Two doors, one runUnit — the preferred path for new work.** One task: `fgos run \"<prompt>\" [--provider <id>] [--writes <paths> --worktree <path>]` builds a Unit from the prompt (read-only without `--writes`; `--writes` needs a linked worktree; `--provider` is a soft preference, not a pin). Planned work: `fgos workflow start <preset>|--units <file>`, one step per Unit. Both bind through `bind()`; the runner commits only the Unit's declared `writes` after a passing round, and the worker never runs `git add`/`git commit`. These two doors are the only ones that execute work; `fgos dispatch` keeps only the lower-level reads (`decide`, `inspect`, `reconcile`, `probe-account`)."
    }
  },
  "currentTarget": null,
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Judgment",
    "reason": "outside-platform navigation or instruction decision; no carriage target"
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_33713bd504d89af5cfb1eb5d6fa16d01"
}
```

## Entry claim_7d42588d114718c42e806e4070f1a22c

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-closing-instructions.json",
  "collection": "claims",
  "claimId": "claim_7d42588d114718c42e806e4070f1a22c",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "s10-closing-instructions",
  "before": {
    "claimId": "claim_7d42588d114718c42e806e4070f1a22c",
    "sourceUnitDigest": "22f293adbd476c3d765f9b9a328ce2ca00f6acb474d5817225c0cc1c2da49ace",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792076952136-42ac8e36@2026-10-15",
    "rationale": "L10-3: retain AGENTS.md#unheaded-block-25 as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 515c0ae74369b29716645859cb36c1312aa0ecbf4602213b897d0bdee2ed537c, pinned at 980cb29312b8701f5ea639278f44e1a57a6e5c02."
  },
  "currentDecision": {
    "claimId": "claim_7d42588d114718c42e806e4070f1a22c",
    "sourceUnitDigest": "22f293adbd476c3d765f9b9a328ce2ca00f6acb474d5817225c0cc1c2da49ace",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "L10-3: retain AGENTS.md#unheaded-block-25 as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f, pinned at 59b9b70876324e07135db53d2351f7db6a7e1746. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried."
  },
  "native": {
    "kind": "units",
    "sourcePath": "AGENTS.md",
    "unitDigest": "625f4030ba1ea8e1d56a46b00a5b59f507074f02edaea2b7c91cb2addaee929d",
    "identityFingerprint": "625f4030ba1ea8e1d56a46b00a5b59f507074f02edaea2b7c91cb2addaee929d",
    "claimId": "claim_7d42588d114718c42e806e4070f1a22c",
    "sourceAnchor": "unheaded-block-25",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "22f293adbd476c3d765f9b9a328ce2ca00f6acb474d5817225c0cc1c2da49ace",
    "claimKind": "unclassified",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-25",
      "githubAnchor": "unheaded-block-25",
      "stableAnchor": "unheaded-block-25",
      "title": "Unheaded block 25",
      "startLine": 158,
      "endLine": 158,
      "textDigest": "22f293adbd476c3d765f9b9a328ce2ca00f6acb474d5817225c0cc1c2da49ace",
      "sample": "**Before dispatching any task out of the current turn — a work item, a registered executor, an ad-hoc task, or your own direct Agent/Task-tool call — run `fgos dispatch decide` (or",
      "identityFingerprint": "625f4030ba1ea8e1d56a46b00a5b59f507074f02edaea2b7c91cb2addaee929d",
      "ancestry": [
        "forgent",
        "Dispatch — routing work to an executor"
      ],
      "text": "**Before dispatching any task out of the current turn — a work item, a registered executor, an ad-hoc task, or your own direct Agent/Task-tool call — run `fgos dispatch decide` (or compatibility alias `node src/runner/dispatch.mjs decide`; `--work` only through `fgos dispatch decide`) first. Never decide the mechanism yourself.** A `PreToolUse` hook enforces this on Agent/Task-tool calls: it delegates to `bind()` and refuses the call when the answer comes back as anything other than `in-process`."
    }
  },
  "currentTarget": null,
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Judgment",
    "reason": "outside-platform navigation or instruction decision; no carriage target"
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_7d42588d114718c42e806e4070f1a22c"
}
```

## Entry claim_2e415bdb6f89215b30a9306f2b525bf7

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-closing-instructions.json",
  "collection": "claims",
  "claimId": "claim_2e415bdb6f89215b30a9306f2b525bf7",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "s10-closing-instructions",
  "before": {
    "claimId": "claim_2e415bdb6f89215b30a9306f2b525bf7",
    "sourceUnitDigest": "19dace9440953c3a6867e37dd8cc45293a339d4a4fae79d7ff7c870461afb2d3",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792076952136-42ac8e36@2026-10-15",
    "rationale": "L10-3: retain AGENTS.md#unheaded-block-26 as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 515c0ae74369b29716645859cb36c1312aa0ecbf4602213b897d0bdee2ed537c, pinned at 980cb29312b8701f5ea639278f44e1a57a6e5c02."
  },
  "currentDecision": {
    "claimId": "claim_2e415bdb6f89215b30a9306f2b525bf7",
    "sourceUnitDigest": "19dace9440953c3a6867e37dd8cc45293a339d4a4fae79d7ff7c870461afb2d3",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "L10-3: retain AGENTS.md#unheaded-block-26 as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f, pinned at 59b9b70876324e07135db53d2351f7db6a7e1746. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried."
  },
  "native": {
    "kind": "units",
    "sourcePath": "AGENTS.md",
    "unitDigest": "3af6c481b85cf5330944b67a068233bbce008b9eecd028a58868db3a3a2f6135",
    "identityFingerprint": "3af6c481b85cf5330944b67a068233bbce008b9eecd028a58868db3a3a2f6135",
    "claimId": "claim_2e415bdb6f89215b30a9306f2b525bf7",
    "sourceAnchor": "unheaded-block-26",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "19dace9440953c3a6867e37dd8cc45293a339d4a4fae79d7ff7c870461afb2d3",
    "claimKind": "unclassified",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-26",
      "githubAnchor": "unheaded-block-26",
      "stableAnchor": "unheaded-block-26",
      "title": "Unheaded block 26",
      "startLine": 160,
      "endLine": 160,
      "textDigest": "19dace9440953c3a6867e37dd8cc45293a339d4a4fae79d7ff7c870461afb2d3",
      "sample": "Four ways to call `decide`, for four different situations:",
      "identityFingerprint": "3af6c481b85cf5330944b67a068233bbce008b9eecd028a58868db3a3a2f6135",
      "ancestry": [
        "forgent",
        "Dispatch — routing work to an executor"
      ],
      "text": "Four ways to call `decide`, for four different situations:"
    }
  },
  "currentTarget": null,
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Judgment",
    "reason": "outside-platform navigation or instruction decision; no carriage target"
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_2e415bdb6f89215b30a9306f2b525bf7"
}
```

## Entry claim_351e6c4a4690c52f77aee859728d1140

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-closing-instructions.json",
  "collection": "claims",
  "claimId": "claim_351e6c4a4690c52f77aee859728d1140",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "s10-closing-instructions",
  "before": {
    "claimId": "claim_351e6c4a4690c52f77aee859728d1140",
    "sourceUnitDigest": "227ca5a5e89112140bd9827bb072840016509dd62d8868ad83d5feccd5715906",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792076952136-42ac8e36@2026-10-15",
    "rationale": "L10-3: retain AGENTS.md#unheaded-block-27 as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 515c0ae74369b29716645859cb36c1312aa0ecbf4602213b897d0bdee2ed537c, pinned at 980cb29312b8701f5ea639278f44e1a57a6e5c02."
  },
  "currentDecision": {
    "claimId": "claim_351e6c4a4690c52f77aee859728d1140",
    "sourceUnitDigest": "227ca5a5e89112140bd9827bb072840016509dd62d8868ad83d5feccd5715906",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "L10-3: retain AGENTS.md#unheaded-block-27 as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f, pinned at 59b9b70876324e07135db53d2351f7db6a7e1746. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried."
  },
  "native": {
    "kind": "units",
    "sourcePath": "AGENTS.md",
    "unitDigest": "c8cebad809cd76a514660363a0b440cb9f9b4dbbcdbabe6d74e83d5fcc239369",
    "identityFingerprint": "c8cebad809cd76a514660363a0b440cb9f9b4dbbcdbabe6d74e83d5fcc239369",
    "claimId": "claim_351e6c4a4690c52f77aee859728d1140",
    "sourceAnchor": "unheaded-block-27",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "227ca5a5e89112140bd9827bb072840016509dd62d8868ad83d5feccd5715906",
    "claimKind": "unclassified",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-27",
      "githubAnchor": "unheaded-block-27",
      "stableAnchor": "unheaded-block-27",
      "title": "Unheaded block 27",
      "startLine": 162,
      "endLine": 165,
      "textDigest": "227ca5a5e89112140bd9827bb072840016509dd62d8868ad83d5feccd5715906",
      "sample": "- `decide <executorId>` — you already know the exact executor name (e.g. `judge-discovery`).\n- `decide --for <purpose>` — you know what JOB you need done (e.g. `judge`), but not wh",
      "identityFingerprint": "c8cebad809cd76a514660363a0b440cb9f9b4dbbcdbabe6d74e83d5fcc239369",
      "ancestry": [
        "forgent",
        "Dispatch — routing work to an executor"
      ],
      "text": "- `decide <executorId>` — you already know the exact executor name (e.g. `judge-discovery`).\n- `decide --for <purpose>` — you know what JOB you need done (e.g. `judge`), but not which executor serves it.\n- `decide --work <id> [--stage <stage>]` — you have a real work item and want it dispatched.\n- `decide --for <label> --needs-soul` — you are about to fire an Agent/Task tool yourself, with no executor or work item to name."
    }
  },
  "currentTarget": null,
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Judgment",
    "reason": "outside-platform navigation or instruction decision; no carriage target"
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_351e6c4a4690c52f77aee859728d1140"
}
```

## Entry claim_c43cebec858362eb7b73975080dba714

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-closing-instructions.json",
  "collection": "claims",
  "claimId": "claim_c43cebec858362eb7b73975080dba714",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "s10-closing-instructions",
  "before": {
    "claimId": "claim_c43cebec858362eb7b73975080dba714",
    "sourceUnitDigest": "d932c8e6777b05420fd75005a2aea166004ff704dab07cafd9a35695b3750940",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792076952136-42ac8e36@2026-10-15",
    "rationale": "L10-3: retain AGENTS.md#unheaded-block-28 as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 515c0ae74369b29716645859cb36c1312aa0ecbf4602213b897d0bdee2ed537c, pinned at 980cb29312b8701f5ea639278f44e1a57a6e5c02."
  },
  "currentDecision": {
    "claimId": "claim_c43cebec858362eb7b73975080dba714",
    "sourceUnitDigest": "d932c8e6777b05420fd75005a2aea166004ff704dab07cafd9a35695b3750940",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "L10-3: retain AGENTS.md#unheaded-block-28 as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f, pinned at 59b9b70876324e07135db53d2351f7db6a7e1746. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried."
  },
  "native": {
    "kind": "units",
    "sourcePath": "AGENTS.md",
    "unitDigest": "bd8bd2692f026c8b10fc6009af3b67974948e083ca17847aefa3700ebf5302ab",
    "identityFingerprint": "bd8bd2692f026c8b10fc6009af3b67974948e083ca17847aefa3700ebf5302ab",
    "claimId": "claim_c43cebec858362eb7b73975080dba714",
    "sourceAnchor": "unheaded-block-28",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "d932c8e6777b05420fd75005a2aea166004ff704dab07cafd9a35695b3750940",
    "claimKind": "unclassified",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-28",
      "githubAnchor": "unheaded-block-28",
      "stableAnchor": "unheaded-block-28",
      "title": "Unheaded block 28",
      "startLine": 167,
      "endLine": 167,
      "textDigest": "d932c8e6777b05420fd75005a2aea166004ff704dab07cafd9a35695b3750940",
      "sample": "Add `--has-live-task-access` when you already have the Agent/Task tool in your own tool manifest. This is always your own self-declaration — never probed from the environment, neve",
      "identityFingerprint": "bd8bd2692f026c8b10fc6009af3b67974948e083ca17847aefa3700ebf5302ab",
      "ancestry": [
        "forgent",
        "Dispatch — routing work to an executor"
      ],
      "text": "Add `--has-live-task-access` when you already have the Agent/Task tool in your own tool manifest. This is always your own self-declaration — never probed from the environment, never guessed."
    }
  },
  "currentTarget": null,
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Judgment",
    "reason": "outside-platform navigation or instruction decision; no carriage target"
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_c43cebec858362eb7b73975080dba714"
}
```

## Entry claim_664343a3da26204b9baf654b1ca4cb58

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-closing-instructions.json",
  "collection": "claims",
  "claimId": "claim_664343a3da26204b9baf654b1ca4cb58",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "s10-closing-instructions",
  "before": {
    "claimId": "claim_664343a3da26204b9baf654b1ca4cb58",
    "sourceUnitDigest": "53d8b06d46db5384e659a463daf9bd99ef4cfb443fc6ef9c8d236b22bb8a7686",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792076952136-42ac8e36@2026-10-15",
    "rationale": "L10-3: retain AGENTS.md#unheaded-block-29 as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 515c0ae74369b29716645859cb36c1312aa0ecbf4602213b897d0bdee2ed537c, pinned at 980cb29312b8701f5ea639278f44e1a57a6e5c02."
  },
  "currentDecision": {
    "claimId": "claim_664343a3da26204b9baf654b1ca4cb58",
    "sourceUnitDigest": "53d8b06d46db5384e659a463daf9bd99ef4cfb443fc6ef9c8d236b22bb8a7686",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "L10-3: retain AGENTS.md#unheaded-block-29 as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f, pinned at 59b9b70876324e07135db53d2351f7db6a7e1746. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried."
  },
  "native": {
    "kind": "units",
    "sourcePath": "AGENTS.md",
    "unitDigest": "2500ad7016fa51069d642e93439d66c25560d763a57d9232d7860f733ed44daf",
    "identityFingerprint": "2500ad7016fa51069d642e93439d66c25560d763a57d9232d7860f733ed44daf",
    "claimId": "claim_664343a3da26204b9baf654b1ca4cb58",
    "sourceAnchor": "unheaded-block-29",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "53d8b06d46db5384e659a463daf9bd99ef4cfb443fc6ef9c8d236b22bb8a7686",
    "claimKind": "unclassified",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-29",
      "githubAnchor": "unheaded-block-29",
      "stableAnchor": "unheaded-block-29",
      "title": "Unheaded block 29",
      "startLine": 169,
      "endLine": 169,
      "textDigest": "53d8b06d46db5384e659a463daf9bd99ef4cfb443fc6ef9c8d236b22bb8a7686",
      "sample": "Three possible `mechanism` results, each needing a different response:",
      "identityFingerprint": "2500ad7016fa51069d642e93439d66c25560d763a57d9232d7860f733ed44daf",
      "ancestry": [
        "forgent",
        "Dispatch — routing work to an executor"
      ],
      "text": "Three possible `mechanism` results, each needing a different response:"
    }
  },
  "currentTarget": null,
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Judgment",
    "reason": "outside-platform navigation or instruction decision; no carriage target"
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_664343a3da26204b9baf654b1ca4cb58"
}
```

## Entry claim_2d6f7d92e02f721eb5133494e12686e0

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-closing-instructions.json",
  "collection": "claims",
  "claimId": "claim_2d6f7d92e02f721eb5133494e12686e0",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "s10-closing-instructions",
  "before": {
    "claimId": "claim_2d6f7d92e02f721eb5133494e12686e0",
    "sourceUnitDigest": "d8043519ce093af41d14fb81d784bc4e63eb1718c0201f2e28299b1649b588b5",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792076952136-42ac8e36@2026-10-15",
    "rationale": "L10-3: retain AGENTS.md#unheaded-block-3 as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 515c0ae74369b29716645859cb36c1312aa0ecbf4602213b897d0bdee2ed537c, pinned at 980cb29312b8701f5ea639278f44e1a57a6e5c02."
  },
  "currentDecision": {
    "claimId": "claim_2d6f7d92e02f721eb5133494e12686e0",
    "sourceUnitDigest": "d8043519ce093af41d14fb81d784bc4e63eb1718c0201f2e28299b1649b588b5",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "L10-3: retain AGENTS.md#unheaded-block-3 as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f, pinned at 59b9b70876324e07135db53d2351f7db6a7e1746. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried."
  },
  "native": {
    "kind": "units",
    "sourcePath": "AGENTS.md",
    "unitDigest": "30a2996cd78d52f99f29835f0112ecd47f019b8afc568fd4131577d291164c4f",
    "identityFingerprint": "30a2996cd78d52f99f29835f0112ecd47f019b8afc568fd4131577d291164c4f",
    "claimId": "claim_2d6f7d92e02f721eb5133494e12686e0",
    "sourceAnchor": "unheaded-block-3",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "d8043519ce093af41d14fb81d784bc4e63eb1718c0201f2e28299b1649b588b5",
    "claimKind": "unclassified",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-3",
      "githubAnchor": "unheaded-block-3",
      "stableAnchor": "unheaded-block-3",
      "title": "Unheaded block 3",
      "startLine": 7,
      "endLine": 14,
      "textDigest": "d8043519ce093af41d14fb81d784bc4e63eb1718c0201f2e28299b1649b588b5",
      "sample": "- README.md — product description + documentation index\n- docs/platform-foundations.md — L1-L8 locked design laws; L5 is this repo's definition of done (six questions, below)\n- doc",
      "identityFingerprint": "30a2996cd78d52f99f29835f0112ecd47f019b8afc568fd4131577d291164c4f",
      "ancestry": [
        "forgent"
      ],
      "text": "- README.md — product description + documentation index\n- docs/platform-foundations.md — L1-L8 locked design laws; L5 is this repo's definition of done (six questions, below)\n- docs/specs/system-overview.md — area map, shared entities, cross-area flows\n- docs/specs/reading-map.md — where every doc and source path in this repo lives\n- docs/backlog.md — product backlog (PBI rows: proposed / in-flight / done)\n- docs/routing-handoff-contract.md — agent-to-agent handoff contract + trust boundary\n- docs/decisions/index.md — generated projection of platform/repo-wide decisions (`fgos decision-index`); narrative lives in docs/specs/<area>.md's own \"Lịch sử quyết định\" sections (tsk-1lv-4)\n- domains/<domain>/AGENTS.md — domain-specific doctrine (e.g. domains/coding/AGENTS.md for fgos-coding-* workflows), read dynamically by fgos-routing"
    }
  },
  "currentTarget": null,
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Judgment",
    "reason": "outside-platform navigation or instruction decision; no carriage target"
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_2d6f7d92e02f721eb5133494e12686e0"
}
```

## Entry claim_25243986083e5e07c7bfd524504fb054

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-closing-instructions.json",
  "collection": "claims",
  "claimId": "claim_25243986083e5e07c7bfd524504fb054",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "s10-closing-instructions",
  "before": {
    "claimId": "claim_25243986083e5e07c7bfd524504fb054",
    "sourceUnitDigest": "6617933a8600b16d505f88c3484e3d98d692c62896c674f5f7fc0f2fc550cc3a",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792076952136-42ac8e36@2026-10-15",
    "rationale": "L10-3: retain AGENTS.md#unheaded-block-30 as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 515c0ae74369b29716645859cb36c1312aa0ecbf4602213b897d0bdee2ed537c, pinned at 980cb29312b8701f5ea639278f44e1a57a6e5c02."
  },
  "currentDecision": {
    "claimId": "claim_25243986083e5e07c7bfd524504fb054",
    "sourceUnitDigest": "6617933a8600b16d505f88c3484e3d98d692c62896c674f5f7fc0f2fc550cc3a",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "L10-3: retain AGENTS.md#unheaded-block-30 as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f, pinned at 59b9b70876324e07135db53d2351f7db6a7e1746. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried."
  },
  "native": {
    "kind": "units",
    "sourcePath": "AGENTS.md",
    "unitDigest": "06e5d2f155fd144e5e394c6182e72d48ea04f8db04da33afbfd8d5b607d64928",
    "identityFingerprint": "06e5d2f155fd144e5e394c6182e72d48ea04f8db04da33afbfd8d5b607d64928",
    "claimId": "claim_25243986083e5e07c7bfd524504fb054",
    "sourceAnchor": "unheaded-block-30",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "6617933a8600b16d505f88c3484e3d98d692c62896c674f5f7fc0f2fc550cc3a",
    "claimKind": "unclassified",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-30",
      "githubAnchor": "unheaded-block-30",
      "stableAnchor": "unheaded-block-30",
      "title": "Unheaded block 30",
      "startLine": 171,
      "endLine": 173,
      "textDigest": "6617933a8600b16d505f88c3484e3d98d692c62896c674f5f7fc0f2fc550cc3a",
      "sample": "- **`\"unavailable\"`** — nothing serves this. NOT an error: do it inline yourself, and report nothing.\n- **`\"in-process\"`** — call it yourself, with your own live capability: pass t",
      "identityFingerprint": "06e5d2f155fd144e5e394c6182e72d48ea04f8db04da33afbfd8d5b607d64928",
      "ancestry": [
        "forgent",
        "Dispatch — routing work to an executor"
      ],
      "text": "- **`\"unavailable\"`** — nothing serves this. NOT an error: do it inline yourself, and report nothing.\n- **`\"in-process\"`** — call it yourself, with your own live capability: pass the returned agentType to your Agent/Task tool, or call the returned mcpTool directly. Dispatch cannot do this for you — it has neither an Agent/Task tool nor an MCP client of its own. When neither field is returned, use whichever agent type you would have used by default.\n- **`\"out-of-process\"`** — run `fgos run \"<prompt>\" --provider <executorId> --capability <purpose> [--writes <paths> --worktree <linked-worktree>]` (or `fgos run --unit <file>`), passing the same capability `decide` was asked for (left out, it defaults to the writing capability `execute`). `--provider` takes agent executors only: when the decided executor is a `kind: \"tool\"` executor, `fgos run` refuses it, so call that tool directly instead. Never run the resolved command yourself through Bash: `fgos run` binds, runs and settles the Unit and records its provenance under `.fgos/assignments/<unitRunId>/`, so there is nothing to log by hand. With `--writes` the runner commits only those paths after a passing round; with `--json` read the result at `data.results[-1].runResult.agentClaim.summary` and `data.results[-1].commit`."
    }
  },
  "currentTarget": null,
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Judgment",
    "reason": "outside-platform navigation or instruction decision; no carriage target"
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_25243986083e5e07c7bfd524504fb054"
}
```

## Entry claim_1c85e6258b0455d9b44d738f833e1bb9

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-closing-instructions.json",
  "collection": "claims",
  "claimId": "claim_1c85e6258b0455d9b44d738f833e1bb9",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "shard": "s10-closing-instructions",
  "before": {
    "claimId": "claim_1c85e6258b0455d9b44d738f833e1bb9",
    "sourceUnitDigest": "5c6ae58482c007eee6f3544b2a64bc96a8d552c66ffd091912d420004312f020",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792076952136-42ac8e36@2026-10-15",
    "rationale": "L10-3: retain AGENTS.md#unheaded-block-31 as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 515c0ae74369b29716645859cb36c1312aa0ecbf4602213b897d0bdee2ed537c, pinned at 980cb29312b8701f5ea639278f44e1a57a6e5c02."
  },
  "currentDecision": {
    "claimId": "claim_1c85e6258b0455d9b44d738f833e1bb9",
    "sourceUnitDigest": "5c6ae58482c007eee6f3544b2a64bc96a8d552c66ffd091912d420004312f020",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "L10-3: retain AGENTS.md#unheaded-block-31 as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f, pinned at 59b9b70876324e07135db53d2351f7db6a7e1746. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewNote": "Independent review pending at corrected current binding; no approval carried."
  },
  "native": {
    "kind": "units",
    "sourcePath": "AGENTS.md",
    "unitDigest": "36f9cfda82b5d55a787b61051920caace74fe341bbb8fc15c02d512ad7c6392f",
    "identityFingerprint": "36f9cfda82b5d55a787b61051920caace74fe341bbb8fc15c02d512ad7c6392f",
    "claimId": "claim_1c85e6258b0455d9b44d738f833e1bb9",
    "sourceAnchor": "unheaded-block-31",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "5c6ae58482c007eee6f3544b2a64bc96a8d552c66ffd091912d420004312f020",
    "claimKind": "unclassified",
    "status": "current"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-31",
      "githubAnchor": "unheaded-block-31",
      "stableAnchor": "unheaded-block-31",
      "title": "Unheaded block 31",
      "startLine": 175,
      "endLine": 176,
      "textDigest": "5c6ae58482c007eee6f3544b2a64bc96a8d552c66ffd091912d420004312f020",
      "sample": "Every result also carries `configured: true|false`, additive `reasonCodes: [...]`, and optional `blockedReason` (e.g. when blocked by governance policy) — `false` means nothing is ",
      "identityFingerprint": "36f9cfda82b5d55a787b61051920caace74fe341bbb8fc15c02d512ad7c6392f",
      "ancestry": [
        "forgent",
        "Dispatch — routing work to an executor"
      ],
      "text": "Every result also carries `configured: true|false`, additive `reasonCodes: [...]`, and optional `blockedReason` (e.g. when blocked by governance policy) — `false` means nothing is configured for that name or job, and the answer came from the default.\nA skill that dispatches should not re-derive any of this. Reference `../_shared/executor-dispatch-fallback.md` from the skill; its canonical source is `core/skills/_shared/executor-dispatch-fallback.md`. `.agents/skills/` and `plugins/fgOS/skills/` are generated render surfaces carrying source headers, rebuilt with `npm run build:skills`; never edit them by hand. For fgOS thin wrappers, `.claude/skills` contains generated wrappers only; it has no `_shared` directory of its own."
    }
  },
  "currentTarget": null,
  "sourceTargetDigestsUnequal": false,
  "classObservation": {
    "class": "Judgment",
    "reason": "outside-platform navigation or instruction decision; no carriage target"
  },
  "mechanicalRequired": true,
  "deepRequired": false,
  "currentContentCommit": "19ca8de23908e161c34c91626e41041b7813167c",
  "entryId": "claim_1c85e6258b0455d9b44d738f833e1bb9"
}
```

