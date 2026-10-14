# Historical native source gap — bounded independent review request

Content commit: `a8a10abc1a24218518a14764f68c8d86f4810f91`. Author session: codex-session:38@2026-10-15. Entries: **1** historical native gap. Requested review mode: ordinary. This gap predates this boundary; no new Plan B re-pin or invented identity is performed.

Step 6’s closing review is a **checkpoint review whose sensitivity pack the reviewer holds**. The author has not created, seen or selected its pack/key. This ordinary historical-gap review does not replace it.

Read review-brief.md, A22/A31/A36, frozen map and current source decision claim_49dc8dc05b31bcfc5cfd0d7c44c8395e. The old native gap is now visible because Step 6 scopes include system-overview. Independently determine whether current source/candidate is the complete legitimate successor; do not infer supersede from anchor equality. No disposition or approval is authored here. An authorized writer must create the accepted gap decision before application/closure.

Ordinary report contract: Reviewer, Review mode: ordinary, request/content pins; | Claim | Verdict | Note | Source digest | Target digest |. Own note and full 64-hex digests; ok/rework/hold. Differing-digest deep set: `claim_0cc5fd490ce0087ed51f38bca9d8c96e`. Absent-target rows: none.

## claim_0cc5fd490ce0087ed51f38bca9d8c96e

Historical source: `docs/specs/system-overview.md#unheaded-block-3`, immutable blob `be00c90cf0f3bae695a65069897a926d4a699bca`, native digest `543e5632daf001e968418bbeae1311abb85e2a5e966ce473669e6ad635b74a1e`. Current candidate: `docs/platform/system-overview/spec.md#unheaded-block-6`, native digest `b5b8e930c4f4411020e3a8559798e1703e8b6e984487ef0d83b318c3c9a7f781`. Current source ID remains `claim_49dc8dc05b31bcfc5cfd0d7c44c8395e`; preserve the old gap separately.

### Full historical source unit

```text
- platform-foundations — 8 luật thiết kế đã khóa đứng trên mọi code của compound stack; spec: platform-foundations.md
- work-state — bộ nhớ công việc tự quản của forgent (cửa lệnh `fgos`, nhật ký sự kiện là truth, bản chiếu dựng lại được); spec: work-state.md
- enduser-docs-authoring — soạn & nuôi tài liệu người-dùng-cuối ở khâu tổng-hợp, tức khi việc mang status `retrospective`: biến capture thật thành tài liệu theo ngăn Diataxis, một tài liệu sống trên mỗi đường dẫn, tích luỹ không mất (write-side); spec: enduser-docs-authoring.md
- enduser-docs-index — chỉ mục đọc-theo-tag máy-đọc-được của tài liệu người-dùng-cuối, sinh từ cây tài liệu + capture (`fgos docs-index`), giữ móc truy ngược tài liệu↔việc, và verb `fgos doc-sources` gom mọi capture của một đường dẫn (read-side); spec: enduser-docs-index.md
- runner — vòng tự hành: lấy việc từ frontier, giao trợ lý nền trong nhánh cô lập, tự chấm, ghi đề xuất chờ duyệt; spec: runner.md
- fgos-plugin — bề mặt slash-command `/fgOS:<verb>` cho Claude Code, 12 verb wrapper one-door-write bọc quanh CLI `fgos`; spec: fgos-plugin.md
- distribution — cài `fgos` từ ngoài source repo (npm install qua GitHub); spec: distribution.md
- decision-citation-drift — quét backlog/spec tìm dòng còn trích một quyết định đã bị supersede mà không nhắc quyết định thay thế (chỉ phát hiện, không tự sửa); spec: decision-citation-drift.md
- distillery — vùng học từ reference sources: index feature từng nguồn, so sánh chéo, porting log; spec: distillery.md (partial — chỉ phủ porting lifecycle, xem Open Gaps trong spec đó)
- distill-skill — skill portable vận hành vòng học (init/add/delta/seal/check); spec: chưa có (harvest sẽ viết)
```

### Full current source unit

```text
- platform-foundations — 8 luật thiết kế đã khóa đứng trên mọi code của compound stack; spec: platform-foundations.md
- work-state — bộ nhớ công việc tự quản của forgent (cửa lệnh `fgos`, nhật ký sự kiện là truth, bản chiếu dựng lại được); spec: work-state.md
- enduser-docs-authoring — soạn & nuôi tài liệu người-dùng-cuối ở khâu tổng-hợp, tức khi việc mang status `retrospective`: biến capture thật thành tài liệu theo ngăn Diataxis, một tài liệu sống trên mỗi đường dẫn, tích luỹ không mất (write-side); spec: enduser-docs-authoring.md
- enduser-docs-index — chỉ mục đọc-theo-tag máy-đọc-được của tài liệu người-dùng-cuối, sinh từ cây tài liệu + capture (`fgos docs-index`), giữ móc truy ngược tài liệu↔việc, và verb `fgos doc-sources` gom mọi capture của một đường dẫn (read-side); spec: enduser-docs-index.md
- runner — vòng tự hành: lấy việc từ frontier, giao trợ lý nền trong nhánh cô lập, tự chấm, ghi đề xuất chờ duyệt; spec: runner.md
- fgos-plugin — bề mặt slash-command `/fgOS:<verb>` cho Claude Code, 12 verb wrapper one-door-write bọc quanh CLI `fgos`; spec: fgos-plugin.md
- distribution — cài `fgos` từ ngoài source repo (npm install qua GitHub); spec: distribution.md
- decision-citation-drift — quét backlog/spec tìm dòng còn trích một quyết định đã bị supersede mà không nhắc quyết định thay thế (chỉ phát hiện, không tự sửa); spec: decision-citation-drift.md
- distillery — vùng học từ reference sources: index feature từng nguồn, so sánh chéo, porting log; spec: distillery.md (partial — chỉ phủ porting lifecycle, xem Open Gaps trong spec đó)
- distill-skill — skill portable vận hành vòng học (init/add/delta/seal/check); spec: chưa có (harvest sẽ viết)
- convention — nguồn quy tắc máy-chạy được cho sinh/kiểm tên và vị trí repository-relative, không sở hữu state hay sức khoẻ thân tài liệu; trạng thái implemented; spec: `../platform/convention/spec.md`
```

### Full current target unit

```text
- platform-foundations — 8 luật thiết kế đã khóa đứng trên mọi code của compound stack; spec: platform-foundations.md
- work-state — bộ nhớ công việc tự quản của forgent (cửa lệnh `fgos`, nhật ký sự kiện là truth, bản chiếu dựng lại được); spec: work-state.md
- enduser-docs-authoring — soạn & nuôi tài liệu người-dùng-cuối ở khâu tổng-hợp, tức khi việc mang status `retrospective`: biến capture thật thành tài liệu theo ngăn Diataxis, một tài liệu sống trên mỗi đường dẫn, tích luỹ không mất (write-side); spec: enduser-docs-authoring.md
- enduser-docs-index — chỉ mục đọc-theo-tag máy-đọc-được của tài liệu người-dùng-cuối, sinh từ cây tài liệu + capture (`fgos docs-index`), giữ móc truy ngược tài liệu↔việc, và verb `fgos doc-sources` gom mọi capture của một đường dẫn (read-side); spec: enduser-docs-index.md
- runner — vòng tự hành: lấy việc từ frontier, giao trợ lý nền trong nhánh cô lập, tự chấm, ghi đề xuất chờ duyệt; spec: runner.md
- fgos-plugin — bề mặt slash-command `/fgOS:<verb>` cho Claude Code, 12 verb wrapper one-door-write bọc quanh CLI `fgos`; spec: fgos-plugin.md
- distribution — cài `fgos` từ ngoài source repo (npm install qua GitHub); spec: distribution.md
- decision-citation-drift — quét backlog/spec tìm dòng còn trích một quyết định đã bị supersede mà không nhắc quyết định thay thế (chỉ phát hiện, không tự sửa); spec: decision-citation-drift.md
- distillery — vùng học từ reference sources: index feature từng nguồn, so sánh chéo, porting log; spec: distillery.md (partial — chỉ phủ porting lifecycle, xem Open Gaps trong spec đó)
- distill-skill — skill portable vận hành vòng học (init/add/delta/seal/check); spec: chưa có (harvest sẽ viết)
- convention — nguồn quy tắc máy-chạy được cho sinh/kiểm tên và vị trí repository-relative, không sở hữu state hay sức khoẻ thân tài liệu; trạng thái implemented; spec: `../platform/convention/spec.md`
```

## Native multiple-owner context for source review

The whole-system native scoped output also reports two identical-unit multiple-owner groups. Context below enumerates same-digest rows across the 826 source decisions. Review ownership explicitly and record any justified contextual exception independently; none is accepted or silently waived here. Whole-union output additionally includes inherited/cross-batch groups in whole-system-native-verification.json.

````text
[
  {
    "digest": "6a940230eb3172ac0cd44665b6d492a11ff8d99fe92c0f3b5c5eff8ae521ae54",
    "rows": [
      {
        "claimId": "claim_d5004a0febfecda8b898076cf021700d",
        "source": "docs/architect/architecture-intent.md",
        "sourceAnchor": "unheaded-block-8",
        "target": "docs/platform/system-architecture/architecture/architecture-intent.md",
        "targetAnchor": "unheaded-block-10",
        "sourceText": "```txt\nOutside hard:\n  contract, state, capability, topology, proof, audit\n\nInside soft:\n  soul, prose, skill, judgment, collaboration, domain intelligence\n```",
        "targetText": "```txt\nOutside hard:\n  contract, state, capability, topology, proof, audit\n\nInside soft:\n  soul, prose, skill, judgment, collaboration, domain intelligence\n```"
      },
      {
        "claimId": "claim_4b3408bc120b2ab7f05bdcdca3a78dab",
        "source": "docs/architect/system-vision-trong-mem-ngoai-cung.md",
        "sourceAnchor": "unheaded-block-8",
        "target": "docs/platform/system-architecture/architecture/system-vision-trong-mem-ngoai-cung.md",
        "targetAnchor": "unheaded-block-10",
        "sourceText": "```txt\nOutside hard:\n  contract, state, capability, topology, proof, audit\n\nInside soft:\n  soul, prose, skill, judgment, collaboration, domain intelligence\n```",
        "targetText": "```txt\nOutside hard:\n  contract, state, capability, topology, proof, audit\n\nInside soft:\n  soul, prose, skill, judgment, collaboration, domain intelligence\n```"
      }
    ]
  },
  {
    "digest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "rows": [
      {
        "claimId": "claim_f7e282b47557154231f0565bd30e5d7d",
        "source": "docs/architecture-map.md",
        "sourceAnchor": "unheaded-block-77",
        "target": "docs/platform/architecture-map.md",
        "targetAnchor": "unheaded-block-91",
        "sourceText": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.",
        "targetText": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ."
      },
      {
        "claimId": "claim_15a3179944bc76f990fe1b965e40a9da",
        "source": "docs/architecture-map.md",
        "sourceAnchor": "unheaded-block-83",
        "target": "docs/platform/architecture-map.md",
        "targetAnchor": "unheaded-block-97",
        "sourceText": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.",
        "targetText": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ."
      },
      {
        "claimId": "claim_e4b03884bb0c50d641f173b8a74c6501",
        "source": "docs/specs/system-overview.md",
        "sourceAnchor": "unheaded-block-25",
        "target": "docs/platform/system-overview/spec.md",
        "targetAnchor": "unheaded-block-28",
        "sourceText": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.",
        "targetText": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ."
      },
      {
        "claimId": "claim_ba26d5145625a6a74f3d1f4801c35407",
        "source": "docs/specs/system-overview.md",
        "sourceAnchor": "unheaded-block-34",
        "target": "docs/platform/system-overview/spec.md",
        "targetAnchor": "unheaded-block-37",
        "sourceText": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.",
        "targetText": "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ."
      }
    ]
  }
]
````
