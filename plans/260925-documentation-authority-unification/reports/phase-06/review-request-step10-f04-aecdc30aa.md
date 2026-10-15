# Link repoints — part 4

One review request; entry 361–366 of section f (366 total). Content pin `aecdc30aad0ffd65a2956ff642c4be9410686ede`; comparison base `980cb29312b8701f5ea639278f44e1a57a6e5c02`. See [single request index](review-request-step10-index-aecdc30aa.md). This part contains **6 entries**.

Independent review required. No producer-selected seed or verdict. The JSON sidecar carries the same complete entries.

Each row shows old/new destination, native committed target-resolution result, unchanged label and exact alias-origin/target proof. Check destination semantics independently for every entry. Preserved fences, 41 historical referents and nine queued links are documented in the execution artifact; no inline-code or non-doc consumer edits.

## Entry f-361: link-361

```json
{
  "id": "link-361",
  "path": "docs/platform/work-state/README.md",
  "inputLine": 32,
  "inputColumn": 35,
  "lineBeforeLinkPass": 40,
  "before": "[docs/specs/work-state.md](../../specs/work-state.md)",
  "after": "[docs/specs/work-state.md](README.md)",
  "legacyPath": "docs/specs/work-state.md",
  "target": {
    "path": "docs/platform/work-state/README.md",
    "anchor": null,
    "aliasId": "root-authorities-draft-0073"
  },
  "portal": true,
  "area": "work-state",
  "reviewStatus": "pending",
  "oldDestination": "../../specs/work-state.md",
  "newDestination": "README.md",
  "alias": {
    "aliasId": "root-authorities-draft-0073",
    "fromPath": "docs/specs/work-state.md",
    "toOwner": "docs/platform/work-state/README.md",
    "toAnchor": null,
    "kind": "merged",
    "evidenceRef": "plans/260925-documentation-authority-unification/pilot/decisions/b-behaviors.json",
    "immutableRefs": [],
    "recordedAt": "2026-10-14"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Spec: Work-State (tầng quản việc của forgent)",
    "anchor": "spec-work-state-tầng-quản-việc-của-forgent",
    "githubAnchor": "spec-work-state-tầng-quản-việc-của-forgent",
    "stableAnchor": "h-0d070b2449f6",
    "startLine": 9,
    "endLine": 9,
    "textDigest": "bbef379255aa6ba73f98654a66f22aa11f0939ec3e8dc0a87a9bdfcb50d8aa52",
    "sample": "Spec: Work-State (tầng quản việc của forgent)",
    "sectionPayloadDigest": "d9f06bbaa0ffe5ab3f54dd8fba4e9514ed4e126572c8a570dea57f366837d117",
    "followingBlockDigest": "d9f06bbaa0ffe5ab3f54dd8fba4e9514ed4e126572c8a570dea57f366837d117",
    "identityFingerprint": "bf1b64516976c2a0a79c008b62384aa50a2700e5a494004313a6416d85ad0401",
    "ancestry": [],
    "text": "# Spec: Work-State (tầng quản việc của forgent)",
    "sectionText": "# Spec: Work-State (tầng quản việc của forgent)\n\nBộ nhớ công việc tự quản của forgent: nơi duy nhất ghi nhận \"đang có việc gì, việc nào ở trạng thái nào, quyết định nào đã chốt\". Người dùng: người vận hành repo và agent làm việc trong repo — cả hai thao tác qua đúng một cửa lệnh `fgos`. Sự thật nằm ở **nhật ký sự kiện** append-only được commit; **bản chiếu trạng thái** hiện hành chỉ là dẫn xuất, xóa đi dựng lại được nguyên vẹn."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Work State",
    "anchor": "work-state",
    "githubAnchor": "work-state",
    "stableAnchor": "h-7e885f29a711",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "252bd4bd0b73bb5287d39df62a5d10bd81c7c72b2dc98cddbb464930df613005",
    "sample": "Work State",
    "sectionPayloadDigest": "34b3a3683fddf06454bc6de3bea4596b63fad84e2bdaff3d901a188e9703f560",
    "followingBlockDigest": "34b3a3683fddf06454bc6de3bea4596b63fad84e2bdaff3d901a188e9703f560",
    "identityFingerprint": "209648a3c62d56317b0913151dc54164a7cc0ee22d9eb90428a20273cf5a98cd",
    "ancestry": [],
    "text": "# Work State",
    "sectionText": "# Work State\n\n```txt\nDocument type: Area portal\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: Route readers through the candidate documents of the work state area and point to the legacy sources they are drawn from\nDesign status: Candidate\nLast reviewed: 2026-10-06\nRelated:\n- docs/platform/work-state/README.md\n- docs/platform/work-state/spec.md\n- docs/platform/work-state/contracts/cli-io-contract.md\n- docs/platform/work-state/architecture/implementation-pointers.md\n- docs/platform/work-state/decisions/retired-decision-history.md\n- docs/platform/work-state/history/multi-role-harness-distill-record.md\n- docs/specs/work-state.md\n- docs/io-contract.md\n- docs/work-item-lifecycle-vision.md\n- docs/platform/vision.md\nImplementation: Carried source material; current implementation truth unverified\nProvenance: Retained work-state candidate carriage from docs/specs/work-state.md; existing Related references retained\nWriter type: Original writer attribution not recorded; retained source provenance\nCanonical for: Candidate scope: Route readers through the candidate documents of the work state area and point to the legacy sources they are drawn from; authority follows transitional switchboard\nUse this when: Route readers through the candidate documents of the work state area and point to the legacy sources they are drawn from\nDo not use this for: Authority beyond the declared scope or implementation truth without the cited verification\nSupersedes: None; legacy sources remain in place during migration\nSuperseded by: None recorded\n```"
  }
}
```

## Entry f-362: link-362

```json
{
  "id": "link-362",
  "path": "docs/platform/work-state/README.md",
  "inputLine": 32,
  "inputColumn": 90,
  "lineBeforeLinkPass": 40,
  "before": "[docs/io-contract.md](../../io-contract.md)",
  "after": "[docs/io-contract.md](contracts/cli-io-contract.md)",
  "legacyPath": "docs/io-contract.md",
  "target": {
    "path": "docs/platform/work-state/contracts/cli-io-contract.md",
    "anchor": null,
    "aliasId": "root-authorities-draft-0027"
  },
  "portal": true,
  "area": "work-state",
  "reviewStatus": "pending",
  "oldDestination": "../../io-contract.md",
  "newDestination": "contracts/cli-io-contract.md",
  "alias": {
    "aliasId": "root-authorities-draft-0027",
    "fromPath": "docs/io-contract.md",
    "toOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "toAnchor": null,
    "kind": "moved",
    "evidenceRef": "plans/260925-documentation-authority-unification/pilot/decisions/b-io-contract.json",
    "immutableRefs": [],
    "recordedAt": "2026-10-14"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`",
    "anchor": "hợp-đồng-io-của-fgos-cửa-cli-bề-mặt-stdout-của-fgos-runner",
    "githubAnchor": "hợp-đồng-io-của-fgos-cửa-cli-bề-mặt-stdout-của-fgos-runner",
    "stableAnchor": "h-370cc10f3720",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "f72297b85c91b398d8341653aabae3add3e9cfc3079149c05b594d543b853d8a",
    "sample": "Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`",
    "sectionPayloadDigest": "b54c97321e74760179179cb14a65a3ce230f6de6cd4b1956eb1c494d4bb8f6b7",
    "followingBlockDigest": "476e7efba05e358ccd01c95cbfb350eca1cc6a7905d784c5651cb99960515322",
    "identityFingerprint": "21ac90429f5eda202fdb6e1fb642b9861daef90794b4c1f4582225c093098364",
    "ancestry": [],
    "text": "# Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`",
    "sectionText": "# Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`\n\nHợp đồng giao tiếp VÀO/RA hạng nhất cho bề mặt CLI của fgOS (`bin/fgos.mjs`)\nvà bề mặt stdout của vòng tự hành (`bin/fgos-runner.mjs`), theo record\n[0014](decisions/0014-kien-truc-giao-tiep-nguoi-fgos.md) (kiến trúc cửa, đã\nkhoá) và [0011](decisions/0011-version-tuong-minh-cho-moi-contract.md) (mọi\ncontract mang version tường minh `<name>/v<N>`). Tài liệu này là bản chốt\nbằng văn xuôi hợp nhất những gì `str46-io-contract` đã dựng qua ba lát —\nkhông phải code runtime mới, không lặp lại chi tiết cài đặt đã có trong\n`docs/specs/work-state.md`/`docs/specs/runner.md`.\n\n**Mục tiêu:** một transport MỚI (terminal, pane, chat, web, thứ chưa nghĩ\nra) cắm vào chỉ bằng cách dịch transport→verb (chiều vào) và đọc envelope/sổ\nverb (chiều ra) — không mở đường ghi riêng, không phải đoán hình dạng output\nbằng cách đọc mã."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "CLI I/O Contract",
    "anchor": "cli-io-contract",
    "githubAnchor": "cli-io-contract",
    "stableAnchor": "h-1a12f8bbe2ff",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "d402870da7c60d96c00eb162384d3e6c5f65e4aae549efeb991d5e8a5186bedb",
    "sample": "CLI I/O Contract",
    "sectionPayloadDigest": "a49b56e4c14198649dee1224ebf0bc991561a1b17a6bbde52b840d7b3c5775e0",
    "followingBlockDigest": "a49b56e4c14198649dee1224ebf0bc991561a1b17a6bbde52b840d7b3c5775e0",
    "identityFingerprint": "9294ce6dbff1c5fde364c4a3750c7e60e871aab7f4a505d80f6599020bcc6a81",
    "ancestry": [],
    "text": "# CLI I/O Contract",
    "sectionText": "# CLI I/O Contract\n\n```txt\nDocument type: Contract\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: Owns the input and output contract of the fgOS CLI door and the stdout surface of fgos-runner: writer identity, envelope, exit codes, pagination, verb manifest and version tokens.\nDesign status: Candidate\nLast reviewed: 2026-10-06\nAdded in candidate: the headings Single Write Door, Writer Source Trust Levels, Writer Resolution Rules, Caller Role, Error Path Is Not Enveloped, Runner Stdout Envelope, Recognizing A Real Envelope and Entry Fields And Effect Axes subdivide sections of the sources that have no heading of their own; the text under them is carried from the sources.\nRelated:\n- docs/platform/work-state/README.md\n- docs/platform/work-state/spec.md\n- docs/platform/work-state/decisions/retired-decision-history.md\n- docs/specs/work-state.md\n- docs/io-contract.md\nImplementation: Carried source material; current implementation truth unverified\nProvenance: Retained work-state candidate carriage from docs/specs/work-state.md and docs/io-contract.md; existing Related references retained\nWriter type: Original writer attribution not recorded; retained source provenance\nCanonical for: Candidate scope: Owns the input and output contract of the fgOS CLI door and the stdout surface of fgos-runner: writer identity, envelope, exit codes, pagination, verb manifest and version tokens; authority follows transitional switchboard\nUse this when: Owns the input and output contract of the fgOS CLI door and the stdout surface of fgos-runner: writer identity, envelope, exit codes, pagination, verb manifest and version tokens\nDo not use this for: Authority beyond the declared scope or implementation truth without the cited verification\nSupersedes: None; legacy sources remain in place during migration\nSuperseded by: None recorded\n```"
  }
}
```

## Entry f-363: link-363

```json
{
  "id": "link-363",
  "path": "docs/platform/work-state/README.md",
  "inputLine": 51,
  "inputColumn": 30,
  "lineBeforeLinkPass": 59,
  "before": "[docs/specs/work-state.md](../../specs/work-state.md)",
  "after": "[docs/specs/work-state.md](README.md)",
  "legacyPath": "docs/specs/work-state.md",
  "target": {
    "path": "docs/platform/work-state/README.md",
    "anchor": null,
    "aliasId": "root-authorities-draft-0073"
  },
  "portal": true,
  "area": "work-state",
  "reviewStatus": "pending",
  "oldDestination": "../../specs/work-state.md",
  "newDestination": "README.md",
  "alias": {
    "aliasId": "root-authorities-draft-0073",
    "fromPath": "docs/specs/work-state.md",
    "toOwner": "docs/platform/work-state/README.md",
    "toAnchor": null,
    "kind": "merged",
    "evidenceRef": "plans/260925-documentation-authority-unification/pilot/decisions/b-behaviors.json",
    "immutableRefs": [],
    "recordedAt": "2026-10-14"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Spec: Work-State (tầng quản việc của forgent)",
    "anchor": "spec-work-state-tầng-quản-việc-của-forgent",
    "githubAnchor": "spec-work-state-tầng-quản-việc-của-forgent",
    "stableAnchor": "h-0d070b2449f6",
    "startLine": 9,
    "endLine": 9,
    "textDigest": "bbef379255aa6ba73f98654a66f22aa11f0939ec3e8dc0a87a9bdfcb50d8aa52",
    "sample": "Spec: Work-State (tầng quản việc của forgent)",
    "sectionPayloadDigest": "d9f06bbaa0ffe5ab3f54dd8fba4e9514ed4e126572c8a570dea57f366837d117",
    "followingBlockDigest": "d9f06bbaa0ffe5ab3f54dd8fba4e9514ed4e126572c8a570dea57f366837d117",
    "identityFingerprint": "bf1b64516976c2a0a79c008b62384aa50a2700e5a494004313a6416d85ad0401",
    "ancestry": [],
    "text": "# Spec: Work-State (tầng quản việc của forgent)",
    "sectionText": "# Spec: Work-State (tầng quản việc của forgent)\n\nBộ nhớ công việc tự quản của forgent: nơi duy nhất ghi nhận \"đang có việc gì, việc nào ở trạng thái nào, quyết định nào đã chốt\". Người dùng: người vận hành repo và agent làm việc trong repo — cả hai thao tác qua đúng một cửa lệnh `fgos`. Sự thật nằm ở **nhật ký sự kiện** append-only được commit; **bản chiếu trạng thái** hiện hành chỉ là dẫn xuất, xóa đi dựng lại được nguyên vẹn."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Work State",
    "anchor": "work-state",
    "githubAnchor": "work-state",
    "stableAnchor": "h-7e885f29a711",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "252bd4bd0b73bb5287d39df62a5d10bd81c7c72b2dc98cddbb464930df613005",
    "sample": "Work State",
    "sectionPayloadDigest": "34b3a3683fddf06454bc6de3bea4596b63fad84e2bdaff3d901a188e9703f560",
    "followingBlockDigest": "34b3a3683fddf06454bc6de3bea4596b63fad84e2bdaff3d901a188e9703f560",
    "identityFingerprint": "209648a3c62d56317b0913151dc54164a7cc0ee22d9eb90428a20273cf5a98cd",
    "ancestry": [],
    "text": "# Work State",
    "sectionText": "# Work State\n\n```txt\nDocument type: Area portal\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: Route readers through the candidate documents of the work state area and point to the legacy sources they are drawn from\nDesign status: Candidate\nLast reviewed: 2026-10-06\nRelated:\n- docs/platform/work-state/README.md\n- docs/platform/work-state/spec.md\n- docs/platform/work-state/contracts/cli-io-contract.md\n- docs/platform/work-state/architecture/implementation-pointers.md\n- docs/platform/work-state/decisions/retired-decision-history.md\n- docs/platform/work-state/history/multi-role-harness-distill-record.md\n- docs/specs/work-state.md\n- docs/io-contract.md\n- docs/work-item-lifecycle-vision.md\n- docs/platform/vision.md\nImplementation: Carried source material; current implementation truth unverified\nProvenance: Retained work-state candidate carriage from docs/specs/work-state.md; existing Related references retained\nWriter type: Original writer attribution not recorded; retained source provenance\nCanonical for: Candidate scope: Route readers through the candidate documents of the work state area and point to the legacy sources they are drawn from; authority follows transitional switchboard\nUse this when: Route readers through the candidate documents of the work state area and point to the legacy sources they are drawn from\nDo not use this for: Authority beyond the declared scope or implementation truth without the cited verification\nSupersedes: None; legacy sources remain in place during migration\nSuperseded by: None recorded\n```"
  }
}
```

## Entry f-364: link-364

```json
{
  "id": "link-364",
  "path": "docs/platform/work-state/README.md",
  "inputLine": 51,
  "inputColumn": 85,
  "lineBeforeLinkPass": 59,
  "before": "[docs/io-contract.md](../../io-contract.md)",
  "after": "[docs/io-contract.md](contracts/cli-io-contract.md)",
  "legacyPath": "docs/io-contract.md",
  "target": {
    "path": "docs/platform/work-state/contracts/cli-io-contract.md",
    "anchor": null,
    "aliasId": "root-authorities-draft-0027"
  },
  "portal": true,
  "area": "work-state",
  "reviewStatus": "pending",
  "oldDestination": "../../io-contract.md",
  "newDestination": "contracts/cli-io-contract.md",
  "alias": {
    "aliasId": "root-authorities-draft-0027",
    "fromPath": "docs/io-contract.md",
    "toOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "toAnchor": null,
    "kind": "moved",
    "evidenceRef": "plans/260925-documentation-authority-unification/pilot/decisions/b-io-contract.json",
    "immutableRefs": [],
    "recordedAt": "2026-10-14"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`",
    "anchor": "hợp-đồng-io-của-fgos-cửa-cli-bề-mặt-stdout-của-fgos-runner",
    "githubAnchor": "hợp-đồng-io-của-fgos-cửa-cli-bề-mặt-stdout-của-fgos-runner",
    "stableAnchor": "h-370cc10f3720",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "f72297b85c91b398d8341653aabae3add3e9cfc3079149c05b594d543b853d8a",
    "sample": "Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`",
    "sectionPayloadDigest": "b54c97321e74760179179cb14a65a3ce230f6de6cd4b1956eb1c494d4bb8f6b7",
    "followingBlockDigest": "476e7efba05e358ccd01c95cbfb350eca1cc6a7905d784c5651cb99960515322",
    "identityFingerprint": "21ac90429f5eda202fdb6e1fb642b9861daef90794b4c1f4582225c093098364",
    "ancestry": [],
    "text": "# Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`",
    "sectionText": "# Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`\n\nHợp đồng giao tiếp VÀO/RA hạng nhất cho bề mặt CLI của fgOS (`bin/fgos.mjs`)\nvà bề mặt stdout của vòng tự hành (`bin/fgos-runner.mjs`), theo record\n[0014](decisions/0014-kien-truc-giao-tiep-nguoi-fgos.md) (kiến trúc cửa, đã\nkhoá) và [0011](decisions/0011-version-tuong-minh-cho-moi-contract.md) (mọi\ncontract mang version tường minh `<name>/v<N>`). Tài liệu này là bản chốt\nbằng văn xuôi hợp nhất những gì `str46-io-contract` đã dựng qua ba lát —\nkhông phải code runtime mới, không lặp lại chi tiết cài đặt đã có trong\n`docs/specs/work-state.md`/`docs/specs/runner.md`.\n\n**Mục tiêu:** một transport MỚI (terminal, pane, chat, web, thứ chưa nghĩ\nra) cắm vào chỉ bằng cách dịch transport→verb (chiều vào) và đọc envelope/sổ\nverb (chiều ra) — không mở đường ghi riêng, không phải đoán hình dạng output\nbằng cách đọc mã."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "CLI I/O Contract",
    "anchor": "cli-io-contract",
    "githubAnchor": "cli-io-contract",
    "stableAnchor": "h-1a12f8bbe2ff",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "d402870da7c60d96c00eb162384d3e6c5f65e4aae549efeb991d5e8a5186bedb",
    "sample": "CLI I/O Contract",
    "sectionPayloadDigest": "a49b56e4c14198649dee1224ebf0bc991561a1b17a6bbde52b840d7b3c5775e0",
    "followingBlockDigest": "a49b56e4c14198649dee1224ebf0bc991561a1b17a6bbde52b840d7b3c5775e0",
    "identityFingerprint": "9294ce6dbff1c5fde364c4a3750c7e60e871aab7f4a505d80f6599020bcc6a81",
    "ancestry": [],
    "text": "# CLI I/O Contract",
    "sectionText": "# CLI I/O Contract\n\n```txt\nDocument type: Contract\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: Owns the input and output contract of the fgOS CLI door and the stdout surface of fgos-runner: writer identity, envelope, exit codes, pagination, verb manifest and version tokens.\nDesign status: Candidate\nLast reviewed: 2026-10-06\nAdded in candidate: the headings Single Write Door, Writer Source Trust Levels, Writer Resolution Rules, Caller Role, Error Path Is Not Enveloped, Runner Stdout Envelope, Recognizing A Real Envelope and Entry Fields And Effect Axes subdivide sections of the sources that have no heading of their own; the text under them is carried from the sources.\nRelated:\n- docs/platform/work-state/README.md\n- docs/platform/work-state/spec.md\n- docs/platform/work-state/decisions/retired-decision-history.md\n- docs/specs/work-state.md\n- docs/io-contract.md\nImplementation: Carried source material; current implementation truth unverified\nProvenance: Retained work-state candidate carriage from docs/specs/work-state.md and docs/io-contract.md; existing Related references retained\nWriter type: Original writer attribution not recorded; retained source provenance\nCanonical for: Candidate scope: Owns the input and output contract of the fgOS CLI door and the stdout surface of fgos-runner: writer identity, envelope, exit codes, pagination, verb manifest and version tokens; authority follows transitional switchboard\nUse this when: Owns the input and output contract of the fgOS CLI door and the stdout surface of fgos-runner: writer identity, envelope, exit codes, pagination, verb manifest and version tokens\nDo not use this for: Authority beyond the declared scope or implementation truth without the cited verification\nSupersedes: None; legacy sources remain in place during migration\nSuperseded by: None recorded\n```"
  }
}
```

## Entry f-365: link-365

```json
{
  "id": "link-365",
  "path": "docs/platform/work-state/README.md",
  "inputLine": 64,
  "inputColumn": 18,
  "lineBeforeLinkPass": 72,
  "before": "[../../specs/work-state.md](../../specs/work-state.md)",
  "after": "[../../specs/work-state.md](README.md)",
  "legacyPath": "docs/specs/work-state.md",
  "target": {
    "path": "docs/platform/work-state/README.md",
    "anchor": null,
    "aliasId": "root-authorities-draft-0073"
  },
  "portal": true,
  "area": "work-state",
  "reviewStatus": "pending",
  "oldDestination": "../../specs/work-state.md",
  "newDestination": "README.md",
  "alias": {
    "aliasId": "root-authorities-draft-0073",
    "fromPath": "docs/specs/work-state.md",
    "toOwner": "docs/platform/work-state/README.md",
    "toAnchor": null,
    "kind": "merged",
    "evidenceRef": "plans/260925-documentation-authority-unification/pilot/decisions/b-behaviors.json",
    "immutableRefs": [],
    "recordedAt": "2026-10-14"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Spec: Work-State (tầng quản việc của forgent)",
    "anchor": "spec-work-state-tầng-quản-việc-của-forgent",
    "githubAnchor": "spec-work-state-tầng-quản-việc-của-forgent",
    "stableAnchor": "h-0d070b2449f6",
    "startLine": 9,
    "endLine": 9,
    "textDigest": "bbef379255aa6ba73f98654a66f22aa11f0939ec3e8dc0a87a9bdfcb50d8aa52",
    "sample": "Spec: Work-State (tầng quản việc của forgent)",
    "sectionPayloadDigest": "d9f06bbaa0ffe5ab3f54dd8fba4e9514ed4e126572c8a570dea57f366837d117",
    "followingBlockDigest": "d9f06bbaa0ffe5ab3f54dd8fba4e9514ed4e126572c8a570dea57f366837d117",
    "identityFingerprint": "bf1b64516976c2a0a79c008b62384aa50a2700e5a494004313a6416d85ad0401",
    "ancestry": [],
    "text": "# Spec: Work-State (tầng quản việc của forgent)",
    "sectionText": "# Spec: Work-State (tầng quản việc của forgent)\n\nBộ nhớ công việc tự quản của forgent: nơi duy nhất ghi nhận \"đang có việc gì, việc nào ở trạng thái nào, quyết định nào đã chốt\". Người dùng: người vận hành repo và agent làm việc trong repo — cả hai thao tác qua đúng một cửa lệnh `fgos`. Sự thật nằm ở **nhật ký sự kiện** append-only được commit; **bản chiếu trạng thái** hiện hành chỉ là dẫn xuất, xóa đi dựng lại được nguyên vẹn."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Work State",
    "anchor": "work-state",
    "githubAnchor": "work-state",
    "stableAnchor": "h-7e885f29a711",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "252bd4bd0b73bb5287d39df62a5d10bd81c7c72b2dc98cddbb464930df613005",
    "sample": "Work State",
    "sectionPayloadDigest": "34b3a3683fddf06454bc6de3bea4596b63fad84e2bdaff3d901a188e9703f560",
    "followingBlockDigest": "34b3a3683fddf06454bc6de3bea4596b63fad84e2bdaff3d901a188e9703f560",
    "identityFingerprint": "209648a3c62d56317b0913151dc54164a7cc0ee22d9eb90428a20273cf5a98cd",
    "ancestry": [],
    "text": "# Work State",
    "sectionText": "# Work State\n\n```txt\nDocument type: Area portal\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: Route readers through the candidate documents of the work state area and point to the legacy sources they are drawn from\nDesign status: Candidate\nLast reviewed: 2026-10-06\nRelated:\n- docs/platform/work-state/README.md\n- docs/platform/work-state/spec.md\n- docs/platform/work-state/contracts/cli-io-contract.md\n- docs/platform/work-state/architecture/implementation-pointers.md\n- docs/platform/work-state/decisions/retired-decision-history.md\n- docs/platform/work-state/history/multi-role-harness-distill-record.md\n- docs/specs/work-state.md\n- docs/io-contract.md\n- docs/work-item-lifecycle-vision.md\n- docs/platform/vision.md\nImplementation: Carried source material; current implementation truth unverified\nProvenance: Retained work-state candidate carriage from docs/specs/work-state.md; existing Related references retained\nWriter type: Original writer attribution not recorded; retained source provenance\nCanonical for: Candidate scope: Route readers through the candidate documents of the work state area and point to the legacy sources they are drawn from; authority follows transitional switchboard\nUse this when: Route readers through the candidate documents of the work state area and point to the legacy sources they are drawn from\nDo not use this for: Authority beyond the declared scope or implementation truth without the cited verification\nSupersedes: None; legacy sources remain in place during migration\nSuperseded by: None recorded\n```"
  }
}
```

## Entry f-366: link-366

```json
{
  "id": "link-366",
  "path": "docs/platform/work-state/README.md",
  "inputLine": 65,
  "inputColumn": 18,
  "lineBeforeLinkPass": 73,
  "before": "[../../io-contract.md](../../io-contract.md)",
  "after": "[../../io-contract.md](contracts/cli-io-contract.md)",
  "legacyPath": "docs/io-contract.md",
  "target": {
    "path": "docs/platform/work-state/contracts/cli-io-contract.md",
    "anchor": null,
    "aliasId": "root-authorities-draft-0027"
  },
  "portal": true,
  "area": "work-state",
  "reviewStatus": "pending",
  "oldDestination": "../../io-contract.md",
  "newDestination": "contracts/cli-io-contract.md",
  "alias": {
    "aliasId": "root-authorities-draft-0027",
    "fromPath": "docs/io-contract.md",
    "toOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "toAnchor": null,
    "kind": "moved",
    "evidenceRef": "plans/260925-documentation-authority-unification/pilot/decisions/b-io-contract.json",
    "immutableRefs": [],
    "recordedAt": "2026-10-14"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`",
    "anchor": "hợp-đồng-io-của-fgos-cửa-cli-bề-mặt-stdout-của-fgos-runner",
    "githubAnchor": "hợp-đồng-io-của-fgos-cửa-cli-bề-mặt-stdout-của-fgos-runner",
    "stableAnchor": "h-370cc10f3720",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "f72297b85c91b398d8341653aabae3add3e9cfc3079149c05b594d543b853d8a",
    "sample": "Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`",
    "sectionPayloadDigest": "b54c97321e74760179179cb14a65a3ce230f6de6cd4b1956eb1c494d4bb8f6b7",
    "followingBlockDigest": "476e7efba05e358ccd01c95cbfb350eca1cc6a7905d784c5651cb99960515322",
    "identityFingerprint": "21ac90429f5eda202fdb6e1fb642b9861daef90794b4c1f4582225c093098364",
    "ancestry": [],
    "text": "# Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`",
    "sectionText": "# Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`\n\nHợp đồng giao tiếp VÀO/RA hạng nhất cho bề mặt CLI của fgOS (`bin/fgos.mjs`)\nvà bề mặt stdout của vòng tự hành (`bin/fgos-runner.mjs`), theo record\n[0014](decisions/0014-kien-truc-giao-tiep-nguoi-fgos.md) (kiến trúc cửa, đã\nkhoá) và [0011](decisions/0011-version-tuong-minh-cho-moi-contract.md) (mọi\ncontract mang version tường minh `<name>/v<N>`). Tài liệu này là bản chốt\nbằng văn xuôi hợp nhất những gì `str46-io-contract` đã dựng qua ba lát —\nkhông phải code runtime mới, không lặp lại chi tiết cài đặt đã có trong\n`docs/specs/work-state.md`/`docs/specs/runner.md`.\n\n**Mục tiêu:** một transport MỚI (terminal, pane, chat, web, thứ chưa nghĩ\nra) cắm vào chỉ bằng cách dịch transport→verb (chiều vào) và đọc envelope/sổ\nverb (chiều ra) — không mở đường ghi riêng, không phải đoán hình dạng output\nbằng cách đọc mã."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "CLI I/O Contract",
    "anchor": "cli-io-contract",
    "githubAnchor": "cli-io-contract",
    "stableAnchor": "h-1a12f8bbe2ff",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "d402870da7c60d96c00eb162384d3e6c5f65e4aae549efeb991d5e8a5186bedb",
    "sample": "CLI I/O Contract",
    "sectionPayloadDigest": "a49b56e4c14198649dee1224ebf0bc991561a1b17a6bbde52b840d7b3c5775e0",
    "followingBlockDigest": "a49b56e4c14198649dee1224ebf0bc991561a1b17a6bbde52b840d7b3c5775e0",
    "identityFingerprint": "9294ce6dbff1c5fde364c4a3750c7e60e871aab7f4a505d80f6599020bcc6a81",
    "ancestry": [],
    "text": "# CLI I/O Contract",
    "sectionText": "# CLI I/O Contract\n\n```txt\nDocument type: Contract\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: Owns the input and output contract of the fgOS CLI door and the stdout surface of fgos-runner: writer identity, envelope, exit codes, pagination, verb manifest and version tokens.\nDesign status: Candidate\nLast reviewed: 2026-10-06\nAdded in candidate: the headings Single Write Door, Writer Source Trust Levels, Writer Resolution Rules, Caller Role, Error Path Is Not Enveloped, Runner Stdout Envelope, Recognizing A Real Envelope and Entry Fields And Effect Axes subdivide sections of the sources that have no heading of their own; the text under them is carried from the sources.\nRelated:\n- docs/platform/work-state/README.md\n- docs/platform/work-state/spec.md\n- docs/platform/work-state/decisions/retired-decision-history.md\n- docs/specs/work-state.md\n- docs/io-contract.md\nImplementation: Carried source material; current implementation truth unverified\nProvenance: Retained work-state candidate carriage from docs/specs/work-state.md and docs/io-contract.md; existing Related references retained\nWriter type: Original writer attribution not recorded; retained source provenance\nCanonical for: Candidate scope: Owns the input and output contract of the fgOS CLI door and the stdout surface of fgos-runner: writer identity, envelope, exit codes, pagination, verb manifest and version tokens; authority follows transitional switchboard\nUse this when: Owns the input and output contract of the fgOS CLI door and the stdout surface of fgos-runner: writer identity, envelope, exit codes, pagination, verb manifest and version tokens\nDo not use this for: Authority beyond the declared scope or implementation truth without the cited verification\nSupersedes: None; legacy sources remain in place during migration\nSuperseded by: None recorded\n```"
  }
}
```

