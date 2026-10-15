# Independent bounded runner source review

Content commit: 81d0ed0747014e976c0d29222439fd6e3592b468

Author session: codex-session:unit-run-1792057868388-68b4a62c@2026-10-15

Entries: **69**. Target: `docs/platform/runner/decisions/h-36d872fbb0e5.md`; part 4/5. Shard: `plans/260925-documentation-authority-unification/ledger/decisions/s9-runner-01.json`; SHA256 `de26feeaa57cfde916a78fdb423735da6335dbc35138e4ef545293c3bb50222b`. Sidecar SHA256 `5516385e9b431c28e47d5d45e16c0621af7c27aefd3ccc14260097ba5391a673`.

Read review-brief.md, owner-answers.md A19/A22/A28/A34/A36 and the frozen runner map. Ordinary conservation review only; no truth, promotion or retirement approval. Mechanically verify every digest, anchor, ancestry, native identity, one owner and shard/pack equality. Reviewer independently selects and records seeds and IDs, reads both directions with the full diff, and labels every own note deep or mechanical. More than 3% deep rework requires full-pack deep reading. Return Reviewer, Author session(s), Review mode: ordinary, content/request/shard pins and one five-column Claim | Verdict | Note | Source digest | Target digest row per entry; full 64-hex digests, literal none for absent target, ok/rework/hold. No producer verdict, draw or seed is supplied. Consolidate source packs by the original shard before ordinary application.

A36: reviewer-drawn minimum **11/69** Weak-exact/Judgment entries for this pack, plus every unequal-digest pair. Complete batch: 494 Weak-exact and 1 Judgment; at least 75 Weak-exact plus the sole Judgment overall (per-pack minima can require more). No Unit-exact population exists. Full direct-section text is shown for headings; large single sections may span consecutive block packs, without truncating any unit. Map additions and both rebound anchors are explicitly marked on every affected section row.

```json
{
  "classes": {
    "Unit-exact": [],
    "Weak-exact": [
      "claim_c0672ae1fee3b8e0cf510d20e0a8182e",
      "claim_002a6b92116ec28d662640e1e89671b7",
      "claim_f244a49b381b84f2265eb19cc53b1e0d",
      "claim_e4fdc42773a81841395569ebfc329b9c",
      "claim_a5af409c9d028a46e92aa8895092fbe6",
      "claim_1b4b4a395908f7637698bb42f056c13e",
      "claim_00ce8ef23aaec1a6dd9be0251ba0ca3b",
      "claim_371222afa35d71e431880dad1784cf04",
      "claim_536d52a6ffb586e443eb108fd484321c",
      "claim_9f2a1ccb4acc02d2d0ad5184a15f279d",
      "claim_0163048a257e22c77a1e44259494c98f",
      "claim_b7ccfa65fda08cc020c57ffa801d1c38",
      "claim_85060cd9275d780186c1c7955e5c9b38",
      "claim_48f4ffa8956be8bea3cda3d930af48ac",
      "claim_3819de81bd71f836fc98fa1001d93cf0",
      "claim_49d987137a47fb3d97c468550abee8dc",
      "claim_d06b2ce15133866437a691773e465006",
      "claim_c566d2915315a14071f537397117652a",
      "claim_6347e924083dea028ded2fda743ce159",
      "claim_c1782e7b7f51dd2fa7de56e718cb2bff",
      "claim_ea01435fbfce2b1e73381c5d9a7c6066",
      "claim_68e9ce61dbff7a530b70a2ccf6531a45",
      "claim_da653bb7293a682b05f3dcc0a1b3753b",
      "claim_42f9bfce702ea73a320ebcbe6cd80249",
      "claim_90ca441a35296b4601a31f2cf224e3b3",
      "claim_b9b783d16e302d9058489856e6cde481",
      "claim_d6be3a263e08b4c045ee002b60f4ede5",
      "claim_b45337089f8c74230dd66cd48ffe7825",
      "claim_f63e378b765126fb5426a7286a0a46c9",
      "claim_6ab28f921687d640ffb6ca17a5624261",
      "claim_b41ad20350f43a6ae7e49e01615baf5a",
      "claim_87b482a8b3e86d2d207141caad98379c",
      "claim_8f08ea8e31fecc895af7d5e5a5e729ba",
      "claim_66d9ed7d6c7312c4cde589fe1599d01c",
      "claim_6b073340e38b94b93db36f74a464f9c1",
      "claim_de74e982f45712c6d325e6a73eff45d6",
      "claim_b3a64f399876516efe3d00b4947b5d2b",
      "claim_02823a65efd2dfedd5ede5d38c5a7cbc",
      "claim_23287bcf7f6983bd1851efd037ced88f",
      "claim_8c90d9e626770349175e1bb0b1d9d46f",
      "claim_ea470beddec07b87fdc8d614f0e8c5c1",
      "claim_ddda01d789306855b66939663369488f",
      "claim_b8231625af5863b35986d15572ab7041",
      "claim_c68d7217ca0e657d27be51d28bb0cc14",
      "claim_b92bcaec50873a4ba6513926553e9df2",
      "claim_eef0985b1a2daecb884c83023fd1a14c",
      "claim_f88e4e8f91d884a569207232482994b8",
      "claim_ea6c7805244cf8d32e0049344304793c",
      "claim_01c7bf35907bf840b28be6434de1f73c",
      "claim_f47c2464ff9bf0ea6de9116bdbe10a7e",
      "claim_9a32cf51438ebcc2dbfcd8e4a11de03f",
      "claim_da1e3a8deb956d81d89ec3070c143658",
      "claim_fe16812176a17d9c4073dd71e177ead9",
      "claim_98c9deafd1078e8774b93960ce4d5b3a",
      "claim_6ef3646b241b71499ad9cd9d02350ca5",
      "claim_c1357150cb5532d69feff97882984ccd",
      "claim_a943de3a0ff8cc96f993fec6c3cc3a1e",
      "claim_c11b67ceb76902b9ab0c1b9cab4c30c3",
      "claim_fc981ac524ca57bc04c4ead8ea3161fe",
      "claim_d924302fcdb23d9601a6054fb6957ec0",
      "claim_e79647f02e8a3507c31e2e57c75b929c",
      "claim_cdf96a5e899850a9fdb3343d9d6c4fcd",
      "claim_3f61f80f487a94e1e4bb0963bf6348b5",
      "claim_bd37b242f88115e67cb9870bf1741376",
      "claim_755111c889e95014f99c54a41a112ca3",
      "claim_dc3c8fc66a4e43d514339862bcc10846",
      "claim_0a282d6aafb1cee14928a469d20dbcf2",
      "claim_b34c6fba42019062dea0b1058540985e",
      "claim_44294c754f97f771769d49ebd6a0614d"
    ],
    "Judgment": []
  },
  "unequalDigestPairs": [],
  "mapAmendmentIDs": [],
  "reboundAnchorIDs": []
}
```

## claim_c0672ae1fee3b8e0cf510d20e0a8182e

Source digest: 518b40214e39e32458b4abd8df5835a0d63076b09fe1e495606b103633fcfb69

Target digest: 518b40214e39e32458b4abd8df5835a0d63076b09fe1e495606b103633fcfb69

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "0032-cổng-iron-law-chỉ-hỏi-ở-ranh-giới-trunk-thêm-mức-warn-agent-gõ-lệnh-thay-người",
  "sourceLines": [
    2679,
    2679
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "0032-cổng-iron-law-chỉ-hỏi-ở-ranh-giới-trunk-thêm-mức-warn-agent-gõ-lệnh-thay-người",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
  ],
  "nativeTargetClaimId": "claim_cd7af8dddd85f8f7783f8346620fdd0b",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "0032-cổng-iron-law-chỉ-hỏi-ở-ranh-giới-trunk-thêm-mức-warn-agent-gõ-lệnh-thay-người",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_c0672ae1fee3b8e0cf510d20e0a8182e",
    "sourceUnitDigest": "518b40214e39e32458b4abd8df5835a0d63076b09fe1e495606b103633fcfb69",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "0032-cổng-iron-law-chỉ-hỏi-ở-ranh-giới-trunk-thêm-mức-warn-agent-gõ-lệnh-thay-người",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole heading docs/specs/runner.md#0032-cổng-iron-law-chỉ-hỏi-ở-ranh-giới-trunk-thêm-mức-warn-agent-gõ-lệnh-thay-người (lines 2679–2679) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#0032-cổng-iron-law-chỉ-hỏi-ở-ranh-giới-trunk-thêm-mức-warn-agent-gõ-lệnh-thay-người. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "518b40214e39e32458b4abd8df5835a0d63076b09fe1e495606b103633fcfb69",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
    ]
  }
}
```

### Full source unit

```text
### 0032 — Cổng Iron Law chỉ hỏi ở ranh giới trunk, thêm mức `warn`, agent gõ lệnh thay người
```

### Full target unit

```text
### 0032 — Cổng Iron Law chỉ hỏi ở ranh giới trunk, thêm mức `warn`, agent gõ lệnh thay người
```

### Full diff

```diff
No text difference.
```

## claim_002a6b92116ec28d662640e1e89671b7

Source digest: c59a3e00f3c7354ba734d5bcf7728b08b771cdc2b66131e43a37719b2491dd98

Target digest: c59a3e00f3c7354ba734d5bcf7728b08b771cdc2b66131e43a37719b2491dd98

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "bối-cảnh-12",
  "sourceLines": [
    2681,
    2681
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0032 — Cổng Iron Law chỉ hỏi ở ranh giới trunk, thêm mức `warn`, agent gõ lệnh thay người"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "bối-cảnh-12",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0032 — Cổng Iron Law chỉ hỏi ở ranh giới trunk, thêm mức `warn`, agent gõ lệnh thay người"
  ],
  "nativeTargetClaimId": "claim_ecf6e528377ea37d58afa2d9516f6a86",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; source unit shorter than 40 characters",
  "section": "bối-cảnh-12",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_002a6b92116ec28d662640e1e89671b7",
    "sourceUnitDigest": "c59a3e00f3c7354ba734d5bcf7728b08b771cdc2b66131e43a37719b2491dd98",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "bối-cảnh-12",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; source unit shorter than 40 characters. Whole heading docs/specs/runner.md#bối-cảnh-12 (lines 2681–2681) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#bối-cảnh-12. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "c59a3e00f3c7354ba734d5bcf7728b08b771cdc2b66131e43a37719b2491dd98",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0032 — Cổng Iron Law chỉ hỏi ở ranh giới trunk, thêm mức `warn`, agent gõ lệnh thay người"
    ]
  }
}
```

### Full source unit

```text
#### Bối cảnh

Cổng Iron Law (`classifyIronLaw`, `src/evolve/iron-law.mjs`) hỏi một câu
đáng hỏi: diff đang chờ merge này có NĂNG LỰC làm yếu chính kỷ luật
gate/verify của hệ không? Câu hỏi giữ nguyên giá trị. Cách nó hỏi thì
không.

` self-improve-loop` — hai quyết định nội tuyến, chỉ tồn tại dưới
dạng trích dẫn trong `docs/specs/runner.md` và trong `view.decisions` của
nhật ký sự kiện, không phải một record đánh số dưới `docs/decisions/` —
khoá cổng ở đúng một hình dạng: chạy trên MỌI đề xuất nguồn `runner`, và
`required: true` mà thiếu `--acknowledge-iron-law` thì **từ chối cứng,
không có mức nào khác**. Ba hệ quả đo được, ghi trong
`docs/history/iron-law-gate-human-ux/DISCUSSION.md`:

1. **Hỏi ở chỗ không có gì để mất.** Một leaf merge vào `fgw/<root>` không
   đụng tới trunk, nhưng vẫn phải trả lời câu hỏi "diff này có thể làm yếu
   gate không" y như một root land thẳng lên main. Cùng một diff bị hỏi
   nhiều lần trên đường đi lên, và lần hỏi cuối — lần duy nhất thật sự
   chặn được gì — chìm giữa những lần hỏi vô hại.
2. **Không có nấc nào giữa "chặn cứng" và "gỡ hẳn".** Một người muốn xem
   cổng bắt gì mà chưa muốn nó chặn thì không có lựa chọn nào ngoài việc
   không dùng.
3. **Câu hỏi treo nghẽn cả hàng.** `merge-loop` gặp một item bị Iron Law
   giữ thì dừng cả vòng, dù những item còn lại phía sau không liên quan gì
   — ngược thẳng bậc ưu tiên #2 "Release con người" (`0030`): một câu hỏi
   treo không được nghẽn phần việc khác còn tiến được.

Iron Law **không** nằm trong `docs/platform-foundations.md` (đã kiểm bằng
grep, không khớp) — nên đây là sửa spec, không phải đổi một luật khoá.
```

### Full target unit

```text
#### Bối cảnh

Cổng Iron Law (`classifyIronLaw`, `src/evolve/iron-law.mjs`) hỏi một câu
đáng hỏi: diff đang chờ merge này có NĂNG LỰC làm yếu chính kỷ luật
gate/verify của hệ không? Câu hỏi giữ nguyên giá trị. Cách nó hỏi thì
không.

` self-improve-loop` — hai quyết định nội tuyến, chỉ tồn tại dưới
dạng trích dẫn trong `docs/specs/runner.md` và trong `view.decisions` của
nhật ký sự kiện, không phải một record đánh số dưới `docs/decisions/` —
khoá cổng ở đúng một hình dạng: chạy trên MỌI đề xuất nguồn `runner`, và
`required: true` mà thiếu `--acknowledge-iron-law` thì **từ chối cứng,
không có mức nào khác**. Ba hệ quả đo được, ghi trong
`docs/history/iron-law-gate-human-ux/DISCUSSION.md`:

1. **Hỏi ở chỗ không có gì để mất.** Một leaf merge vào `fgw/<root>` không
   đụng tới trunk, nhưng vẫn phải trả lời câu hỏi "diff này có thể làm yếu
   gate không" y như một root land thẳng lên main. Cùng một diff bị hỏi
   nhiều lần trên đường đi lên, và lần hỏi cuối — lần duy nhất thật sự
   chặn được gì — chìm giữa những lần hỏi vô hại.
2. **Không có nấc nào giữa "chặn cứng" và "gỡ hẳn".** Một người muốn xem
   cổng bắt gì mà chưa muốn nó chặn thì không có lựa chọn nào ngoài việc
   không dùng.
3. **Câu hỏi treo nghẽn cả hàng.** `merge-loop` gặp một item bị Iron Law
   giữ thì dừng cả vòng, dù những item còn lại phía sau không liên quan gì
   — ngược thẳng bậc ưu tiên #2 "Release con người" (`0030`): một câu hỏi
   treo không được nghẽn phần việc khác còn tiến được.

Iron Law **không** nằm trong `docs/platform-foundations.md` (đã kiểm bằng
grep, không khớp) — nên đây là sửa spec, không phải đổi một luật khoá.
```

### Full diff

```diff
No text difference.
```

## claim_f244a49b381b84f2265eb19cc53b1e0d

Source digest: a21dd4b6aaa3a83cbacbdf3a18581657ffeca8d202b4a2f958dfac2d69230930

Target digest: a21dd4b6aaa3a83cbacbdf3a18581657ffeca8d202b4a2f958dfac2d69230930

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-276",
  "sourceLines": [
    2683,
    2686
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0032 — Cổng Iron Law chỉ hỏi ở ranh giới trunk, thêm mức `warn`, agent gõ lệnh thay người",
    "Bối cảnh"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-135",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0032 — Cổng Iron Law chỉ hỏi ở ranh giới trunk, thêm mức `warn`, agent gõ lệnh thay người",
    "Bối cảnh"
  ],
  "nativeTargetClaimId": "claim_78122c69a840eda51b3a2ac5a61083ec",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "bối-cảnh-12",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_f244a49b381b84f2265eb19cc53b1e0d",
    "sourceUnitDigest": "a21dd4b6aaa3a83cbacbdf3a18581657ffeca8d202b4a2f958dfac2d69230930",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-135",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-276 (lines 2683–2686) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-135. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "a21dd4b6aaa3a83cbacbdf3a18581657ffeca8d202b4a2f958dfac2d69230930",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0032 — Cổng Iron Law chỉ hỏi ở ranh giới trunk, thêm mức `warn`, agent gõ lệnh thay người",
      "Bối cảnh"
    ]
  }
}
```

### Full source unit

```text
Cổng Iron Law (`classifyIronLaw`, `src/evolve/iron-law.mjs`) hỏi một câu
đáng hỏi: diff đang chờ merge này có NĂNG LỰC làm yếu chính kỷ luật
gate/verify của hệ không? Câu hỏi giữ nguyên giá trị. Cách nó hỏi thì
không.
```

### Full target unit

```text
Cổng Iron Law (`classifyIronLaw`, `src/evolve/iron-law.mjs`) hỏi một câu
đáng hỏi: diff đang chờ merge này có NĂNG LỰC làm yếu chính kỷ luật
gate/verify của hệ không? Câu hỏi giữ nguyên giá trị. Cách nó hỏi thì
không.
```

### Full diff

```diff
No text difference.
```

## claim_e4fdc42773a81841395569ebfc329b9c

Source digest: 6143095524c99a08a586120101f9683849e676b718479987e132589632daba2c

Target digest: 6143095524c99a08a586120101f9683849e676b718479987e132589632daba2c

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-277",
  "sourceLines": [
    2688,
    2694
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0032 — Cổng Iron Law chỉ hỏi ở ranh giới trunk, thêm mức `warn`, agent gõ lệnh thay người",
    "Bối cảnh"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-136",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0032 — Cổng Iron Law chỉ hỏi ở ranh giới trunk, thêm mức `warn`, agent gõ lệnh thay người",
    "Bối cảnh"
  ],
  "nativeTargetClaimId": "claim_074c11eefe4d99d7c04a71767a383095",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "bối-cảnh-12",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_e4fdc42773a81841395569ebfc329b9c",
    "sourceUnitDigest": "6143095524c99a08a586120101f9683849e676b718479987e132589632daba2c",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-136",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-277 (lines 2688–2694) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-136. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "6143095524c99a08a586120101f9683849e676b718479987e132589632daba2c",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0032 — Cổng Iron Law chỉ hỏi ở ranh giới trunk, thêm mức `warn`, agent gõ lệnh thay người",
      "Bối cảnh"
    ]
  }
}
```

### Full source unit

```text
` self-improve-loop` — hai quyết định nội tuyến, chỉ tồn tại dưới
dạng trích dẫn trong `docs/specs/runner.md` và trong `view.decisions` của
nhật ký sự kiện, không phải một record đánh số dưới `docs/decisions/` —
khoá cổng ở đúng một hình dạng: chạy trên MỌI đề xuất nguồn `runner`, và
`required: true` mà thiếu `--acknowledge-iron-law` thì **từ chối cứng,
không có mức nào khác**. Ba hệ quả đo được, ghi trong
`docs/history/iron-law-gate-human-ux/DISCUSSION.md`:
```

### Full target unit

```text
` self-improve-loop` — hai quyết định nội tuyến, chỉ tồn tại dưới
dạng trích dẫn trong `docs/specs/runner.md` và trong `view.decisions` của
nhật ký sự kiện, không phải một record đánh số dưới `docs/decisions/` —
khoá cổng ở đúng một hình dạng: chạy trên MỌI đề xuất nguồn `runner`, và
`required: true` mà thiếu `--acknowledge-iron-law` thì **từ chối cứng,
không có mức nào khác**. Ba hệ quả đo được, ghi trong
`docs/history/iron-law-gate-human-ux/DISCUSSION.md`:
```

### Full diff

```diff
No text difference.
```

## claim_a5af409c9d028a46e92aa8895092fbe6

Source digest: ccb2df5e27a3cde98912acf09d3ad18d9c03a74d1d828cb33e5c9beb2bbaa018

Target digest: ccb2df5e27a3cde98912acf09d3ad18d9c03a74d1d828cb33e5c9beb2bbaa018

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-278",
  "sourceLines": [
    2696,
    2707
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0032 — Cổng Iron Law chỉ hỏi ở ranh giới trunk, thêm mức `warn`, agent gõ lệnh thay người",
    "Bối cảnh"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-137",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0032 — Cổng Iron Law chỉ hỏi ở ranh giới trunk, thêm mức `warn`, agent gõ lệnh thay người",
    "Bối cảnh"
  ],
  "nativeTargetClaimId": "claim_611f8bdbe187bbd65cf9e94bb7406545",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "bối-cảnh-12",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_a5af409c9d028a46e92aa8895092fbe6",
    "sourceUnitDigest": "ccb2df5e27a3cde98912acf09d3ad18d9c03a74d1d828cb33e5c9beb2bbaa018",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-137",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-278 (lines 2696–2707) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-137. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "ccb2df5e27a3cde98912acf09d3ad18d9c03a74d1d828cb33e5c9beb2bbaa018",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0032 — Cổng Iron Law chỉ hỏi ở ranh giới trunk, thêm mức `warn`, agent gõ lệnh thay người",
      "Bối cảnh"
    ]
  }
}
```

### Full source unit

```text
1. **Hỏi ở chỗ không có gì để mất.** Một leaf merge vào `fgw/<root>` không
   đụng tới trunk, nhưng vẫn phải trả lời câu hỏi "diff này có thể làm yếu
   gate không" y như một root land thẳng lên main. Cùng một diff bị hỏi
   nhiều lần trên đường đi lên, và lần hỏi cuối — lần duy nhất thật sự
   chặn được gì — chìm giữa những lần hỏi vô hại.
2. **Không có nấc nào giữa "chặn cứng" và "gỡ hẳn".** Một người muốn xem
   cổng bắt gì mà chưa muốn nó chặn thì không có lựa chọn nào ngoài việc
   không dùng.
3. **Câu hỏi treo nghẽn cả hàng.** `merge-loop` gặp một item bị Iron Law
   giữ thì dừng cả vòng, dù những item còn lại phía sau không liên quan gì
   — ngược thẳng bậc ưu tiên #2 "Release con người" (`0030`): một câu hỏi
   treo không được nghẽn phần việc khác còn tiến được.
```

### Full target unit

```text
1. **Hỏi ở chỗ không có gì để mất.** Một leaf merge vào `fgw/<root>` không
   đụng tới trunk, nhưng vẫn phải trả lời câu hỏi "diff này có thể làm yếu
   gate không" y như một root land thẳng lên main. Cùng một diff bị hỏi
   nhiều lần trên đường đi lên, và lần hỏi cuối — lần duy nhất thật sự
   chặn được gì — chìm giữa những lần hỏi vô hại.
2. **Không có nấc nào giữa "chặn cứng" và "gỡ hẳn".** Một người muốn xem
   cổng bắt gì mà chưa muốn nó chặn thì không có lựa chọn nào ngoài việc
   không dùng.
3. **Câu hỏi treo nghẽn cả hàng.** `merge-loop` gặp một item bị Iron Law
   giữ thì dừng cả vòng, dù những item còn lại phía sau không liên quan gì
   — ngược thẳng bậc ưu tiên #2 "Release con người" (`0030`): một câu hỏi
   treo không được nghẽn phần việc khác còn tiến được.
```

### Full diff

```diff
No text difference.
```

## claim_1b4b4a395908f7637698bb42f056c13e

Source digest: f0a0bbbf3057f2791d0ff5a5c678ce831661781661148f80c50a923470756d6e

Target digest: f0a0bbbf3057f2791d0ff5a5c678ce831661781661148f80c50a923470756d6e

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-279",
  "sourceLines": [
    2709,
    2710
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0032 — Cổng Iron Law chỉ hỏi ở ranh giới trunk, thêm mức `warn`, agent gõ lệnh thay người",
    "Bối cảnh"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-138",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0032 — Cổng Iron Law chỉ hỏi ở ranh giới trunk, thêm mức `warn`, agent gõ lệnh thay người",
    "Bối cảnh"
  ],
  "nativeTargetClaimId": "claim_d6d9e692671881529ad50e3d5159e2da",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "bối-cảnh-12",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_1b4b4a395908f7637698bb42f056c13e",
    "sourceUnitDigest": "f0a0bbbf3057f2791d0ff5a5c678ce831661781661148f80c50a923470756d6e",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-138",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-279 (lines 2709–2710) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-138. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "f0a0bbbf3057f2791d0ff5a5c678ce831661781661148f80c50a923470756d6e",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0032 — Cổng Iron Law chỉ hỏi ở ranh giới trunk, thêm mức `warn`, agent gõ lệnh thay người",
      "Bối cảnh"
    ]
  }
}
```

### Full source unit

```text
Iron Law **không** nằm trong `docs/platform-foundations.md` (đã kiểm bằng
grep, không khớp) — nên đây là sửa spec, không phải đổi một luật khoá.
```

### Full target unit

```text
Iron Law **không** nằm trong `docs/platform-foundations.md` (đã kiểm bằng
grep, không khớp) — nên đây là sửa spec, không phải đổi một luật khoá.
```

### Full diff

```diff
No text difference.
```

## claim_00ce8ef23aaec1a6dd9be0251ba0ca3b

Source digest: fba7f5b48c1c78a285046e389aae2c388dcef9ec26dca41f2bc524687c5fb0fc

Target digest: fba7f5b48c1c78a285046e389aae2c388dcef9ec26dca41f2bc524687c5fb0fc

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "quyết-định-10",
  "sourceLines": [
    2712,
    2712
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0032 — Cổng Iron Law chỉ hỏi ở ranh giới trunk, thêm mức `warn`, agent gõ lệnh thay người"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "quyết-định-10",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0032 — Cổng Iron Law chỉ hỏi ở ranh giới trunk, thêm mức `warn`, agent gõ lệnh thay người"
  ],
  "nativeTargetClaimId": "claim_a7bcb7f027901033c3231fa899b4fa22",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; source unit shorter than 40 characters",
  "section": "quyết-định-10",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_00ce8ef23aaec1a6dd9be0251ba0ca3b",
    "sourceUnitDigest": "fba7f5b48c1c78a285046e389aae2c388dcef9ec26dca41f2bc524687c5fb0fc",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "quyết-định-10",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; source unit shorter than 40 characters. Whole heading docs/specs/runner.md#quyết-định-10 (lines 2712–2712) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#quyết-định-10. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "fba7f5b48c1c78a285046e389aae2c388dcef9ec26dca41f2bc524687c5fb0fc",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0032 — Cổng Iron Law chỉ hỏi ở ranh giới trunk, thêm mức `warn`, agent gõ lệnh thay người"
    ]
  }
}
```

### Full source unit

```text
#### Quyết định

Record này supersede **đúng mệnh đề "chặn cứng, luôn luôn, ở mọi ranh
giới merge"** của ` self-improve-loop`. Bốn thay đổi, tất cả đã có
thật trong code trước khi record này được viết:

1. **Cổng chỉ chạy ở ranh giới trunk** (`CONTEXT.md`). Leaf → `fgw/<root>`
   và `sync-root` vào nhánh cha đi thẳng, không hỏi. Discriminator **khác
   nhau theo từng call site**, cố ý không gộp thành helper chung
   (`plan.md` A1b): `approve` và pre-check của `merge next` dùng
   `resolveRoot(view, id) === id`; `sync-root` dùng `!item.parent`, vì nó
   chỉ land vào cha TRỰC TIẾP nên `resolveRoot` — vốn leo tới đỉnh lineage
   — sẽ trả lời sai cho một gốc có cha mà cha lại có ông.
2. **Hai mức, key config riêng** (`CONTEXT.md`). `ironLaw.level`:
 `ask` (mặc định) giữ nguyên hành vi từ chối cứng; `warn`
   (opt-in) in cảnh báo, ghi một bản ghi, rồi merge tiếp. Key **riêng**,
   không nhét vào `gateBypass` — floor của `gateBypass` được ghi trong
   `docs/explanation/gate-bypass-design.md` là không bao giờ chạm Iron Law,
   tái dùng từ vựng level của nó sẽ xoá đúng ranh giới ấy. Mọi giá trị
   không phải đúng chữ `warn` — thiếu key, file hỏng, gõ sai — đều đọc
   thành `ask`; mức dễ dãi là mức để một diff tự-sửa land mà không ai xem,
   nên nó không bao giờ được là mặc định của một lỗi.
3. **Người quyết định, agent thao tác** (`CONTEXT.md`). Người trả
   lời duyệt trong chat là đủ; agent tự chạy `fgos approve <id>
   --acknowledge-iron-law`, tự đọc exit code, tự sửa lỗi cơ học và tự
   retry — không đẩy một dòng lệnh cho người gõ tay. Cái được giữ nguyên
   là điều `docs/explanation/iron-law-evidence-contract-stays-human-gated.md`
   bảo vệ: **một bên thứ hai độc lập thật sự nhìn vào bằng chứng**. Agent
   trình `docs/history/<id>/iron-law-evidence.md` nguyên văn rồi hỏi; nó
   không bao giờ tự thêm `--acknowledge-iron-law` trên thẩm quyền của
   chính nó. Đổi là đổi ai gõ, không đổi ai quyết.
4. **Item bị giữ không nghẽn item khác** (`CONTEXT.md`). `merge-loop`
   đọc tín hiệu `skipped` / `every ready item is blocked` mà engine vốn đã
   trả sẵn, ghi id vào một danh sách rồi **đi tiếp**, cuối vòng trình gom
   một lượt kèm bằng chứng. Item ở nguyên `awaiting-approval` — không
   `fgos ask`, không `awaiting-human`, không cạnh FSM mới.

Đã cân nhắc và loại, ghi lại để không phải cãi lại:

- **Field bypass trên workitem** — loại: biến một quyết định vận hành
  thành một thuộc tính dữ liệu đi theo item mãi mãi.
- **Thêm cạnh FSM `awaiting-approval → awaiting-human` cho ** — loại:
  `src/state/status-fsm.mjs` nằm trong `MODULE_RULES` của chính Iron Law,
  nên bản vá sẽ trip đúng cái cổng nó đi sửa; và engine đã có sẵn
  `skipped`.
- **Nới nửa từ-khoá của `classifyIronLaw`** — ra khỏi phạm vi, chuyển
  sang `tsk-1js`. Chữ ký và hành vi `classifyIronLaw` giữ nguyên byte-for-byte.
```

### Full target unit

```text
#### Quyết định

Record này supersede **đúng mệnh đề "chặn cứng, luôn luôn, ở mọi ranh
giới merge"** của ` self-improve-loop`. Bốn thay đổi, tất cả đã có
thật trong code trước khi record này được viết:

1. **Cổng chỉ chạy ở ranh giới trunk** (`CONTEXT.md`). Leaf → `fgw/<root>`
   và `sync-root` vào nhánh cha đi thẳng, không hỏi. Discriminator **khác
   nhau theo từng call site**, cố ý không gộp thành helper chung
   (`plan.md` A1b): `approve` và pre-check của `merge next` dùng
   `resolveRoot(view, id) === id`; `sync-root` dùng `!item.parent`, vì nó
   chỉ land vào cha TRỰC TIẾP nên `resolveRoot` — vốn leo tới đỉnh lineage
   — sẽ trả lời sai cho một gốc có cha mà cha lại có ông.
2. **Hai mức, key config riêng** (`CONTEXT.md`). `ironLaw.level`:
 `ask` (mặc định) giữ nguyên hành vi từ chối cứng; `warn`
   (opt-in) in cảnh báo, ghi một bản ghi, rồi merge tiếp. Key **riêng**,
   không nhét vào `gateBypass` — floor của `gateBypass` được ghi trong
   `docs/explanation/gate-bypass-design.md` là không bao giờ chạm Iron Law,
   tái dùng từ vựng level của nó sẽ xoá đúng ranh giới ấy. Mọi giá trị
   không phải đúng chữ `warn` — thiếu key, file hỏng, gõ sai — đều đọc
   thành `ask`; mức dễ dãi là mức để một diff tự-sửa land mà không ai xem,
   nên nó không bao giờ được là mặc định của một lỗi.
3. **Người quyết định, agent thao tác** (`CONTEXT.md`). Người trả
   lời duyệt trong chat là đủ; agent tự chạy `fgos approve <id>
   --acknowledge-iron-law`, tự đọc exit code, tự sửa lỗi cơ học và tự
   retry — không đẩy một dòng lệnh cho người gõ tay. Cái được giữ nguyên
   là điều `docs/explanation/iron-law-evidence-contract-stays-human-gated.md`
   bảo vệ: **một bên thứ hai độc lập thật sự nhìn vào bằng chứng**. Agent
   trình `docs/history/<id>/iron-law-evidence.md` nguyên văn rồi hỏi; nó
   không bao giờ tự thêm `--acknowledge-iron-law` trên thẩm quyền của
   chính nó. Đổi là đổi ai gõ, không đổi ai quyết.
4. **Item bị giữ không nghẽn item khác** (`CONTEXT.md`). `merge-loop`
   đọc tín hiệu `skipped` / `every ready item is blocked` mà engine vốn đã
   trả sẵn, ghi id vào một danh sách rồi **đi tiếp**, cuối vòng trình gom
   một lượt kèm bằng chứng. Item ở nguyên `awaiting-approval` — không
   `fgos ask`, không `awaiting-human`, không cạnh FSM mới.

Đã cân nhắc và loại, ghi lại để không phải cãi lại:

- **Field bypass trên workitem** — loại: biến một quyết định vận hành
  thành một thuộc tính dữ liệu đi theo item mãi mãi.
- **Thêm cạnh FSM `awaiting-approval → awaiting-human` cho ** — loại:
  `src/state/status-fsm.mjs` nằm trong `MODULE_RULES` của chính Iron Law,
  nên bản vá sẽ trip đúng cái cổng nó đi sửa; và engine đã có sẵn
  `skipped`.
- **Nới nửa từ-khoá của `classifyIronLaw`** — ra khỏi phạm vi, chuyển
  sang `tsk-1js`. Chữ ký và hành vi `classifyIronLaw` giữ nguyên byte-for-byte.
```

### Full diff

```diff
No text difference.
```

## claim_371222afa35d71e431880dad1784cf04

Source digest: 1ee73d8aac501843fce4f5d81fec4ff1da33e53fc25eacc955dcb5bef6eccb85

Target digest: 1ee73d8aac501843fce4f5d81fec4ff1da33e53fc25eacc955dcb5bef6eccb85

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-280",
  "sourceLines": [
    2714,
    2716
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0032 — Cổng Iron Law chỉ hỏi ở ranh giới trunk, thêm mức `warn`, agent gõ lệnh thay người",
    "Quyết định"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-139",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0032 — Cổng Iron Law chỉ hỏi ở ranh giới trunk, thêm mức `warn`, agent gõ lệnh thay người",
    "Quyết định"
  ],
  "nativeTargetClaimId": "claim_a09a3e33495eb646b61f7a68d864d40b",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "quyết-định-10",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_371222afa35d71e431880dad1784cf04",
    "sourceUnitDigest": "1ee73d8aac501843fce4f5d81fec4ff1da33e53fc25eacc955dcb5bef6eccb85",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-139",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-280 (lines 2714–2716) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-139. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "1ee73d8aac501843fce4f5d81fec4ff1da33e53fc25eacc955dcb5bef6eccb85",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0032 — Cổng Iron Law chỉ hỏi ở ranh giới trunk, thêm mức `warn`, agent gõ lệnh thay người",
      "Quyết định"
    ]
  }
}
```

### Full source unit

```text
Record này supersede **đúng mệnh đề "chặn cứng, luôn luôn, ở mọi ranh
giới merge"** của ` self-improve-loop`. Bốn thay đổi, tất cả đã có
thật trong code trước khi record này được viết:
```

### Full target unit

```text
Record này supersede **đúng mệnh đề "chặn cứng, luôn luôn, ở mọi ranh
giới merge"** của ` self-improve-loop`. Bốn thay đổi, tất cả đã có
thật trong code trước khi record này được viết:
```

### Full diff

```diff
No text difference.
```

## claim_536d52a6ffb586e443eb108fd484321c

Source digest: a1b7afdaf4605e2a1ae907b853cbfc5e65098292a71ef1f0eb6a0aecb9f92ea2

Target digest: a1b7afdaf4605e2a1ae907b853cbfc5e65098292a71ef1f0eb6a0aecb9f92ea2

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-281",
  "sourceLines": [
    2718,
    2747
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0032 — Cổng Iron Law chỉ hỏi ở ranh giới trunk, thêm mức `warn`, agent gõ lệnh thay người",
    "Quyết định"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-140",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0032 — Cổng Iron Law chỉ hỏi ở ranh giới trunk, thêm mức `warn`, agent gõ lệnh thay người",
    "Quyết định"
  ],
  "nativeTargetClaimId": "claim_fe3dea2e5016c9d95417bba43c73c3fc",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "quyết-định-10",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_536d52a6ffb586e443eb108fd484321c",
    "sourceUnitDigest": "a1b7afdaf4605e2a1ae907b853cbfc5e65098292a71ef1f0eb6a0aecb9f92ea2",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-140",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-281 (lines 2718–2747) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-140. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "a1b7afdaf4605e2a1ae907b853cbfc5e65098292a71ef1f0eb6a0aecb9f92ea2",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0032 — Cổng Iron Law chỉ hỏi ở ranh giới trunk, thêm mức `warn`, agent gõ lệnh thay người",
      "Quyết định"
    ]
  }
}
```

### Full source unit

```text
1. **Cổng chỉ chạy ở ranh giới trunk** (`CONTEXT.md`). Leaf → `fgw/<root>`
   và `sync-root` vào nhánh cha đi thẳng, không hỏi. Discriminator **khác
   nhau theo từng call site**, cố ý không gộp thành helper chung
   (`plan.md` A1b): `approve` và pre-check của `merge next` dùng
   `resolveRoot(view, id) === id`; `sync-root` dùng `!item.parent`, vì nó
   chỉ land vào cha TRỰC TIẾP nên `resolveRoot` — vốn leo tới đỉnh lineage
   — sẽ trả lời sai cho một gốc có cha mà cha lại có ông.
2. **Hai mức, key config riêng** (`CONTEXT.md`). `ironLaw.level`:
 `ask` (mặc định) giữ nguyên hành vi từ chối cứng; `warn`
   (opt-in) in cảnh báo, ghi một bản ghi, rồi merge tiếp. Key **riêng**,
   không nhét vào `gateBypass` — floor của `gateBypass` được ghi trong
   `docs/explanation/gate-bypass-design.md` là không bao giờ chạm Iron Law,
   tái dùng từ vựng level của nó sẽ xoá đúng ranh giới ấy. Mọi giá trị
   không phải đúng chữ `warn` — thiếu key, file hỏng, gõ sai — đều đọc
   thành `ask`; mức dễ dãi là mức để một diff tự-sửa land mà không ai xem,
   nên nó không bao giờ được là mặc định của một lỗi.
3. **Người quyết định, agent thao tác** (`CONTEXT.md`). Người trả
   lời duyệt trong chat là đủ; agent tự chạy `fgos approve <id>
   --acknowledge-iron-law`, tự đọc exit code, tự sửa lỗi cơ học và tự
   retry — không đẩy một dòng lệnh cho người gõ tay. Cái được giữ nguyên
   là điều `docs/explanation/iron-law-evidence-contract-stays-human-gated.md`
   bảo vệ: **một bên thứ hai độc lập thật sự nhìn vào bằng chứng**. Agent
   trình `docs/history/<id>/iron-law-evidence.md` nguyên văn rồi hỏi; nó
   không bao giờ tự thêm `--acknowledge-iron-law` trên thẩm quyền của
   chính nó. Đổi là đổi ai gõ, không đổi ai quyết.
4. **Item bị giữ không nghẽn item khác** (`CONTEXT.md`). `merge-loop`
   đọc tín hiệu `skipped` / `every ready item is blocked` mà engine vốn đã
   trả sẵn, ghi id vào một danh sách rồi **đi tiếp**, cuối vòng trình gom
   một lượt kèm bằng chứng. Item ở nguyên `awaiting-approval` — không
   `fgos ask`, không `awaiting-human`, không cạnh FSM mới.
```

### Full target unit

```text
1. **Cổng chỉ chạy ở ranh giới trunk** (`CONTEXT.md`). Leaf → `fgw/<root>`
   và `sync-root` vào nhánh cha đi thẳng, không hỏi. Discriminator **khác
   nhau theo từng call site**, cố ý không gộp thành helper chung
   (`plan.md` A1b): `approve` và pre-check của `merge next` dùng
   `resolveRoot(view, id) === id`; `sync-root` dùng `!item.parent`, vì nó
   chỉ land vào cha TRỰC TIẾP nên `resolveRoot` — vốn leo tới đỉnh lineage
   — sẽ trả lời sai cho một gốc có cha mà cha lại có ông.
2. **Hai mức, key config riêng** (`CONTEXT.md`). `ironLaw.level`:
 `ask` (mặc định) giữ nguyên hành vi từ chối cứng; `warn`
   (opt-in) in cảnh báo, ghi một bản ghi, rồi merge tiếp. Key **riêng**,
   không nhét vào `gateBypass` — floor của `gateBypass` được ghi trong
   `docs/explanation/gate-bypass-design.md` là không bao giờ chạm Iron Law,
   tái dùng từ vựng level của nó sẽ xoá đúng ranh giới ấy. Mọi giá trị
   không phải đúng chữ `warn` — thiếu key, file hỏng, gõ sai — đều đọc
   thành `ask`; mức dễ dãi là mức để một diff tự-sửa land mà không ai xem,
   nên nó không bao giờ được là mặc định của một lỗi.
3. **Người quyết định, agent thao tác** (`CONTEXT.md`). Người trả
   lời duyệt trong chat là đủ; agent tự chạy `fgos approve <id>
   --acknowledge-iron-law`, tự đọc exit code, tự sửa lỗi cơ học và tự
   retry — không đẩy một dòng lệnh cho người gõ tay. Cái được giữ nguyên
   là điều `docs/explanation/iron-law-evidence-contract-stays-human-gated.md`
   bảo vệ: **một bên thứ hai độc lập thật sự nhìn vào bằng chứng**. Agent
   trình `docs/history/<id>/iron-law-evidence.md` nguyên văn rồi hỏi; nó
   không bao giờ tự thêm `--acknowledge-iron-law` trên thẩm quyền của
   chính nó. Đổi là đổi ai gõ, không đổi ai quyết.
4. **Item bị giữ không nghẽn item khác** (`CONTEXT.md`). `merge-loop`
   đọc tín hiệu `skipped` / `every ready item is blocked` mà engine vốn đã
   trả sẵn, ghi id vào một danh sách rồi **đi tiếp**, cuối vòng trình gom
   một lượt kèm bằng chứng. Item ở nguyên `awaiting-approval` — không
   `fgos ask`, không `awaiting-human`, không cạnh FSM mới.
```

### Full diff

```diff
No text difference.
```

## claim_9f2a1ccb4acc02d2d0ad5184a15f279d

Source digest: ba6192fe9e0c958575756224207afccafeda6a93d79e62bcc508598d734d09ed

Target digest: ba6192fe9e0c958575756224207afccafeda6a93d79e62bcc508598d734d09ed

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-282",
  "sourceLines": [
    2749,
    2749
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0032 — Cổng Iron Law chỉ hỏi ở ranh giới trunk, thêm mức `warn`, agent gõ lệnh thay người",
    "Quyết định"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-141",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0032 — Cổng Iron Law chỉ hỏi ở ranh giới trunk, thêm mức `warn`, agent gõ lệnh thay người",
    "Quyết định"
  ],
  "nativeTargetClaimId": "claim_5565fccceed48613a031d5da2247a7fb",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "quyết-định-10",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_9f2a1ccb4acc02d2d0ad5184a15f279d",
    "sourceUnitDigest": "ba6192fe9e0c958575756224207afccafeda6a93d79e62bcc508598d734d09ed",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-141",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-282 (lines 2749–2749) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-141. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "ba6192fe9e0c958575756224207afccafeda6a93d79e62bcc508598d734d09ed",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0032 — Cổng Iron Law chỉ hỏi ở ranh giới trunk, thêm mức `warn`, agent gõ lệnh thay người",
      "Quyết định"
    ]
  }
}
```

### Full source unit

```text
Đã cân nhắc và loại, ghi lại để không phải cãi lại:
```

### Full target unit

```text
Đã cân nhắc và loại, ghi lại để không phải cãi lại:
```

### Full diff

```diff
No text difference.
```

## claim_0163048a257e22c77a1e44259494c98f

Source digest: 0aa4e0a81b6dc004d0b9fcc224954282bd2d54da0af1dca2fbc4cbe33c4fa0c8

Target digest: 0aa4e0a81b6dc004d0b9fcc224954282bd2d54da0af1dca2fbc4cbe33c4fa0c8

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-283",
  "sourceLines": [
    2751,
    2758
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0032 — Cổng Iron Law chỉ hỏi ở ranh giới trunk, thêm mức `warn`, agent gõ lệnh thay người",
    "Quyết định"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-142",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0032 — Cổng Iron Law chỉ hỏi ở ranh giới trunk, thêm mức `warn`, agent gõ lệnh thay người",
    "Quyết định"
  ],
  "nativeTargetClaimId": "claim_f73d308f620a56331430ed340c51b9f7",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "quyết-định-10",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_0163048a257e22c77a1e44259494c98f",
    "sourceUnitDigest": "0aa4e0a81b6dc004d0b9fcc224954282bd2d54da0af1dca2fbc4cbe33c4fa0c8",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-142",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-283 (lines 2751–2758) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-142. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "0aa4e0a81b6dc004d0b9fcc224954282bd2d54da0af1dca2fbc4cbe33c4fa0c8",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0032 — Cổng Iron Law chỉ hỏi ở ranh giới trunk, thêm mức `warn`, agent gõ lệnh thay người",
      "Quyết định"
    ]
  }
}
```

### Full source unit

```text
- **Field bypass trên workitem** — loại: biến một quyết định vận hành
  thành một thuộc tính dữ liệu đi theo item mãi mãi.
- **Thêm cạnh FSM `awaiting-approval → awaiting-human` cho ** — loại:
  `src/state/status-fsm.mjs` nằm trong `MODULE_RULES` của chính Iron Law,
  nên bản vá sẽ trip đúng cái cổng nó đi sửa; và engine đã có sẵn
  `skipped`.
- **Nới nửa từ-khoá của `classifyIronLaw`** — ra khỏi phạm vi, chuyển
  sang `tsk-1js`. Chữ ký và hành vi `classifyIronLaw` giữ nguyên byte-for-byte.
```

### Full target unit

```text
- **Field bypass trên workitem** — loại: biến một quyết định vận hành
  thành một thuộc tính dữ liệu đi theo item mãi mãi.
- **Thêm cạnh FSM `awaiting-approval → awaiting-human` cho ** — loại:
  `src/state/status-fsm.mjs` nằm trong `MODULE_RULES` của chính Iron Law,
  nên bản vá sẽ trip đúng cái cổng nó đi sửa; và engine đã có sẵn
  `skipped`.
- **Nới nửa từ-khoá của `classifyIronLaw`** — ra khỏi phạm vi, chuyển
  sang `tsk-1js`. Chữ ký và hành vi `classifyIronLaw` giữ nguyên byte-for-byte.
```

### Full diff

```diff
No text difference.
```

## claim_b7ccfa65fda08cc020c57ffa801d1c38

Source digest: 493d626ba20ba39d1c0c025b7cce217de45a7a7f4356dbd99a54e93a652e00b2

Target digest: 493d626ba20ba39d1c0c025b7cce217de45a7a7f4356dbd99a54e93a652e00b2

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "vì-sao-supersedes-trống",
  "sourceLines": [
    2760,
    2760
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0032 — Cổng Iron Law chỉ hỏi ở ranh giới trunk, thêm mức `warn`, agent gõ lệnh thay người"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "vì-sao-supersedes-trống",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0032 — Cổng Iron Law chỉ hỏi ở ranh giới trunk, thêm mức `warn`, agent gõ lệnh thay người"
  ],
  "nativeTargetClaimId": "claim_cfa8d0b5f3bb1189ecd9c5b4abf4f00e",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; source unit shorter than 40 characters",
  "section": "vì-sao-supersedes-trống",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_b7ccfa65fda08cc020c57ffa801d1c38",
    "sourceUnitDigest": "493d626ba20ba39d1c0c025b7cce217de45a7a7f4356dbd99a54e93a652e00b2",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "vì-sao-supersedes-trống",
    "claimKind": "decision",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; source unit shorter than 40 characters. Whole heading docs/specs/runner.md#vì-sao-supersedes-trống (lines 2760–2760) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#vì-sao-supersedes-trống. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "493d626ba20ba39d1c0c025b7cce217de45a7a7f4356dbd99a54e93a652e00b2",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0032 — Cổng Iron Law chỉ hỏi ở ranh giới trunk, thêm mức `warn`, agent gõ lệnh thay người"
    ]
  }
}
```

### Full source unit

```text
#### Vì sao `supersedes:` trống

` self-improve-loop` không phải record đánh số — chúng là quyết
định nội tuyến, trích dẫn trong `docs/specs/runner.md` (RUL34 (Iron Law áp dụng khi chạm cờ rủi ro hoặc module năng-lực — không cần cả hai), RUL37 (Iron Law hỏi ở đúng một ranh giới — trunk — cho mọi đề xuất nguồn runner tới đó),
Data Dictionary #10) và sống trong `view.decisions`. Không có file nào để
gắn `superseded_by:` trỏ ngược, nên khuôn trỏ-ngược-bắt-buộc STR72
(`scripts/check-decision-supersession.mjs`) không áp dụng được và
`supersedes:` để trống có chủ đích, thay vì bịa một id không tồn tại.
Việc supersede được ghi bằng văn, ở đây và tại chính RUL34 (Iron Law áp dụng khi chạm cờ rủi ro hoặc module năng-lực — không cần cả hai)/RUL37 (Iron Law hỏi ở đúng một ranh giới — trunk — cho mọi đề xuất nguồn runner tới đó).
```

### Full target unit

```text
#### Vì sao `supersedes:` trống

` self-improve-loop` không phải record đánh số — chúng là quyết
định nội tuyến, trích dẫn trong `docs/specs/runner.md` (RUL34 (Iron Law áp dụng khi chạm cờ rủi ro hoặc module năng-lực — không cần cả hai), RUL37 (Iron Law hỏi ở đúng một ranh giới — trunk — cho mọi đề xuất nguồn runner tới đó),
Data Dictionary #10) và sống trong `view.decisions`. Không có file nào để
gắn `superseded_by:` trỏ ngược, nên khuôn trỏ-ngược-bắt-buộc STR72
(`scripts/check-decision-supersession.mjs`) không áp dụng được và
`supersedes:` để trống có chủ đích, thay vì bịa một id không tồn tại.
Việc supersede được ghi bằng văn, ở đây và tại chính RUL34 (Iron Law áp dụng khi chạm cờ rủi ro hoặc module năng-lực — không cần cả hai)/RUL37 (Iron Law hỏi ở đúng một ranh giới — trunk — cho mọi đề xuất nguồn runner tới đó).
```

### Full diff

```diff
No text difference.
```

## claim_85060cd9275d780186c1c7955e5c9b38

Source digest: c496763228fcdb86cf688d7f082a09a001756e2cb92ef03fef99831934360e7b

Target digest: c496763228fcdb86cf688d7f082a09a001756e2cb92ef03fef99831934360e7b

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-284",
  "sourceLines": [
    2762,
    2768
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0032 — Cổng Iron Law chỉ hỏi ở ranh giới trunk, thêm mức `warn`, agent gõ lệnh thay người",
    "Vì sao `supersedes:` trống"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-143",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0032 — Cổng Iron Law chỉ hỏi ở ranh giới trunk, thêm mức `warn`, agent gõ lệnh thay người",
    "Vì sao `supersedes:` trống"
  ],
  "nativeTargetClaimId": "claim_1fc9fcd1d254b78763433fea37736910",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "vì-sao-supersedes-trống",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_85060cd9275d780186c1c7955e5c9b38",
    "sourceUnitDigest": "c496763228fcdb86cf688d7f082a09a001756e2cb92ef03fef99831934360e7b",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-143",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-284 (lines 2762–2768) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-143. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "c496763228fcdb86cf688d7f082a09a001756e2cb92ef03fef99831934360e7b",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0032 — Cổng Iron Law chỉ hỏi ở ranh giới trunk, thêm mức `warn`, agent gõ lệnh thay người",
      "Vì sao `supersedes:` trống"
    ]
  }
}
```

### Full source unit

```text
` self-improve-loop` không phải record đánh số — chúng là quyết
định nội tuyến, trích dẫn trong `docs/specs/runner.md` (RUL34 (Iron Law áp dụng khi chạm cờ rủi ro hoặc module năng-lực — không cần cả hai), RUL37 (Iron Law hỏi ở đúng một ranh giới — trunk — cho mọi đề xuất nguồn runner tới đó),
Data Dictionary #10) và sống trong `view.decisions`. Không có file nào để
gắn `superseded_by:` trỏ ngược, nên khuôn trỏ-ngược-bắt-buộc STR72
(`scripts/check-decision-supersession.mjs`) không áp dụng được và
`supersedes:` để trống có chủ đích, thay vì bịa một id không tồn tại.
Việc supersede được ghi bằng văn, ở đây và tại chính RUL34 (Iron Law áp dụng khi chạm cờ rủi ro hoặc module năng-lực — không cần cả hai)/RUL37 (Iron Law hỏi ở đúng một ranh giới — trunk — cho mọi đề xuất nguồn runner tới đó).
```

### Full target unit

```text
` self-improve-loop` không phải record đánh số — chúng là quyết
định nội tuyến, trích dẫn trong `docs/specs/runner.md` (RUL34 (Iron Law áp dụng khi chạm cờ rủi ro hoặc module năng-lực — không cần cả hai), RUL37 (Iron Law hỏi ở đúng một ranh giới — trunk — cho mọi đề xuất nguồn runner tới đó),
Data Dictionary #10) và sống trong `view.decisions`. Không có file nào để
gắn `superseded_by:` trỏ ngược, nên khuôn trỏ-ngược-bắt-buộc STR72
(`scripts/check-decision-supersession.mjs`) không áp dụng được và
`supersedes:` để trống có chủ đích, thay vì bịa một id không tồn tại.
Việc supersede được ghi bằng văn, ở đây và tại chính RUL34 (Iron Law áp dụng khi chạm cờ rủi ro hoặc module năng-lực — không cần cả hai)/RUL37 (Iron Law hỏi ở đúng một ranh giới — trunk — cho mọi đề xuất nguồn runner tới đó).
```

### Full diff

```diff
No text difference.
```

## claim_48f4ffa8956be8bea3cda3d930af48ac

Source digest: 93cb01610d213afd09e43ef535222c463834632e403ebf4cd74a394dfdf9dcb6

Target digest: 93cb01610d213afd09e43ef535222c463834632e403ebf4cd74a394dfdf9dcb6

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "hệ-quả-10",
  "sourceLines": [
    2770,
    2770
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0032 — Cổng Iron Law chỉ hỏi ở ranh giới trunk, thêm mức `warn`, agent gõ lệnh thay người"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "hệ-quả-10",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0032 — Cổng Iron Law chỉ hỏi ở ranh giới trunk, thêm mức `warn`, agent gõ lệnh thay người"
  ],
  "nativeTargetClaimId": "claim_30172b42fc82311aa6dd11c5c39f0b0e",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; source unit shorter than 40 characters",
  "section": "hệ-quả-10",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_48f4ffa8956be8bea3cda3d930af48ac",
    "sourceUnitDigest": "93cb01610d213afd09e43ef535222c463834632e403ebf4cd74a394dfdf9dcb6",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "hệ-quả-10",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; source unit shorter than 40 characters. Whole heading docs/specs/runner.md#hệ-quả-10 (lines 2770–2770) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#hệ-quả-10. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "93cb01610d213afd09e43ef535222c463834632e403ebf4cd74a394dfdf9dcb6",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0032 — Cổng Iron Law chỉ hỏi ở ranh giới trunk, thêm mức `warn`, agent gõ lệnh thay người"
    ]
  }
}
```

### Full source unit

```text
#### Hệ quả

- `docs/specs/runner.md`: RUL34 (Iron Law áp dụng khi chạm cờ rủi ro hoặc module năng-lực — không cần cả hai) nói rõ phán quyết chỉ được TÍNH ở ranh giới
  trunk và hệ quả của `required: true` do `ironLaw.level` quyết định;
  RUL37 (Iron Law hỏi ở đúng một ranh giới — trunk — cho mọi đề xuất nguồn runner tới đó) viết lại theo bốn điểm trên; RUL64 (`ironLaw.level` — key config riêng của cổng Iron Law, fail-closed về `ask`) mới cho chính key
  `ironLaw.level` (mặc định, fail-closed, đăng ký vào `fgos doctor`).
- `.fgos/config.json` nhận `ironLaw.level` qua `fgos setup`/`fgos doctor
  --fix`; thiếu key thì `doctor` báo, gate vẫn chạy ở `ask`.
- `plugins/fgOS/skills/approve/SKILL.md` là bề mặt người dùng chạm vào cho
  điểm 3; `merge-loop`/`merge-next` cho điểm 4.
- Không đụng `src/evolve/iron-law.mjs` — phép phân loại không đổi, chỉ đổi
  chỗ nó được gọi và chuyện gì xảy ra sau đó.

Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

### Full target unit

```text
#### Hệ quả

- `docs/specs/runner.md`: RUL34 (Iron Law áp dụng khi chạm cờ rủi ro hoặc module năng-lực — không cần cả hai) nói rõ phán quyết chỉ được TÍNH ở ranh giới
  trunk và hệ quả của `required: true` do `ironLaw.level` quyết định;
  RUL37 (Iron Law hỏi ở đúng một ranh giới — trunk — cho mọi đề xuất nguồn runner tới đó) viết lại theo bốn điểm trên; RUL64 (`ironLaw.level` — key config riêng của cổng Iron Law, fail-closed về `ask`) mới cho chính key
  `ironLaw.level` (mặc định, fail-closed, đăng ký vào `fgos doctor`).
- `.fgos/config.json` nhận `ironLaw.level` qua `fgos setup`/`fgos doctor
  --fix`; thiếu key thì `doctor` báo, gate vẫn chạy ở `ask`.
- `plugins/fgOS/skills/approve/SKILL.md` là bề mặt người dùng chạm vào cho
  điểm 3; `merge-loop`/`merge-next` cho điểm 4.
- Không đụng `src/evolve/iron-law.mjs` — phép phân loại không đổi, chỉ đổi
  chỗ nó được gọi và chuyện gì xảy ra sau đó.

Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

### Full diff

```diff
No text difference.
```

## claim_3819de81bd71f836fc98fa1001d93cf0

Source digest: e23ede88252fff7a7cedfc07c1b0da8473b5b067bf8dd86cdc0a2505dcc1f038

Target digest: e23ede88252fff7a7cedfc07c1b0da8473b5b067bf8dd86cdc0a2505dcc1f038

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-285",
  "sourceLines": [
    2772,
    2781
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0032 — Cổng Iron Law chỉ hỏi ở ranh giới trunk, thêm mức `warn`, agent gõ lệnh thay người",
    "Hệ quả"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-144",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0032 — Cổng Iron Law chỉ hỏi ở ranh giới trunk, thêm mức `warn`, agent gõ lệnh thay người",
    "Hệ quả"
  ],
  "nativeTargetClaimId": "claim_45317ef2cc2901a52a8d90eb8d4ff874",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "hệ-quả-10",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_3819de81bd71f836fc98fa1001d93cf0",
    "sourceUnitDigest": "e23ede88252fff7a7cedfc07c1b0da8473b5b067bf8dd86cdc0a2505dcc1f038",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-144",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-285 (lines 2772–2781) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-144. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "e23ede88252fff7a7cedfc07c1b0da8473b5b067bf8dd86cdc0a2505dcc1f038",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0032 — Cổng Iron Law chỉ hỏi ở ranh giới trunk, thêm mức `warn`, agent gõ lệnh thay người",
      "Hệ quả"
    ]
  }
}
```

### Full source unit

```text
- `docs/specs/runner.md`: RUL34 (Iron Law áp dụng khi chạm cờ rủi ro hoặc module năng-lực — không cần cả hai) nói rõ phán quyết chỉ được TÍNH ở ranh giới
  trunk và hệ quả của `required: true` do `ironLaw.level` quyết định;
  RUL37 (Iron Law hỏi ở đúng một ranh giới — trunk — cho mọi đề xuất nguồn runner tới đó) viết lại theo bốn điểm trên; RUL64 (`ironLaw.level` — key config riêng của cổng Iron Law, fail-closed về `ask`) mới cho chính key
  `ironLaw.level` (mặc định, fail-closed, đăng ký vào `fgos doctor`).
- `.fgos/config.json` nhận `ironLaw.level` qua `fgos setup`/`fgos doctor
  --fix`; thiếu key thì `doctor` báo, gate vẫn chạy ở `ask`.
- `plugins/fgOS/skills/approve/SKILL.md` là bề mặt người dùng chạm vào cho
  điểm 3; `merge-loop`/`merge-next` cho điểm 4.
- Không đụng `src/evolve/iron-law.mjs` — phép phân loại không đổi, chỉ đổi
  chỗ nó được gọi và chuyện gì xảy ra sau đó.
```

### Full target unit

```text
- `docs/specs/runner.md`: RUL34 (Iron Law áp dụng khi chạm cờ rủi ro hoặc module năng-lực — không cần cả hai) nói rõ phán quyết chỉ được TÍNH ở ranh giới
  trunk và hệ quả của `required: true` do `ironLaw.level` quyết định;
  RUL37 (Iron Law hỏi ở đúng một ranh giới — trunk — cho mọi đề xuất nguồn runner tới đó) viết lại theo bốn điểm trên; RUL64 (`ironLaw.level` — key config riêng của cổng Iron Law, fail-closed về `ask`) mới cho chính key
  `ironLaw.level` (mặc định, fail-closed, đăng ký vào `fgos doctor`).
- `.fgos/config.json` nhận `ironLaw.level` qua `fgos setup`/`fgos doctor
  --fix`; thiếu key thì `doctor` báo, gate vẫn chạy ở `ask`.
- `plugins/fgOS/skills/approve/SKILL.md` là bề mặt người dùng chạm vào cho
  điểm 3; `merge-loop`/`merge-next` cho điểm 4.
- Không đụng `src/evolve/iron-law.mjs` — phép phân loại không đổi, chỉ đổi
  chỗ nó được gọi và chuyện gì xảy ra sau đó.
```

### Full diff

```diff
No text difference.
```

## claim_49d987137a47fb3d97c468550abee8dc

Source digest: 95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104

Target digest: 95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-286",
  "sourceLines": [
    2783,
    2783
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0032 — Cổng Iron Law chỉ hỏi ở ranh giới trunk, thêm mức `warn`, agent gõ lệnh thay người",
    "Hệ quả"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-9",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0005 — Runner & cô lập worker",
    "Hệ quả"
  ],
  "nativeTargetClaimId": "claim_892115f8efacf90f172fe53b82296354",
  "class": "Weak-exact",
  "classReason": "target digest repeats; ancestor headings differ",
  "section": "hệ-quả-10",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_49d987137a47fb3d97c468550abee8dc",
    "sourceUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-9",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: target digest repeats; ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-286 (lines 2783–2783) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-9. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0005 — Runner & cô lập worker",
      "Hệ quả"
    ]
  }
}
```

### Full source unit

```text
Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

### Full target unit

```text
Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

### Full diff

```diff
No text difference.
```

## claim_d06b2ce15133866437a691773e465006

Source digest: 5292300def034a62a06d6730a25aebc712c8ba45596415819b28aea1203b9eea

Target digest: 5292300def034a62a06d6730a25aebc712c8ba45596415819b28aea1203b9eea

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "tham-chiếu-3",
  "sourceLines": [
    2785,
    2785
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0032 — Cổng Iron Law chỉ hỏi ở ranh giới trunk, thêm mức `warn`, agent gõ lệnh thay người"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "tham-chiếu-3",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0032 — Cổng Iron Law chỉ hỏi ở ranh giới trunk, thêm mức `warn`, agent gõ lệnh thay người"
  ],
  "nativeTargetClaimId": "claim_9816cad9ffc9cd1d9fe2f734f34744be",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; source unit shorter than 40 characters",
  "section": "tham-chiếu-3",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_d06b2ce15133866437a691773e465006",
    "sourceUnitDigest": "5292300def034a62a06d6730a25aebc712c8ba45596415819b28aea1203b9eea",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "tham-chiếu-3",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; source unit shorter than 40 characters. Whole heading docs/specs/runner.md#tham-chiếu-3 (lines 2785–2785) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#tham-chiếu-3. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "5292300def034a62a06d6730a25aebc712c8ba45596415819b28aea1203b9eea",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0032 — Cổng Iron Law chỉ hỏi ở ranh giới trunk, thêm mức `warn`, agent gõ lệnh thay người"
    ]
  }
}
```

### Full source unit

```text
#### Tham chiếu

- `docs/history/iron-law-gate-human-ux/CONTEXT.md` — - đã khoá
- `docs/history/iron-law-gate-human-ux/plan.md` — A1/A1b, bản đồ rủi ro
- `docs/history/tsk-5t3-iron-law-evidence-contract/` — hợp đồng
  `docs/history/<id>/iron-law-evidence.md`
- `docs/explanation/iron-law-evidence-contract-stays-human-gated.md`
- `docs/explanation/gate-bypass-design.md`
- `0030` — `docs/decisions/0030-them-release-con-nguoi-vao-thu-tu-uu-tien-san-pham.md`
```

### Full target unit

```text
#### Tham chiếu

- `docs/history/iron-law-gate-human-ux/CONTEXT.md` — - đã khoá
- `docs/history/iron-law-gate-human-ux/plan.md` — A1/A1b, bản đồ rủi ro
- `docs/history/tsk-5t3-iron-law-evidence-contract/` — hợp đồng
  `docs/history/<id>/iron-law-evidence.md`
- `docs/explanation/iron-law-evidence-contract-stays-human-gated.md`
- `docs/explanation/gate-bypass-design.md`
- `0030` — `docs/decisions/0030-them-release-con-nguoi-vao-thu-tu-uu-tien-san-pham.md`
```

### Full diff

```diff
No text difference.
```

## claim_c566d2915315a14071f537397117652a

Source digest: 1786db6d9fdf0302154c872f1c75298668e2e3b891856a852f0c85177365f59a

Target digest: 1786db6d9fdf0302154c872f1c75298668e2e3b891856a852f0c85177365f59a

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-287",
  "sourceLines": [
    2787,
    2793
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0032 — Cổng Iron Law chỉ hỏi ở ranh giới trunk, thêm mức `warn`, agent gõ lệnh thay người",
    "Tham chiếu"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-146",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0032 — Cổng Iron Law chỉ hỏi ở ranh giới trunk, thêm mức `warn`, agent gõ lệnh thay người",
    "Tham chiếu"
  ],
  "nativeTargetClaimId": "claim_0fa47a5e4ce7db511bbd4cd03c169106",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "tham-chiếu-3",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_c566d2915315a14071f537397117652a",
    "sourceUnitDigest": "1786db6d9fdf0302154c872f1c75298668e2e3b891856a852f0c85177365f59a",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-146",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-287 (lines 2787–2793) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-146. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "1786db6d9fdf0302154c872f1c75298668e2e3b891856a852f0c85177365f59a",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0032 — Cổng Iron Law chỉ hỏi ở ranh giới trunk, thêm mức `warn`, agent gõ lệnh thay người",
      "Tham chiếu"
    ]
  }
}
```

### Full source unit

```text
- `docs/history/iron-law-gate-human-ux/CONTEXT.md` — - đã khoá
- `docs/history/iron-law-gate-human-ux/plan.md` — A1/A1b, bản đồ rủi ro
- `docs/history/tsk-5t3-iron-law-evidence-contract/` — hợp đồng
  `docs/history/<id>/iron-law-evidence.md`
- `docs/explanation/iron-law-evidence-contract-stays-human-gated.md`
- `docs/explanation/gate-bypass-design.md`
- `0030` — `docs/decisions/0030-them-release-con-nguoi-vao-thu-tu-uu-tien-san-pham.md`
```

### Full target unit

```text
- `docs/history/iron-law-gate-human-ux/CONTEXT.md` — - đã khoá
- `docs/history/iron-law-gate-human-ux/plan.md` — A1/A1b, bản đồ rủi ro
- `docs/history/tsk-5t3-iron-law-evidence-contract/` — hợp đồng
  `docs/history/<id>/iron-law-evidence.md`
- `docs/explanation/iron-law-evidence-contract-stays-human-gated.md`
- `docs/explanation/gate-bypass-design.md`
- `0030` — `docs/decisions/0030-them-release-con-nguoi-vao-thu-tu-uu-tien-san-pham.md`
```

### Full diff

```diff
No text difference.
```

## claim_6347e924083dea028ded2fda743ce159

Source digest: 870f0cda11251eb1ee8a3e50538b008cffb4f7b6e3c406b5216a9f297085ab6a

Target digest: 870f0cda11251eb1ee8a3e50538b008cffb4f7b6e3c406b5216a9f297085ab6a

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "0033-capacity-cli-spawn-shaped-thắng-haslivetaskaccess-thu-hẹp-0026-rule-2",
  "sourceLines": [
    2795,
    2795
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "0033-capacity-cli-spawn-shaped-thắng-haslivetaskaccess-thu-hẹp-0026-rule-2",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
  ],
  "nativeTargetClaimId": "claim_4bb2cb1f39186f9a965b57454ddab5cd",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "0033-capacity-cli-spawn-shaped-thắng-haslivetaskaccess-thu-hẹp-0026-rule-2",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_6347e924083dea028ded2fda743ce159",
    "sourceUnitDigest": "870f0cda11251eb1ee8a3e50538b008cffb4f7b6e3c406b5216a9f297085ab6a",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "0033-capacity-cli-spawn-shaped-thắng-haslivetaskaccess-thu-hẹp-0026-rule-2",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole heading docs/specs/runner.md#0033-capacity-cli-spawn-shaped-thắng-haslivetaskaccess-thu-hẹp-0026-rule-2 (lines 2795–2795) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#0033-capacity-cli-spawn-shaped-thắng-haslivetaskaccess-thu-hẹp-0026-rule-2. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "870f0cda11251eb1ee8a3e50538b008cffb4f7b6e3c406b5216a9f297085ab6a",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
    ]
  }
}
```

### Full source unit

```text
### 0033 — Capacity cli-spawn-shaped thắng hasLiveTaskAccess, thu hẹp 0026 rule 2
```

### Full target unit

```text
### 0033 — Capacity cli-spawn-shaped thắng hasLiveTaskAccess, thu hẹp 0026 rule 2
```

### Full diff

```diff
No text difference.
```

## claim_c1782e7b7f51dd2fa7de56e718cb2bff

Source digest: 92affba9ca672c1949df2d2497933025ca559c05df380d6b225ac301f4e214ee

Target digest: 92affba9ca672c1949df2d2497933025ca559c05df380d6b225ac301f4e214ee

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "quyết-định-11",
  "sourceLines": [
    2797,
    2797
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0033 — Capacity cli-spawn-shaped thắng hasLiveTaskAccess, thu hẹp 0026 rule 2"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "quyết-định-11",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0033 — Capacity cli-spawn-shaped thắng hasLiveTaskAccess, thu hẹp 0026 rule 2"
  ],
  "nativeTargetClaimId": "claim_22ffdd2cd4750b73aaf4c2dc075999b7",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; source unit shorter than 40 characters",
  "section": "quyết-định-11",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_c1782e7b7f51dd2fa7de56e718cb2bff",
    "sourceUnitDigest": "92affba9ca672c1949df2d2497933025ca559c05df380d6b225ac301f4e214ee",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "quyết-định-11",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; source unit shorter than 40 characters. Whole heading docs/specs/runner.md#quyết-định-11 (lines 2797–2797) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#quyết-định-11. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "92affba9ca672c1949df2d2497933025ca559c05df380d6b225ac301f4e214ee",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0033 — Capacity cli-spawn-shaped thắng hasLiveTaskAccess, thu hẹp 0026 rule 2"
    ]
  }
}
```

### Full source unit

```text
#### Quyết định

Một capacity `kind:agent` **cli-spawn-shaped** — declares `command`/
`adapter` của riêng nó, hoặc một entry `invocations[].via === "cli"` —
LUÔN dispatch out-of-process khi đã được cấu hình cho job đó, bất kể
caller có `hasLiveTaskAccess:true` hay không. `0026` rule 2 (ưu tiên
native khi caller cùng provider và có Task tool sống) vẫn đúng nguyên vẹn
cho capacity **agentType-shaped** (chỉ có `agentType`, không `command`
riêng — ví dụ `judge-discovery`) — quyết định này KHÔNG đảo `0026`, chỉ
thu hẹp phạm vi rule 2 xuống đúng nửa case còn hợp lý.
```

### Full target unit

```text
#### Quyết định

Một capacity `kind:agent` **cli-spawn-shaped** — declares `command`/
`adapter` của riêng nó, hoặc một entry `invocations[].via === "cli"` —
LUÔN dispatch out-of-process khi đã được cấu hình cho job đó, bất kể
caller có `hasLiveTaskAccess:true` hay không. `0026` rule 2 (ưu tiên
native khi caller cùng provider và có Task tool sống) vẫn đúng nguyên vẹn
cho capacity **agentType-shaped** (chỉ có `agentType`, không `command`
riêng — ví dụ `judge-discovery`) — quyết định này KHÔNG đảo `0026`, chỉ
thu hẹp phạm vi rule 2 xuống đúng nửa case còn hợp lý.
```

### Full diff

```diff
No text difference.
```

## claim_ea01435fbfce2b1e73381c5d9a7c6066

Source digest: 30d437082142efd2345a238a8d666ca78bdc1a5339cb3aa769cc46d4fac9855d

Target digest: 30d437082142efd2345a238a8d666ca78bdc1a5339cb3aa769cc46d4fac9855d

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-288",
  "sourceLines": [
    2799,
    2806
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0033 — Capacity cli-spawn-shaped thắng hasLiveTaskAccess, thu hẹp 0026 rule 2",
    "Quyết định"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-147",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0033 — Capacity cli-spawn-shaped thắng hasLiveTaskAccess, thu hẹp 0026 rule 2",
    "Quyết định"
  ],
  "nativeTargetClaimId": "claim_cbf5455929d052e26406197f5efac39f",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "quyết-định-11",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_ea01435fbfce2b1e73381c5d9a7c6066",
    "sourceUnitDigest": "30d437082142efd2345a238a8d666ca78bdc1a5339cb3aa769cc46d4fac9855d",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-147",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-288 (lines 2799–2806) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-147. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "30d437082142efd2345a238a8d666ca78bdc1a5339cb3aa769cc46d4fac9855d",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0033 — Capacity cli-spawn-shaped thắng hasLiveTaskAccess, thu hẹp 0026 rule 2",
      "Quyết định"
    ]
  }
}
```

### Full source unit

```text
Một capacity `kind:agent` **cli-spawn-shaped** — declares `command`/
`adapter` của riêng nó, hoặc một entry `invocations[].via === "cli"` —
LUÔN dispatch out-of-process khi đã được cấu hình cho job đó, bất kể
caller có `hasLiveTaskAccess:true` hay không. `0026` rule 2 (ưu tiên
native khi caller cùng provider và có Task tool sống) vẫn đúng nguyên vẹn
cho capacity **agentType-shaped** (chỉ có `agentType`, không `command`
riêng — ví dụ `judge-discovery`) — quyết định này KHÔNG đảo `0026`, chỉ
thu hẹp phạm vi rule 2 xuống đúng nửa case còn hợp lý.
```

### Full target unit

```text
Một capacity `kind:agent` **cli-spawn-shaped** — declares `command`/
`adapter` của riêng nó, hoặc một entry `invocations[].via === "cli"` —
LUÔN dispatch out-of-process khi đã được cấu hình cho job đó, bất kể
caller có `hasLiveTaskAccess:true` hay không. `0026` rule 2 (ưu tiên
native khi caller cùng provider và có Task tool sống) vẫn đúng nguyên vẹn
cho capacity **agentType-shaped** (chỉ có `agentType`, không `command`
riêng — ví dụ `judge-discovery`) — quyết định này KHÔNG đảo `0026`, chỉ
thu hẹp phạm vi rule 2 xuống đúng nửa case còn hợp lý.
```

### Full diff

```diff
No text difference.
```

## claim_68e9ce61dbff7a530b70a2ccf6531a45

Source digest: 99e69377f8cb77fffdb4d0dd03bf62e409dbbda997a1f43fd988af8463577e0f

Target digest: 99e69377f8cb77fffdb4d0dd03bf62e409dbbda997a1f43fd988af8463577e0f

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "người-quyết",
  "sourceLines": [
    2808,
    2808
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0033 — Capacity cli-spawn-shaped thắng hasLiveTaskAccess, thu hẹp 0026 rule 2"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "người-quyết",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0033 — Capacity cli-spawn-shaped thắng hasLiveTaskAccess, thu hẹp 0026 rule 2"
  ],
  "nativeTargetClaimId": "claim_754f4b400d0d5e2c10d09d053168ed88",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; source unit shorter than 40 characters",
  "section": "người-quyết",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_68e9ce61dbff7a530b70a2ccf6531a45",
    "sourceUnitDigest": "99e69377f8cb77fffdb4d0dd03bf62e409dbbda997a1f43fd988af8463577e0f",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "người-quyết",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; source unit shorter than 40 characters. Whole heading docs/specs/runner.md#người-quyết (lines 2808–2808) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#người-quyết. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "99e69377f8cb77fffdb4d0dd03bf62e409dbbda997a1f43fd988af8463577e0f",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0033 — Capacity cli-spawn-shaped thắng hasLiveTaskAccess, thu hẹp 0026 rule 2"
    ]
  }
}
```

### Full source unit

```text
#### Người quyết

Người dùng, trực tiếp, trong phiên làm việc 2026-08-16 (sau khi test
sống capacity `fgos-coding-implement` → `agy`, thấy một session sống vẫn
resolve `in-process` — tức KHÔNG bao giờ thật sự gọi `agy` — dù capacity
đã cấu hình rõ ràng). Nguyên văn ý định: "một soul sống sẽ chọn soul khác
phù hợp để làm việc thay nó" — tức cấu hình phải thắng, không phải mặc
định "tự làm" chỉ vì có Task tool.
```

### Full target unit

```text
#### Người quyết

Người dùng, trực tiếp, trong phiên làm việc 2026-08-16 (sau khi test
sống capacity `fgos-coding-implement` → `agy`, thấy một session sống vẫn
resolve `in-process` — tức KHÔNG bao giờ thật sự gọi `agy` — dù capacity
đã cấu hình rõ ràng). Nguyên văn ý định: "một soul sống sẽ chọn soul khác
phù hợp để làm việc thay nó" — tức cấu hình phải thắng, không phải mặc
định "tự làm" chỉ vì có Task tool.
```

### Full diff

```diff
No text difference.
```

## claim_da653bb7293a682b05f3dcc0a1b3753b

Source digest: 030ac6b108d34c7b0b43061d2305907e88f72178e579b735916dd37f5fd7b2a2

Target digest: 030ac6b108d34c7b0b43061d2305907e88f72178e579b735916dd37f5fd7b2a2

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-289",
  "sourceLines": [
    2810,
    2815
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0033 — Capacity cli-spawn-shaped thắng hasLiveTaskAccess, thu hẹp 0026 rule 2",
    "Người quyết"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-148",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0033 — Capacity cli-spawn-shaped thắng hasLiveTaskAccess, thu hẹp 0026 rule 2",
    "Người quyết"
  ],
  "nativeTargetClaimId": "claim_85244792ccb2d23eacef04486d0eabe8",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "người-quyết",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_da653bb7293a682b05f3dcc0a1b3753b",
    "sourceUnitDigest": "030ac6b108d34c7b0b43061d2305907e88f72178e579b735916dd37f5fd7b2a2",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-148",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-289 (lines 2810–2815) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-148. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "030ac6b108d34c7b0b43061d2305907e88f72178e579b735916dd37f5fd7b2a2",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0033 — Capacity cli-spawn-shaped thắng hasLiveTaskAccess, thu hẹp 0026 rule 2",
      "Người quyết"
    ]
  }
}
```

### Full source unit

```text
Người dùng, trực tiếp, trong phiên làm việc 2026-08-16 (sau khi test
sống capacity `fgos-coding-implement` → `agy`, thấy một session sống vẫn
resolve `in-process` — tức KHÔNG bao giờ thật sự gọi `agy` — dù capacity
đã cấu hình rõ ràng). Nguyên văn ý định: "một soul sống sẽ chọn soul khác
phù hợp để làm việc thay nó" — tức cấu hình phải thắng, không phải mặc
định "tự làm" chỉ vì có Task tool.
```

### Full target unit

```text
Người dùng, trực tiếp, trong phiên làm việc 2026-08-16 (sau khi test
sống capacity `fgos-coding-implement` → `agy`, thấy một session sống vẫn
resolve `in-process` — tức KHÔNG bao giờ thật sự gọi `agy` — dù capacity
đã cấu hình rõ ràng). Nguyên văn ý định: "một soul sống sẽ chọn soul khác
phù hợp để làm việc thay nó" — tức cấu hình phải thắng, không phải mặc
định "tự làm" chỉ vì có Task tool.
```

### Full diff

```diff
No text difference.
```

## claim_42f9bfce702ea73a320ebcbe6cd80249

Source digest: b7aba936a64f091810574771c9d240bca4572e4156645068cd6091066de02482

Target digest: b7aba936a64f091810574771c9d240bca4572e4156645068cd6091066de02482

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "lý-do-0026-rule-2-không-áp-dụng-ở-đây",
  "sourceLines": [
    2817,
    2817
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0033 — Capacity cli-spawn-shaped thắng hasLiveTaskAccess, thu hẹp 0026 rule 2"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "lý-do-0026-rule-2-không-áp-dụng-ở-đây",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0033 — Capacity cli-spawn-shaped thắng hasLiveTaskAccess, thu hẹp 0026 rule 2"
  ],
  "nativeTargetClaimId": "claim_9314fb6dbf17b68d1b8a259e07ee52b3",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "lý-do-0026-rule-2-không-áp-dụng-ở-đây",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_42f9bfce702ea73a320ebcbe6cd80249",
    "sourceUnitDigest": "b7aba936a64f091810574771c9d240bca4572e4156645068cd6091066de02482",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "lý-do-0026-rule-2-không-áp-dụng-ở-đây",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole heading docs/specs/runner.md#lý-do-0026-rule-2-không-áp-dụng-ở-đây (lines 2817–2817) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#lý-do-0026-rule-2-không-áp-dụng-ở-đây. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "b7aba936a64f091810574771c9d240bca4572e4156645068cd6091066de02482",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0033 — Capacity cli-spawn-shaped thắng hasLiveTaskAccess, thu hẹp 0026 rule 2"
    ]
  }
}
```

### Full source unit

```text
#### Lý do 0026 rule 2 không áp dụng ở đây

Rule 2 tự nêu lý do của chính nó (trích 0026): *"tránh lãng phí/sai lệch
khi soul mù re-derive 1 phán đoán soul sống đã làm rồi"* — bug thật
`tsk-1ni` (`judgeDiscovery` cli-spawn một judge mù dù caller đã tự đọc
CONTEXT.md xong). Lý do này đúng khi target là MỘT PHIÊN BẢN KHÁC CỦA
CHÍNH CALLER (native subagent, cùng provider, không có command riêng) —
không đúng khi target là một BACKEND THẬT SỰ KHÁC đã được người vận hành
đặt tên rõ ràng (`command: "agy"`). "In-process" trong case cli-spawn-
shaped không phải "dùng native thay vì spawn mù" — nó là "âm thầm bỏ qua
hoàn toàn config, tự làm thay". Đó không phải tối ưu hoá native-first,
đó là bỏ qua một quyết định cấu hình.
```

### Full target unit

```text
#### Lý do 0026 rule 2 không áp dụng ở đây

Rule 2 tự nêu lý do của chính nó (trích 0026): *"tránh lãng phí/sai lệch
khi soul mù re-derive 1 phán đoán soul sống đã làm rồi"* — bug thật
`tsk-1ni` (`judgeDiscovery` cli-spawn một judge mù dù caller đã tự đọc
CONTEXT.md xong). Lý do này đúng khi target là MỘT PHIÊN BẢN KHÁC CỦA
CHÍNH CALLER (native subagent, cùng provider, không có command riêng) —
không đúng khi target là một BACKEND THẬT SỰ KHÁC đã được người vận hành
đặt tên rõ ràng (`command: "agy"`). "In-process" trong case cli-spawn-
shaped không phải "dùng native thay vì spawn mù" — nó là "âm thầm bỏ qua
hoàn toàn config, tự làm thay". Đó không phải tối ưu hoá native-first,
đó là bỏ qua một quyết định cấu hình.
```

### Full diff

```diff
No text difference.
```

## claim_90ca441a35296b4601a31f2cf224e3b3

Source digest: 9354b91240b525374c7bed31510652224351ee5b36ecb9af0526f21bc9174d60

Target digest: 9354b91240b525374c7bed31510652224351ee5b36ecb9af0526f21bc9174d60

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-290",
  "sourceLines": [
    2819,
    2828
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0033 — Capacity cli-spawn-shaped thắng hasLiveTaskAccess, thu hẹp 0026 rule 2",
    "Lý do 0026 rule 2 không áp dụng ở đây"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-149",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0033 — Capacity cli-spawn-shaped thắng hasLiveTaskAccess, thu hẹp 0026 rule 2",
    "Lý do 0026 rule 2 không áp dụng ở đây"
  ],
  "nativeTargetClaimId": "claim_0309eb3717972fa244cf4c131d6c776e",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "lý-do-0026-rule-2-không-áp-dụng-ở-đây",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_90ca441a35296b4601a31f2cf224e3b3",
    "sourceUnitDigest": "9354b91240b525374c7bed31510652224351ee5b36ecb9af0526f21bc9174d60",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-149",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-290 (lines 2819–2828) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-149. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "9354b91240b525374c7bed31510652224351ee5b36ecb9af0526f21bc9174d60",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0033 — Capacity cli-spawn-shaped thắng hasLiveTaskAccess, thu hẹp 0026 rule 2",
      "Lý do 0026 rule 2 không áp dụng ở đây"
    ]
  }
}
```

### Full source unit

```text
Rule 2 tự nêu lý do của chính nó (trích 0026): *"tránh lãng phí/sai lệch
khi soul mù re-derive 1 phán đoán soul sống đã làm rồi"* — bug thật
`tsk-1ni` (`judgeDiscovery` cli-spawn một judge mù dù caller đã tự đọc
CONTEXT.md xong). Lý do này đúng khi target là MỘT PHIÊN BẢN KHÁC CỦA
CHÍNH CALLER (native subagent, cùng provider, không có command riêng) —
không đúng khi target là một BACKEND THẬT SỰ KHÁC đã được người vận hành
đặt tên rõ ràng (`command: "agy"`). "In-process" trong case cli-spawn-
shaped không phải "dùng native thay vì spawn mù" — nó là "âm thầm bỏ qua
hoàn toàn config, tự làm thay". Đó không phải tối ưu hoá native-first,
đó là bỏ qua một quyết định cấu hình.
```

### Full target unit

```text
Rule 2 tự nêu lý do của chính nó (trích 0026): *"tránh lãng phí/sai lệch
khi soul mù re-derive 1 phán đoán soul sống đã làm rồi"* — bug thật
`tsk-1ni` (`judgeDiscovery` cli-spawn một judge mù dù caller đã tự đọc
CONTEXT.md xong). Lý do này đúng khi target là MỘT PHIÊN BẢN KHÁC CỦA
CHÍNH CALLER (native subagent, cùng provider, không có command riêng) —
không đúng khi target là một BACKEND THẬT SỰ KHÁC đã được người vận hành
đặt tên rõ ràng (`command: "agy"`). "In-process" trong case cli-spawn-
shaped không phải "dùng native thay vì spawn mù" — nó là "âm thầm bỏ qua
hoàn toàn config, tự làm thay". Đó không phải tối ưu hoá native-first,
đó là bỏ qua một quyết định cấu hình.
```

### Full diff

```diff
No text difference.
```

## claim_b9b783d16e302d9058489856e6cde481

Source digest: d248d7c3ed3bab201338d35554aed966136f261e32da3c1e0fc366b38ec4532e

Target digest: d248d7c3ed3bab201338d35554aed966136f261e32da3c1e0fc366b38ec4532e

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "cơ-chế-phân-biệt-không-phải-heuristic-mới",
  "sourceLines": [
    2830,
    2830
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0033 — Capacity cli-spawn-shaped thắng hasLiveTaskAccess, thu hẹp 0026 rule 2"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "cơ-chế-phân-biệt-không-phải-heuristic-mới",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0033 — Capacity cli-spawn-shaped thắng hasLiveTaskAccess, thu hẹp 0026 rule 2"
  ],
  "nativeTargetClaimId": "claim_c49ba5be18e12c97f432e0a784eecce0",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "cơ-chế-phân-biệt-không-phải-heuristic-mới",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_b9b783d16e302d9058489856e6cde481",
    "sourceUnitDigest": "d248d7c3ed3bab201338d35554aed966136f261e32da3c1e0fc366b38ec4532e",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "cơ-chế-phân-biệt-không-phải-heuristic-mới",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole heading docs/specs/runner.md#cơ-chế-phân-biệt-không-phải-heuristic-mới (lines 2830–2830) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#cơ-chế-phân-biệt-không-phải-heuristic-mới. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "d248d7c3ed3bab201338d35554aed966136f261e32da3c1e0fc366b38ec4532e",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0033 — Capacity cli-spawn-shaped thắng hasLiveTaskAccess, thu hẹp 0026 rule 2"
    ]
  }
}
```

### Full source unit

````text
#### Cơ chế phân biệt (không phải heuristic mới)

`resolveExecutorConfig` (`src/runner/dispatch.mjs`) đã sẵn có đúng phép
thử này cho `resolvedViaAgentType`/`cliInvocation` — 2 hình dạng loại
trừ lẫn nhau. `decideCapacityDispatchMechanism` giờ dùng lại đúng phép
thử đó trước khi hỏi `hasLiveTaskAccess`:

```js
const isCliSpawnShaped = Boolean(
  capacity && (capacity.command || capacity.adapter ||
    (Array.isArray(capacity.invocations) && capacity.invocations.some((inv) => inv.via === 'cli'))),
);
if (isCliSpawnShaped) return 'out-of-process';
// agentType-shaped, kind:'tool', hoặc chưa cấu hình -- giữ nguyên logic cũ
```
````

### Full target unit

````text
#### Cơ chế phân biệt (không phải heuristic mới)

`resolveExecutorConfig` (`src/runner/dispatch.mjs`) đã sẵn có đúng phép
thử này cho `resolvedViaAgentType`/`cliInvocation` — 2 hình dạng loại
trừ lẫn nhau. `decideCapacityDispatchMechanism` giờ dùng lại đúng phép
thử đó trước khi hỏi `hasLiveTaskAccess`:

```js
const isCliSpawnShaped = Boolean(
  capacity && (capacity.command || capacity.adapter ||
    (Array.isArray(capacity.invocations) && capacity.invocations.some((inv) => inv.via === 'cli'))),
);
if (isCliSpawnShaped) return 'out-of-process';
// agentType-shaped, kind:'tool', hoặc chưa cấu hình -- giữ nguyên logic cũ
```
````

### Full diff

```diff
No text difference.
```

## claim_d6be3a263e08b4c045ee002b60f4ede5

Source digest: d4c7a08966cb527f5c7df3dc96276e8dc911a4a1203caedb87a850dd883c7d6a

Target digest: d4c7a08966cb527f5c7df3dc96276e8dc911a4a1203caedb87a850dd883c7d6a

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-291",
  "sourceLines": [
    2832,
    2835
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0033 — Capacity cli-spawn-shaped thắng hasLiveTaskAccess, thu hẹp 0026 rule 2",
    "Cơ chế phân biệt (không phải heuristic mới)"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-150",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0033 — Capacity cli-spawn-shaped thắng hasLiveTaskAccess, thu hẹp 0026 rule 2",
    "Cơ chế phân biệt (không phải heuristic mới)"
  ],
  "nativeTargetClaimId": "claim_d3f9af458b9997c2d35b954ddc1b1fa6",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "cơ-chế-phân-biệt-không-phải-heuristic-mới",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_d6be3a263e08b4c045ee002b60f4ede5",
    "sourceUnitDigest": "d4c7a08966cb527f5c7df3dc96276e8dc911a4a1203caedb87a850dd883c7d6a",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-150",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-291 (lines 2832–2835) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-150. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "d4c7a08966cb527f5c7df3dc96276e8dc911a4a1203caedb87a850dd883c7d6a",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0033 — Capacity cli-spawn-shaped thắng hasLiveTaskAccess, thu hẹp 0026 rule 2",
      "Cơ chế phân biệt (không phải heuristic mới)"
    ]
  }
}
```

### Full source unit

```text
`resolveExecutorConfig` (`src/runner/dispatch.mjs`) đã sẵn có đúng phép
thử này cho `resolvedViaAgentType`/`cliInvocation` — 2 hình dạng loại
trừ lẫn nhau. `decideCapacityDispatchMechanism` giờ dùng lại đúng phép
thử đó trước khi hỏi `hasLiveTaskAccess`:
```

### Full target unit

```text
`resolveExecutorConfig` (`src/runner/dispatch.mjs`) đã sẵn có đúng phép
thử này cho `resolvedViaAgentType`/`cliInvocation` — 2 hình dạng loại
trừ lẫn nhau. `decideCapacityDispatchMechanism` giờ dùng lại đúng phép
thử đó trước khi hỏi `hasLiveTaskAccess`:
```

### Full diff

```diff
No text difference.
```

## claim_b45337089f8c74230dd66cd48ffe7825

Source digest: d38161ac9f31ab259936166ceb80b78f926783c1617715afff9bb3359345d8be

Target digest: d38161ac9f31ab259936166ceb80b78f926783c1617715afff9bb3359345d8be

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-292",
  "sourceLines": [
    2837,
    2844
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0033 — Capacity cli-spawn-shaped thắng hasLiveTaskAccess, thu hẹp 0026 rule 2",
    "Cơ chế phân biệt (không phải heuristic mới)"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-151",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0033 — Capacity cli-spawn-shaped thắng hasLiveTaskAccess, thu hẹp 0026 rule 2",
    "Cơ chế phân biệt (không phải heuristic mới)"
  ],
  "nativeTargetClaimId": "claim_8378a57424f6d29159e503de81a504ab",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "cơ-chế-phân-biệt-không-phải-heuristic-mới",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_b45337089f8c74230dd66cd48ffe7825",
    "sourceUnitDigest": "d38161ac9f31ab259936166ceb80b78f926783c1617715afff9bb3359345d8be",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-151",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-292 (lines 2837–2844) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-151. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "d38161ac9f31ab259936166ceb80b78f926783c1617715afff9bb3359345d8be",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0033 — Capacity cli-spawn-shaped thắng hasLiveTaskAccess, thu hẹp 0026 rule 2",
      "Cơ chế phân biệt (không phải heuristic mới)"
    ]
  }
}
```

### Full source unit

````text
```js
const isCliSpawnShaped = Boolean(
  capacity && (capacity.command || capacity.adapter ||
    (Array.isArray(capacity.invocations) && capacity.invocations.some((inv) => inv.via === 'cli'))),
);
if (isCliSpawnShaped) return 'out-of-process';
// agentType-shaped, kind:'tool', hoặc chưa cấu hình -- giữ nguyên logic cũ
```
````

### Full target unit

````text
```js
const isCliSpawnShaped = Boolean(
  capacity && (capacity.command || capacity.adapter ||
    (Array.isArray(capacity.invocations) && capacity.invocations.some((inv) => inv.via === 'cli'))),
);
if (isCliSpawnShaped) return 'out-of-process';
// agentType-shaped, kind:'tool', hoặc chưa cấu hình -- giữ nguyên logic cũ
```
````

### Full diff

```diff
No text difference.
```

## claim_f63e378b765126fb5426a7286a0a46c9

Source digest: d57167acd4b6dac5fe237e41eba7b61e6dcda1ea2e8c99e7049040ab37795c9b

Target digest: d57167acd4b6dac5fe237e41eba7b61e6dcda1ea2e8c99e7049040ab37795c9b

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "bằng-chứng-đã-kiểm",
  "sourceLines": [
    2846,
    2846
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0033 — Capacity cli-spawn-shaped thắng hasLiveTaskAccess, thu hẹp 0026 rule 2"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "bằng-chứng-đã-kiểm",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0033 — Capacity cli-spawn-shaped thắng hasLiveTaskAccess, thu hẹp 0026 rule 2"
  ],
  "nativeTargetClaimId": "claim_bdea192a483963fe75e7a6e1acc7fa50",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; source unit shorter than 40 characters",
  "section": "bằng-chứng-đã-kiểm",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_f63e378b765126fb5426a7286a0a46c9",
    "sourceUnitDigest": "d57167acd4b6dac5fe237e41eba7b61e6dcda1ea2e8c99e7049040ab37795c9b",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "bằng-chứng-đã-kiểm",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; source unit shorter than 40 characters. Whole heading docs/specs/runner.md#bằng-chứng-đã-kiểm (lines 2846–2846) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#bằng-chứng-đã-kiểm. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "d57167acd4b6dac5fe237e41eba7b61e6dcda1ea2e8c99e7049040ab37795c9b",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0033 — Capacity cli-spawn-shaped thắng hasLiveTaskAccess, thu hẹp 0026 rule 2"
    ]
  }
}
```

### Full source unit

````text
#### Bằng chứng đã kiểm

- `tsk-1m8` (item trước, 2026-08-16): live-proved cơ chế cli-spawn ra
  `agy` hoạt động thật (real spawn, real output) khi capacity được cấu
  hình — nhưng chỉ test qua `hasLiveTaskAccess:false` (headless). Session
  sống thật sự hỏi `decide --work` với `hasLiveTaskAccess:true` vẫn nhận
  `in-process` — đây chính là gap `0033` sửa.
- Quét toàn bộ 28 chỗ `hasLiveTaskAccess: true` trong
  `test/runner/dispatch.test.mjs` (`docs/history/tsk-pdg/RESEARCH.md`):
  không có test nào dùng capacity cli-spawn-shaped + `hasLiveTaskAccess:
  true` mong đợi `in-process` — 0 test hiện có bị gãy, xác nhận thật sau
  khi sửa (`npm test`: 3459 pass / 0 fail).
- Xác nhận sống trên config thật của chính repo này (`.fgos/config.json`,
  capacity `fgos-coding-implement` → `agy`):
  ```
  trước 0033: decide('fgos-coding-implement', {hasLiveTaskAccess:true}) -> {"mechanism":"in-process"}
  sau  0033: decide('fgos-coding-implement', {hasLiveTaskAccess:true}) -> {"mechanism":"out-of-process","configured":true}
  ```
````

### Full target unit

````text
#### Bằng chứng đã kiểm

- `tsk-1m8` (item trước, 2026-08-16): live-proved cơ chế cli-spawn ra
  `agy` hoạt động thật (real spawn, real output) khi capacity được cấu
  hình — nhưng chỉ test qua `hasLiveTaskAccess:false` (headless). Session
  sống thật sự hỏi `decide --work` với `hasLiveTaskAccess:true` vẫn nhận
  `in-process` — đây chính là gap `0033` sửa.
- Quét toàn bộ 28 chỗ `hasLiveTaskAccess: true` trong
  `test/runner/dispatch.test.mjs` (`docs/history/tsk-pdg/RESEARCH.md`):
  không có test nào dùng capacity cli-spawn-shaped + `hasLiveTaskAccess:
  true` mong đợi `in-process` — 0 test hiện có bị gãy, xác nhận thật sau
  khi sửa (`npm test`: 3459 pass / 0 fail).
- Xác nhận sống trên config thật của chính repo này (`.fgos/config.json`,
  capacity `fgos-coding-implement` → `agy`):
  ```
  trước 0033: decide('fgos-coding-implement', {hasLiveTaskAccess:true}) -> {"mechanism":"in-process"}
  sau  0033: decide('fgos-coding-implement', {hasLiveTaskAccess:true}) -> {"mechanism":"out-of-process","configured":true}
  ```
````

### Full diff

```diff
No text difference.
```

## claim_6ab28f921687d640ffb6ca17a5624261

Source digest: 77c1da7d08539f70c1a6d360d5fc8ff4b7f99dafc348e06b97eeca5de5be072b

Target digest: 77c1da7d08539f70c1a6d360d5fc8ff4b7f99dafc348e06b97eeca5de5be072b

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-293",
  "sourceLines": [
    2848,
    2863
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0033 — Capacity cli-spawn-shaped thắng hasLiveTaskAccess, thu hẹp 0026 rule 2",
    "Bằng chứng đã kiểm"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-152",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0033 — Capacity cli-spawn-shaped thắng hasLiveTaskAccess, thu hẹp 0026 rule 2",
    "Bằng chứng đã kiểm"
  ],
  "nativeTargetClaimId": "claim_431b446e790070ba90a3ae773468b8e9",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "bằng-chứng-đã-kiểm",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_6ab28f921687d640ffb6ca17a5624261",
    "sourceUnitDigest": "77c1da7d08539f70c1a6d360d5fc8ff4b7f99dafc348e06b97eeca5de5be072b",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-152",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-293 (lines 2848–2863) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-152. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "77c1da7d08539f70c1a6d360d5fc8ff4b7f99dafc348e06b97eeca5de5be072b",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0033 — Capacity cli-spawn-shaped thắng hasLiveTaskAccess, thu hẹp 0026 rule 2",
      "Bằng chứng đã kiểm"
    ]
  }
}
```

### Full source unit

````text
- `tsk-1m8` (item trước, 2026-08-16): live-proved cơ chế cli-spawn ra
  `agy` hoạt động thật (real spawn, real output) khi capacity được cấu
  hình — nhưng chỉ test qua `hasLiveTaskAccess:false` (headless). Session
  sống thật sự hỏi `decide --work` với `hasLiveTaskAccess:true` vẫn nhận
  `in-process` — đây chính là gap `0033` sửa.
- Quét toàn bộ 28 chỗ `hasLiveTaskAccess: true` trong
  `test/runner/dispatch.test.mjs` (`docs/history/tsk-pdg/RESEARCH.md`):
  không có test nào dùng capacity cli-spawn-shaped + `hasLiveTaskAccess:
  true` mong đợi `in-process` — 0 test hiện có bị gãy, xác nhận thật sau
  khi sửa (`npm test`: 3459 pass / 0 fail).
- Xác nhận sống trên config thật của chính repo này (`.fgos/config.json`,
  capacity `fgos-coding-implement` → `agy`):
  ```
  trước 0033: decide('fgos-coding-implement', {hasLiveTaskAccess:true}) -> {"mechanism":"in-process"}
  sau  0033: decide('fgos-coding-implement', {hasLiveTaskAccess:true}) -> {"mechanism":"out-of-process","configured":true}
  ```
````

### Full target unit

````text
- `tsk-1m8` (item trước, 2026-08-16): live-proved cơ chế cli-spawn ra
  `agy` hoạt động thật (real spawn, real output) khi capacity được cấu
  hình — nhưng chỉ test qua `hasLiveTaskAccess:false` (headless). Session
  sống thật sự hỏi `decide --work` với `hasLiveTaskAccess:true` vẫn nhận
  `in-process` — đây chính là gap `0033` sửa.
- Quét toàn bộ 28 chỗ `hasLiveTaskAccess: true` trong
  `test/runner/dispatch.test.mjs` (`docs/history/tsk-pdg/RESEARCH.md`):
  không có test nào dùng capacity cli-spawn-shaped + `hasLiveTaskAccess:
  true` mong đợi `in-process` — 0 test hiện có bị gãy, xác nhận thật sau
  khi sửa (`npm test`: 3459 pass / 0 fail).
- Xác nhận sống trên config thật của chính repo này (`.fgos/config.json`,
  capacity `fgos-coding-implement` → `agy`):
  ```
  trước 0033: decide('fgos-coding-implement', {hasLiveTaskAccess:true}) -> {"mechanism":"in-process"}
  sau  0033: decide('fgos-coding-implement', {hasLiveTaskAccess:true}) -> {"mechanism":"out-of-process","configured":true}
  ```
````

### Full diff

```diff
No text difference.
```

## claim_b41ad20350f43a6ae7e49e01615baf5a

Source digest: 3ca5ca86cbe88cbd6cdb04778c8c5e2b286ddcb3a3c84997a5651e3a06b245c3

Target digest: 3ca5ca86cbe88cbd6cdb04778c8c5e2b286ddcb3a3c84997a5651e3a06b245c3

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "việc-chưa-quyết-để-lại",
  "sourceLines": [
    2865,
    2865
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0033 — Capacity cli-spawn-shaped thắng hasLiveTaskAccess, thu hẹp 0026 rule 2"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "việc-chưa-quyết-để-lại",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0033 — Capacity cli-spawn-shaped thắng hasLiveTaskAccess, thu hẹp 0026 rule 2"
  ],
  "nativeTargetClaimId": "claim_d451ed14efcea7d1b77166f89e5b0563",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; source unit shorter than 40 characters",
  "section": "việc-chưa-quyết-để-lại",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_b41ad20350f43a6ae7e49e01615baf5a",
    "sourceUnitDigest": "3ca5ca86cbe88cbd6cdb04778c8c5e2b286ddcb3a3c84997a5651e3a06b245c3",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "việc-chưa-quyết-để-lại",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; source unit shorter than 40 characters. Whole heading docs/specs/runner.md#việc-chưa-quyết-để-lại (lines 2865–2865) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#việc-chưa-quyết-để-lại. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "3ca5ca86cbe88cbd6cdb04778c8c5e2b286ddcb3a3c84997a5651e3a06b245c3",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0033 — Capacity cli-spawn-shaped thắng hasLiveTaskAccess, thu hẹp 0026 rule 2"
    ]
  }
}
```

### Full source unit

```text
#### Việc chưa quyết, để lại

- Có nên đổi tên/tài liệu hoá rõ hơn khái niệm "cli-spawn-shaped" thành
  một field tường minh trên capacity (thay vì suy ra từ shape) không —
  chưa cần, chưa có case thật đòi hỏi.
- 6 skill (`fgos-coding-exploring`/`fgos-coding-planning`/
  `fgos-coding-validating`/`fgos-coding-implement`/`fgos-fanout`/
  `_shared/capacity-dispatch-fallback.md`) trích "Native-First Dispatch
  Doctrine rule 2" làm lý do không tự dispatch Task tool tuỳ tiện — đã
  đọc lại, không cái nào khẳng định sai sau `0033` (lý do của chúng là
  "đừng tự tạo sub-dispatch tuỳ tiện", không phải "hasLiveTaskAccess luôn
  thắng") — không sửa file nào trong số này.
```

### Full target unit

```text
#### Việc chưa quyết, để lại

- Có nên đổi tên/tài liệu hoá rõ hơn khái niệm "cli-spawn-shaped" thành
  một field tường minh trên capacity (thay vì suy ra từ shape) không —
  chưa cần, chưa có case thật đòi hỏi.
- 6 skill (`fgos-coding-exploring`/`fgos-coding-planning`/
  `fgos-coding-validating`/`fgos-coding-implement`/`fgos-fanout`/
  `_shared/capacity-dispatch-fallback.md`) trích "Native-First Dispatch
  Doctrine rule 2" làm lý do không tự dispatch Task tool tuỳ tiện — đã
  đọc lại, không cái nào khẳng định sai sau `0033` (lý do của chúng là
  "đừng tự tạo sub-dispatch tuỳ tiện", không phải "hasLiveTaskAccess luôn
  thắng") — không sửa file nào trong số này.
```

### Full diff

```diff
No text difference.
```

## claim_87b482a8b3e86d2d207141caad98379c

Source digest: 04550d8e16617b4e32210c73b5caa21d205cfeafd16f8d6a900b1be4766bafb6

Target digest: 04550d8e16617b4e32210c73b5caa21d205cfeafd16f8d6a900b1be4766bafb6

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-294",
  "sourceLines": [
    2867,
    2876
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0033 — Capacity cli-spawn-shaped thắng hasLiveTaskAccess, thu hẹp 0026 rule 2",
    "Việc chưa quyết, để lại"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-153",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0033 — Capacity cli-spawn-shaped thắng hasLiveTaskAccess, thu hẹp 0026 rule 2",
    "Việc chưa quyết, để lại"
  ],
  "nativeTargetClaimId": "claim_3f2945079b04fa289273339560785b15",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "việc-chưa-quyết-để-lại",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_87b482a8b3e86d2d207141caad98379c",
    "sourceUnitDigest": "04550d8e16617b4e32210c73b5caa21d205cfeafd16f8d6a900b1be4766bafb6",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-153",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-294 (lines 2867–2876) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-153. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "04550d8e16617b4e32210c73b5caa21d205cfeafd16f8d6a900b1be4766bafb6",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0033 — Capacity cli-spawn-shaped thắng hasLiveTaskAccess, thu hẹp 0026 rule 2",
      "Việc chưa quyết, để lại"
    ]
  }
}
```

### Full source unit

```text
- Có nên đổi tên/tài liệu hoá rõ hơn khái niệm "cli-spawn-shaped" thành
  một field tường minh trên capacity (thay vì suy ra từ shape) không —
  chưa cần, chưa có case thật đòi hỏi.
- 6 skill (`fgos-coding-exploring`/`fgos-coding-planning`/
  `fgos-coding-validating`/`fgos-coding-implement`/`fgos-fanout`/
  `_shared/capacity-dispatch-fallback.md`) trích "Native-First Dispatch
  Doctrine rule 2" làm lý do không tự dispatch Task tool tuỳ tiện — đã
  đọc lại, không cái nào khẳng định sai sau `0033` (lý do của chúng là
  "đừng tự tạo sub-dispatch tuỳ tiện", không phải "hasLiveTaskAccess luôn
  thắng") — không sửa file nào trong số này.
```

### Full target unit

```text
- Có nên đổi tên/tài liệu hoá rõ hơn khái niệm "cli-spawn-shaped" thành
  một field tường minh trên capacity (thay vì suy ra từ shape) không —
  chưa cần, chưa có case thật đòi hỏi.
- 6 skill (`fgos-coding-exploring`/`fgos-coding-planning`/
  `fgos-coding-validating`/`fgos-coding-implement`/`fgos-fanout`/
  `_shared/capacity-dispatch-fallback.md`) trích "Native-First Dispatch
  Doctrine rule 2" làm lý do không tự dispatch Task tool tuỳ tiện — đã
  đọc lại, không cái nào khẳng định sai sau `0033` (lý do của chúng là
  "đừng tự tạo sub-dispatch tuỳ tiện", không phải "hasLiveTaskAccess luôn
  thắng") — không sửa file nào trong số này.
```

### Full diff

```diff
No text difference.
```

## claim_8f08ea8e31fecc895af7d5e5a5e729ba

Source digest: f6a4d6d2d0eb4259dc2343f3344d63c3acffaf1211b2439f1d7c66502f3e8fb5

Target digest: f6a4d6d2d0eb4259dc2343f3344d63c3acffaf1211b2439f1d7c66502f3e8fb5

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "tham-chiếu-4",
  "sourceLines": [
    2878,
    2878
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0033 — Capacity cli-spawn-shaped thắng hasLiveTaskAccess, thu hẹp 0026 rule 2"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "tham-chiếu-4",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0033 — Capacity cli-spawn-shaped thắng hasLiveTaskAccess, thu hẹp 0026 rule 2"
  ],
  "nativeTargetClaimId": "claim_6014779278f210eecb3bff837bca5ae9",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; source unit shorter than 40 characters",
  "section": "tham-chiếu-4",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_8f08ea8e31fecc895af7d5e5a5e729ba",
    "sourceUnitDigest": "f6a4d6d2d0eb4259dc2343f3344d63c3acffaf1211b2439f1d7c66502f3e8fb5",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "tham-chiếu-4",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; source unit shorter than 40 characters. Whole heading docs/specs/runner.md#tham-chiếu-4 (lines 2878–2878) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#tham-chiếu-4. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "f6a4d6d2d0eb4259dc2343f3344d63c3acffaf1211b2439f1d7c66502f3e8fb5",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0033 — Capacity cli-spawn-shaped thắng hasLiveTaskAccess, thu hẹp 0026 rule 2"
    ]
  }
}
```

### Full source unit

```text
#### Tham chiếu

- `0026` — quyết định gốc, rule 2 bị thu hẹp
- `docs/history/tsk-pdg/RESEARCH.md`, `plan.md` — bằng chứng đầy đủ
- `docs/history/tsk-1m8/` — item trước, phát hiện gap này khi live-test
```

### Full target unit

```text
#### Tham chiếu

- `0026` — quyết định gốc, rule 2 bị thu hẹp
- `docs/history/tsk-pdg/RESEARCH.md`, `plan.md` — bằng chứng đầy đủ
- `docs/history/tsk-1m8/` — item trước, phát hiện gap này khi live-test
```

### Full diff

```diff
No text difference.
```

## claim_66d9ed7d6c7312c4cde589fe1599d01c

Source digest: aaa8cf6b96e4e1f0244c5f78a707ce5e4c7a2e55e339107e95fbe4b0b5467ed0

Target digest: aaa8cf6b96e4e1f0244c5f78a707ce5e4c7a2e55e339107e95fbe4b0b5467ed0

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-295",
  "sourceLines": [
    2880,
    2882
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0033 — Capacity cli-spawn-shaped thắng hasLiveTaskAccess, thu hẹp 0026 rule 2",
    "Tham chiếu"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-154",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0033 — Capacity cli-spawn-shaped thắng hasLiveTaskAccess, thu hẹp 0026 rule 2",
    "Tham chiếu"
  ],
  "nativeTargetClaimId": "claim_c75bef6047326341e9b4e23a933feba9",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "tham-chiếu-4",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_66d9ed7d6c7312c4cde589fe1599d01c",
    "sourceUnitDigest": "aaa8cf6b96e4e1f0244c5f78a707ce5e4c7a2e55e339107e95fbe4b0b5467ed0",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-154",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-295 (lines 2880–2882) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-154. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "aaa8cf6b96e4e1f0244c5f78a707ce5e4c7a2e55e339107e95fbe4b0b5467ed0",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0033 — Capacity cli-spawn-shaped thắng hasLiveTaskAccess, thu hẹp 0026 rule 2",
      "Tham chiếu"
    ]
  }
}
```

### Full source unit

```text
- `0026` — quyết định gốc, rule 2 bị thu hẹp
- `docs/history/tsk-pdg/RESEARCH.md`, `plan.md` — bằng chứng đầy đủ
- `docs/history/tsk-1m8/` — item trước, phát hiện gap này khi live-test
```

### Full target unit

```text
- `0026` — quyết định gốc, rule 2 bị thu hẹp
- `docs/history/tsk-pdg/RESEARCH.md`, `plan.md` — bằng chứng đầy đủ
- `docs/history/tsk-1m8/` — item trước, phát hiện gap này khi live-test
```

### Full diff

```diff
No text difference.
```

## claim_6b073340e38b94b93db36f74a464f9c1

Source digest: 8e58276b0592e40372a37ac42f2a7f2d457d7751f65c5a612dfc3921d4b43f44

Target digest: 8e58276b0592e40372a37ac42f2a7f2d457d7751f65c5a612dfc3921d4b43f44

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "0034-đổi-tên-capacitycapacities-thành-executorexecutors-chốt-tách-capability",
  "sourceLines": [
    2884,
    2884
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "0034-đổi-tên-capacitycapacities-thành-executorexecutors-chốt-tách-capability",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
  ],
  "nativeTargetClaimId": "claim_0839c75e52f5ff75b3ba9cd1310d116c",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "0034-đổi-tên-capacitycapacities-thành-executorexecutors-chốt-tách-capability",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_6b073340e38b94b93db36f74a464f9c1",
    "sourceUnitDigest": "8e58276b0592e40372a37ac42f2a7f2d457d7751f65c5a612dfc3921d4b43f44",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "0034-đổi-tên-capacitycapacities-thành-executorexecutors-chốt-tách-capability",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole heading docs/specs/runner.md#0034-đổi-tên-capacitycapacities-thành-executorexecutors-chốt-tách-capability (lines 2884–2884) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#0034-đổi-tên-capacitycapacities-thành-executorexecutors-chốt-tách-capability. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "8e58276b0592e40372a37ac42f2a7f2d457d7751f65c5a612dfc3921d4b43f44",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
    ]
  }
}
```

### Full source unit

```text
### 0034 — Đổi tên `capacity`/`capacities` thành `executor`/`executors`, chốt tách `capability`
```

### Full target unit

```text
### 0034 — Đổi tên `capacity`/`capacities` thành `executor`/`executors`, chốt tách `capability`
```

### Full diff

```diff
No text difference.
```

## claim_de74e982f45712c6d325e6a73eff45d6

Source digest: c671382ac14dd3666195d2f3fd236db5229c64fdca276adb03d3df4f3356732c

Target digest: c671382ac14dd3666195d2f3fd236db5229c64fdca276adb03d3df4f3356732c

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "quyết-định-12",
  "sourceLines": [
    2886,
    2886
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0034 — Đổi tên `capacity`/`capacities` thành `executor`/`executors`, chốt tách `capability`"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "quyết-định-12",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0034 — Đổi tên `capacity`/`capacities` thành `executor`/`executors`, chốt tách `capability`"
  ],
  "nativeTargetClaimId": "claim_1c9956876fe5ca79fd6ed85e151803bc",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; source unit shorter than 40 characters",
  "section": "quyết-định-12",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_de74e982f45712c6d325e6a73eff45d6",
    "sourceUnitDigest": "c671382ac14dd3666195d2f3fd236db5229c64fdca276adb03d3df4f3356732c",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "quyết-định-12",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; source unit shorter than 40 characters. Whole heading docs/specs/runner.md#quyết-định-12 (lines 2886–2886) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#quyết-định-12. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "c671382ac14dd3666195d2f3fd236db5229c64fdca276adb03d3df4f3356732c",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0034 — Đổi tên `capacity`/`capacities` thành `executor`/`executors`, chốt tách `capability`"
    ]
  }
}
```

### Full source unit

```text
#### Quyết định

`runner.capacities.<id>` (danh mục backend cụ thể có thể thực thi công
việc — vd `agy`, `gitnexus`) đổi tên dứt điểm thành `runner.executors.<id>`
— trên cả field config LẪN mọi identifier code liên quan trong `src/`.
Không giữ back-compat/alias cho tên cũ. `runner.capabilities.<name>` (một
purpose/lời hứa trừu tượng, vd `fgos-coding-implement`) và `runner.executor`
(số ít, cấu hình default toàn cục) giữ nguyên tên, không đổi.

`executor` thắng phương án thay thế `backend` trên hai căn cứ: (1) kỹ
thuật — `resolveExecutorConfig` (`src/runner/dispatch.mjs`) đã giải cả
một backend có tên LẪN default toàn cục thành cùng một shape mà chính code
gọi là `executor` từ trước — đổi tên là hợp nhất một sự thật đã có sẵn
trong code, không phải chọn một từ mới tùy ý; (2) ngữ nghĩa — `capability`
= một lời hứa hành vi (behavior-promise), executor = sự hiện thực hóa lời
hứa đó (gốc động từ "to execute"); `backend` là danh từ tĩnh, không mang
nghĩa hành động này.
```

### Full target unit

```text
#### Quyết định

`runner.capacities.<id>` (danh mục backend cụ thể có thể thực thi công
việc — vd `agy`, `gitnexus`) đổi tên dứt điểm thành `runner.executors.<id>`
— trên cả field config LẪN mọi identifier code liên quan trong `src/`.
Không giữ back-compat/alias cho tên cũ. `runner.capabilities.<name>` (một
purpose/lời hứa trừu tượng, vd `fgos-coding-implement`) và `runner.executor`
(số ít, cấu hình default toàn cục) giữ nguyên tên, không đổi.

`executor` thắng phương án thay thế `backend` trên hai căn cứ: (1) kỹ
thuật — `resolveExecutorConfig` (`src/runner/dispatch.mjs`) đã giải cả
một backend có tên LẪN default toàn cục thành cùng một shape mà chính code
gọi là `executor` từ trước — đổi tên là hợp nhất một sự thật đã có sẵn
trong code, không phải chọn một từ mới tùy ý; (2) ngữ nghĩa — `capability`
= một lời hứa hành vi (behavior-promise), executor = sự hiện thực hóa lời
hứa đó (gốc động từ "to execute"); `backend` là danh từ tĩnh, không mang
nghĩa hành động này.
```

### Full diff

```diff
No text difference.
```

## claim_b3a64f399876516efe3d00b4947b5d2b

Source digest: ec0b5f6e5ba2f866e50f1d7d71d632217f1115193503ed1fbd94a32f8a8e7b7b

Target digest: ec0b5f6e5ba2f866e50f1d7d71d632217f1115193503ed1fbd94a32f8a8e7b7b

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-296",
  "sourceLines": [
    2888,
    2893
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0034 — Đổi tên `capacity`/`capacities` thành `executor`/`executors`, chốt tách `capability`",
    "Quyết định"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-155",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0034 — Đổi tên `capacity`/`capacities` thành `executor`/`executors`, chốt tách `capability`",
    "Quyết định"
  ],
  "nativeTargetClaimId": "claim_6635c36f88abac7276e3db6773a81958",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "quyết-định-12",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_b3a64f399876516efe3d00b4947b5d2b",
    "sourceUnitDigest": "ec0b5f6e5ba2f866e50f1d7d71d632217f1115193503ed1fbd94a32f8a8e7b7b",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-155",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-296 (lines 2888–2893) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-155. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "ec0b5f6e5ba2f866e50f1d7d71d632217f1115193503ed1fbd94a32f8a8e7b7b",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0034 — Đổi tên `capacity`/`capacities` thành `executor`/`executors`, chốt tách `capability`",
      "Quyết định"
    ]
  }
}
```

### Full source unit

```text
`runner.capacities.<id>` (danh mục backend cụ thể có thể thực thi công
việc — vd `agy`, `gitnexus`) đổi tên dứt điểm thành `runner.executors.<id>`
— trên cả field config LẪN mọi identifier code liên quan trong `src/`.
Không giữ back-compat/alias cho tên cũ. `runner.capabilities.<name>` (một
purpose/lời hứa trừu tượng, vd `fgos-coding-implement`) và `runner.executor`
(số ít, cấu hình default toàn cục) giữ nguyên tên, không đổi.
```

### Full target unit

```text
`runner.capacities.<id>` (danh mục backend cụ thể có thể thực thi công
việc — vd `agy`, `gitnexus`) đổi tên dứt điểm thành `runner.executors.<id>`
— trên cả field config LẪN mọi identifier code liên quan trong `src/`.
Không giữ back-compat/alias cho tên cũ. `runner.capabilities.<name>` (một
purpose/lời hứa trừu tượng, vd `fgos-coding-implement`) và `runner.executor`
(số ít, cấu hình default toàn cục) giữ nguyên tên, không đổi.
```

### Full diff

```diff
No text difference.
```

## claim_02823a65efd2dfedd5ede5d38c5a7cbc

Source digest: 17ed295e7ce92915df840dbdb16ae2876361bd82b89ceb17fb9679fa76d3de90

Target digest: 17ed295e7ce92915df840dbdb16ae2876361bd82b89ceb17fb9679fa76d3de90

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-297",
  "sourceLines": [
    2895,
    2902
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0034 — Đổi tên `capacity`/`capacities` thành `executor`/`executors`, chốt tách `capability`",
    "Quyết định"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-156",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0034 — Đổi tên `capacity`/`capacities` thành `executor`/`executors`, chốt tách `capability`",
    "Quyết định"
  ],
  "nativeTargetClaimId": "claim_38eba1e82c9621b5e3bf2afef646909f",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "quyết-định-12",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_02823a65efd2dfedd5ede5d38c5a7cbc",
    "sourceUnitDigest": "17ed295e7ce92915df840dbdb16ae2876361bd82b89ceb17fb9679fa76d3de90",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-156",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-297 (lines 2895–2902) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-156. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "17ed295e7ce92915df840dbdb16ae2876361bd82b89ceb17fb9679fa76d3de90",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0034 — Đổi tên `capacity`/`capacities` thành `executor`/`executors`, chốt tách `capability`",
      "Quyết định"
    ]
  }
}
```

### Full source unit

```text
`executor` thắng phương án thay thế `backend` trên hai căn cứ: (1) kỹ
thuật — `resolveExecutorConfig` (`src/runner/dispatch.mjs`) đã giải cả
một backend có tên LẪN default toàn cục thành cùng một shape mà chính code
gọi là `executor` từ trước — đổi tên là hợp nhất một sự thật đã có sẵn
trong code, không phải chọn một từ mới tùy ý; (2) ngữ nghĩa — `capability`
= một lời hứa hành vi (behavior-promise), executor = sự hiện thực hóa lời
hứa đó (gốc động từ "to execute"); `backend` là danh từ tĩnh, không mang
nghĩa hành động này.
```

### Full target unit

```text
`executor` thắng phương án thay thế `backend` trên hai căn cứ: (1) kỹ
thuật — `resolveExecutorConfig` (`src/runner/dispatch.mjs`) đã giải cả
một backend có tên LẪN default toàn cục thành cùng một shape mà chính code
gọi là `executor` từ trước — đổi tên là hợp nhất một sự thật đã có sẵn
trong code, không phải chọn một từ mới tùy ý; (2) ngữ nghĩa — `capability`
= một lời hứa hành vi (behavior-promise), executor = sự hiện thực hóa lời
hứa đó (gốc động từ "to execute"); `backend` là danh từ tĩnh, không mang
nghĩa hành động này.
```

### Full diff

```diff
No text difference.
```

## claim_23287bcf7f6983bd1851efd037ced88f

Source digest: b6f027726edfbe603e799e5140a6545f768a1d496d716420bd7007dadb9af319

Target digest: b6f027726edfbe603e799e5140a6545f768a1d496d716420bd7007dadb9af319

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "chính-thức-hóa-việc-tách-capabilitycapacity-mà-0029-để-ngỏ",
  "sourceLines": [
    2904,
    2904
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0034 — Đổi tên `capacity`/`capacities` thành `executor`/`executors`, chốt tách `capability`"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "chính-thức-hóa-việc-tách-capabilitycapacity-mà-0029-để-ngỏ",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0034 — Đổi tên `capacity`/`capacities` thành `executor`/`executors`, chốt tách `capability`"
  ],
  "nativeTargetClaimId": "claim_761ce066c2b91929b6e2653a4bfb7a0d",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "chính-thức-hóa-việc-tách-capabilitycapacity-mà-0029-để-ngỏ",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_23287bcf7f6983bd1851efd037ced88f",
    "sourceUnitDigest": "b6f027726edfbe603e799e5140a6545f768a1d496d716420bd7007dadb9af319",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "chính-thức-hóa-việc-tách-capabilitycapacity-mà-0029-để-ngỏ",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole heading docs/specs/runner.md#chính-thức-hóa-việc-tách-capabilitycapacity-mà-0029-để-ngỏ (lines 2904–2904) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#chính-thức-hóa-việc-tách-capabilitycapacity-mà-0029-để-ngỏ. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "b6f027726edfbe603e799e5140a6545f768a1d496d716420bd7007dadb9af319",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0034 — Đổi tên `capacity`/`capacities` thành `executor`/`executors`, chốt tách `capability`"
    ]
  }
}
```

### Full source unit

```text
#### Chính thức hóa việc tách `capability`/`capacity` mà `0029` để ngỏ

`0029` định nghĩa gốc: `capacity` = "một năng lực có tên (behavior-
promise / functional-helper)" — tức lịch sử "capacity" từng gộp CẢ lời
hứa (behavior-promise) LẪN đơn vị hiện thực (functional-helper) làm một,
không phân biệt. `tsk-34n` (2026-08-16, trước record này) sau đó TÁCH khái
niệm đó thành hai field riêng — `capability` (lời hứa/purpose) và
`capacity` (backend cụ thể hiện thực nó, qua `for`/`prefer`) — nhưng chưa
bao giờ chính thức sửa lại điều khoản gốc của `0029`. Record này ghi nhận rõ sự
tách đó, thay vì để nó ngầm định: điều khoản gốc's "behavior-promise" nay là
`capabilities.<name>`; điều khoản gốc's "functional-helper" nay là `executors.<id>`
(đổi tên bởi chính record này).
```

### Full target unit

```text
#### Chính thức hóa việc tách `capability`/`capacity` mà `0029` để ngỏ

`0029` định nghĩa gốc: `capacity` = "một năng lực có tên (behavior-
promise / functional-helper)" — tức lịch sử "capacity" từng gộp CẢ lời
hứa (behavior-promise) LẪN đơn vị hiện thực (functional-helper) làm một,
không phân biệt. `tsk-34n` (2026-08-16, trước record này) sau đó TÁCH khái
niệm đó thành hai field riêng — `capability` (lời hứa/purpose) và
`capacity` (backend cụ thể hiện thực nó, qua `for`/`prefer`) — nhưng chưa
bao giờ chính thức sửa lại điều khoản gốc của `0029`. Record này ghi nhận rõ sự
tách đó, thay vì để nó ngầm định: điều khoản gốc's "behavior-promise" nay là
`capabilities.<name>`; điều khoản gốc's "functional-helper" nay là `executors.<id>`
(đổi tên bởi chính record này).
```

### Full diff

```diff
No text difference.
```

## claim_8c90d9e626770349175e1bb0b1d9d46f

Source digest: 737e5ff2fc9356e613bd278f0a8196653b328bb8c511847a819efcd4886fcfd5

Target digest: 737e5ff2fc9356e613bd278f0a8196653b328bb8c511847a819efcd4886fcfd5

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-298",
  "sourceLines": [
    2906,
    2915
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0034 — Đổi tên `capacity`/`capacities` thành `executor`/`executors`, chốt tách `capability`",
    "Chính thức hóa việc tách `capability`/`capacity` mà `0029` để ngỏ"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-157",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0034 — Đổi tên `capacity`/`capacities` thành `executor`/`executors`, chốt tách `capability`",
    "Chính thức hóa việc tách `capability`/`capacity` mà `0029` để ngỏ"
  ],
  "nativeTargetClaimId": "claim_995a841ed70c9629b389eb028e7640a7",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "chính-thức-hóa-việc-tách-capabilitycapacity-mà-0029-để-ngỏ",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_8c90d9e626770349175e1bb0b1d9d46f",
    "sourceUnitDigest": "737e5ff2fc9356e613bd278f0a8196653b328bb8c511847a819efcd4886fcfd5",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-157",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-298 (lines 2906–2915) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-157. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "737e5ff2fc9356e613bd278f0a8196653b328bb8c511847a819efcd4886fcfd5",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0034 — Đổi tên `capacity`/`capacities` thành `executor`/`executors`, chốt tách `capability`",
      "Chính thức hóa việc tách `capability`/`capacity` mà `0029` để ngỏ"
    ]
  }
}
```

### Full source unit

```text
`0029` định nghĩa gốc: `capacity` = "một năng lực có tên (behavior-
promise / functional-helper)" — tức lịch sử "capacity" từng gộp CẢ lời
hứa (behavior-promise) LẪN đơn vị hiện thực (functional-helper) làm một,
không phân biệt. `tsk-34n` (2026-08-16, trước record này) sau đó TÁCH khái
niệm đó thành hai field riêng — `capability` (lời hứa/purpose) và
`capacity` (backend cụ thể hiện thực nó, qua `for`/`prefer`) — nhưng chưa
bao giờ chính thức sửa lại điều khoản gốc của `0029`. Record này ghi nhận rõ sự
tách đó, thay vì để nó ngầm định: điều khoản gốc's "behavior-promise" nay là
`capabilities.<name>`; điều khoản gốc's "functional-helper" nay là `executors.<id>`
(đổi tên bởi chính record này).
```

### Full target unit

```text
`0029` định nghĩa gốc: `capacity` = "một năng lực có tên (behavior-
promise / functional-helper)" — tức lịch sử "capacity" từng gộp CẢ lời
hứa (behavior-promise) LẪN đơn vị hiện thực (functional-helper) làm một,
không phân biệt. `tsk-34n` (2026-08-16, trước record này) sau đó TÁCH khái
niệm đó thành hai field riêng — `capability` (lời hứa/purpose) và
`capacity` (backend cụ thể hiện thực nó, qua `for`/`prefer`) — nhưng chưa
bao giờ chính thức sửa lại điều khoản gốc của `0029`. Record này ghi nhận rõ sự
tách đó, thay vì để nó ngầm định: điều khoản gốc's "behavior-promise" nay là
`capabilities.<name>`; điều khoản gốc's "functional-helper" nay là `executors.<id>`
(đổi tên bởi chính record này).
```

### Full diff

```diff
No text difference.
```

## claim_ea470beddec07b87fdc8d614f0e8c5c1

Source digest: 6e5e5e820342d46018e9baf0a6c91d9e0d1bd9c917b2cf556203ff08ffd4b51e

Target digest: 6e5e5e820342d46018e9baf0a6c91d9e0d1bd9c917b2cf556203ff08ffd4b51e

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "phạm-vi-đổi-tên",
  "sourceLines": [
    2917,
    2917
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0034 — Đổi tên `capacity`/`capacities` thành `executor`/`executors`, chốt tách `capability`"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "phạm-vi-đổi-tên",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0034 — Đổi tên `capacity`/`capacities` thành `executor`/`executors`, chốt tách `capability`"
  ],
  "nativeTargetClaimId": "claim_2b5526ae6dc0b8d148e788aa445fb4ee",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; source unit shorter than 40 characters",
  "section": "phạm-vi-đổi-tên",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_ea470beddec07b87fdc8d614f0e8c5c1",
    "sourceUnitDigest": "6e5e5e820342d46018e9baf0a6c91d9e0d1bd9c917b2cf556203ff08ffd4b51e",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "phạm-vi-đổi-tên",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; source unit shorter than 40 characters. Whole heading docs/specs/runner.md#phạm-vi-đổi-tên (lines 2917–2917) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#phạm-vi-đổi-tên. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "6e5e5e820342d46018e9baf0a6c91d9e0d1bd9c917b2cf556203ff08ffd4b51e",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0034 — Đổi tên `capacity`/`capacities` thành `executor`/`executors`, chốt tách `capability`"
    ]
  }
}
```

### Full source unit

```text
#### Phạm vi đổi tên

- `.fgos/config.json` (live, main checkout): `runner.capacities` →
  `runner.executors`.
- `src/` (7 file), `test/` (8 file), `bin/fgos.mjs`,
  `scripts/dispatch-decide-hook.mjs`, `scripts/project-agents.mjs`,
  `scripts/check-decision-codes.baseline.json`: mọi identifier/field
  liên quan đổi tên đồng bộ (`resolveCapacityAndOverrides` →
  `resolveExecutorAndOverrides`, `capacityId` → `executorId`, `cfg.
  capacities` → `cfg.executors`, v.v.) — xác nhận `npm test` xanh toàn
  bộ sau đổi tên (3477 pass / 0 fail / 5 skip).
- **Không đổi**: `docs/history/*capacity*/` (~14 thư mục lịch sử, nội
  dung ghi lại nguyên trạng dùng thuật ngữ đúng thời điểm được viết —
  đổi tên riêng thư mục sẽ làm nội dung bên trong sai lệch với chính tên
  thư mục nó nằm trong); nội dung của chính `0026`/`0029`/`0033` (giữ
  nguyên chữ "capacity" trong văn bản gốc, không mở lại/supersede).
- **Có đổi**: docs sống (`docs/explanation/`, `docs/how-to/`,
  `docs/reference/`) và fragment skill dùng chung
  `_shared/capacity-dispatch-fallback.md` → `_shared/executor-dispatch-
  fallback.md` (cả nội dung lẫn tên file), vì cả hai mô tả hành vi hệ
  thống HIỆN TẠI, không phải một bản ghi lịch sử.
```

### Full target unit

```text
#### Phạm vi đổi tên

- `.fgos/config.json` (live, main checkout): `runner.capacities` →
  `runner.executors`.
- `src/` (7 file), `test/` (8 file), `bin/fgos.mjs`,
  `scripts/dispatch-decide-hook.mjs`, `scripts/project-agents.mjs`,
  `scripts/check-decision-codes.baseline.json`: mọi identifier/field
  liên quan đổi tên đồng bộ (`resolveCapacityAndOverrides` →
  `resolveExecutorAndOverrides`, `capacityId` → `executorId`, `cfg.
  capacities` → `cfg.executors`, v.v.) — xác nhận `npm test` xanh toàn
  bộ sau đổi tên (3477 pass / 0 fail / 5 skip).
- **Không đổi**: `docs/history/*capacity*/` (~14 thư mục lịch sử, nội
  dung ghi lại nguyên trạng dùng thuật ngữ đúng thời điểm được viết —
  đổi tên riêng thư mục sẽ làm nội dung bên trong sai lệch với chính tên
  thư mục nó nằm trong); nội dung của chính `0026`/`0029`/`0033` (giữ
  nguyên chữ "capacity" trong văn bản gốc, không mở lại/supersede).
- **Có đổi**: docs sống (`docs/explanation/`, `docs/how-to/`,
  `docs/reference/`) và fragment skill dùng chung
  `_shared/capacity-dispatch-fallback.md` → `_shared/executor-dispatch-
  fallback.md` (cả nội dung lẫn tên file), vì cả hai mô tả hành vi hệ
  thống HIỆN TẠI, không phải một bản ghi lịch sử.
```

### Full diff

```diff
No text difference.
```

## claim_ddda01d789306855b66939663369488f

Source digest: 7ab91fd5390d2c9225425d8fab1b67e10f6ecc5c4873717d8c6e2cef1a36f642

Target digest: 7ab91fd5390d2c9225425d8fab1b67e10f6ecc5c4873717d8c6e2cef1a36f642

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-299",
  "sourceLines": [
    2919,
    2937
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0034 — Đổi tên `capacity`/`capacities` thành `executor`/`executors`, chốt tách `capability`",
    "Phạm vi đổi tên"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-158",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0034 — Đổi tên `capacity`/`capacities` thành `executor`/`executors`, chốt tách `capability`",
    "Phạm vi đổi tên"
  ],
  "nativeTargetClaimId": "claim_bdf7915c6b2d08d6c320796505e0f5d8",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "phạm-vi-đổi-tên",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_ddda01d789306855b66939663369488f",
    "sourceUnitDigest": "7ab91fd5390d2c9225425d8fab1b67e10f6ecc5c4873717d8c6e2cef1a36f642",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-158",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-299 (lines 2919–2937) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-158. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "7ab91fd5390d2c9225425d8fab1b67e10f6ecc5c4873717d8c6e2cef1a36f642",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0034 — Đổi tên `capacity`/`capacities` thành `executor`/`executors`, chốt tách `capability`",
      "Phạm vi đổi tên"
    ]
  }
}
```

### Full source unit

```text
- `.fgos/config.json` (live, main checkout): `runner.capacities` →
  `runner.executors`.
- `src/` (7 file), `test/` (8 file), `bin/fgos.mjs`,
  `scripts/dispatch-decide-hook.mjs`, `scripts/project-agents.mjs`,
  `scripts/check-decision-codes.baseline.json`: mọi identifier/field
  liên quan đổi tên đồng bộ (`resolveCapacityAndOverrides` →
  `resolveExecutorAndOverrides`, `capacityId` → `executorId`, `cfg.
  capacities` → `cfg.executors`, v.v.) — xác nhận `npm test` xanh toàn
  bộ sau đổi tên (3477 pass / 0 fail / 5 skip).
- **Không đổi**: `docs/history/*capacity*/` (~14 thư mục lịch sử, nội
  dung ghi lại nguyên trạng dùng thuật ngữ đúng thời điểm được viết —
  đổi tên riêng thư mục sẽ làm nội dung bên trong sai lệch với chính tên
  thư mục nó nằm trong); nội dung của chính `0026`/`0029`/`0033` (giữ
  nguyên chữ "capacity" trong văn bản gốc, không mở lại/supersede).
- **Có đổi**: docs sống (`docs/explanation/`, `docs/how-to/`,
  `docs/reference/`) và fragment skill dùng chung
  `_shared/capacity-dispatch-fallback.md` → `_shared/executor-dispatch-
  fallback.md` (cả nội dung lẫn tên file), vì cả hai mô tả hành vi hệ
  thống HIỆN TẠI, không phải một bản ghi lịch sử.
```

### Full target unit

```text
- `.fgos/config.json` (live, main checkout): `runner.capacities` →
  `runner.executors`.
- `src/` (7 file), `test/` (8 file), `bin/fgos.mjs`,
  `scripts/dispatch-decide-hook.mjs`, `scripts/project-agents.mjs`,
  `scripts/check-decision-codes.baseline.json`: mọi identifier/field
  liên quan đổi tên đồng bộ (`resolveCapacityAndOverrides` →
  `resolveExecutorAndOverrides`, `capacityId` → `executorId`, `cfg.
  capacities` → `cfg.executors`, v.v.) — xác nhận `npm test` xanh toàn
  bộ sau đổi tên (3477 pass / 0 fail / 5 skip).
- **Không đổi**: `docs/history/*capacity*/` (~14 thư mục lịch sử, nội
  dung ghi lại nguyên trạng dùng thuật ngữ đúng thời điểm được viết —
  đổi tên riêng thư mục sẽ làm nội dung bên trong sai lệch với chính tên
  thư mục nó nằm trong); nội dung của chính `0026`/`0029`/`0033` (giữ
  nguyên chữ "capacity" trong văn bản gốc, không mở lại/supersede).
- **Có đổi**: docs sống (`docs/explanation/`, `docs/how-to/`,
  `docs/reference/`) và fragment skill dùng chung
  `_shared/capacity-dispatch-fallback.md` → `_shared/executor-dispatch-
  fallback.md` (cả nội dung lẫn tên file), vì cả hai mô tả hành vi hệ
  thống HIỆN TẠI, không phải một bản ghi lịch sử.
```

### Full diff

```diff
No text difference.
```

## claim_b8231625af5863b35986d15572ab7041

Source digest: c808ccbd6f107366a00b785c1279ac815806af56be163e696dd57963f3d7f01d

Target digest: c808ccbd6f107366a00b785c1279ac815806af56be163e696dd57963f3d7f01d

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "một-collision-đã-xử-lý-khi-thực-thi",
  "sourceLines": [
    2939,
    2939
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0034 — Đổi tên `capacity`/`capacities` thành `executor`/`executors`, chốt tách `capability`"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "một-collision-đã-xử-lý-khi-thực-thi",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0034 — Đổi tên `capacity`/`capacities` thành `executor`/`executors`, chốt tách `capability`"
  ],
  "nativeTargetClaimId": "claim_c5b9ac54f4a18c291da21a6b6041c620",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "một-collision-đã-xử-lý-khi-thực-thi",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_b8231625af5863b35986d15572ab7041",
    "sourceUnitDigest": "c808ccbd6f107366a00b785c1279ac815806af56be163e696dd57963f3d7f01d",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "một-collision-đã-xử-lý-khi-thực-thi",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole heading docs/specs/runner.md#một-collision-đã-xử-lý-khi-thực-thi (lines 2939–2939) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#một-collision-đã-xử-lý-khi-thực-thi. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "c808ccbd6f107366a00b785c1279ac815806af56be163e696dd57963f3d7f01d",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0034 — Đổi tên `capacity`/`capacities` thành `executor`/`executors`, chốt tách `capability`"
    ]
  }
}
```

### Full source unit

```text
#### Một collision đã xử lý khi thực thi

`runner.executors` (số nhiều) trùng CHỮ với một field đã bị RÚT hoàn toàn
từ trước (`executors.<tier>`, rung override theo tier, rút tại `tsk-in1-2`,
0 entry sống, chưa bao giờ được validate). Đây là trùng CHỮ, không
trùng Ý — field cũ đã chết hẳn từ trước record này (không xuất hiện ở bất
kỳ config nào trên đĩa), record này tái dùng đúng chuỗi ký tự đó cho một
khái niệm thật, có validate, khác hẳn. Một test cũ (`test/runner/
dispatch.test.mjs`) từng khẳng định field "executors" "never validated,
inert" — đúng cho field CŨ, sai cho field MỚI record này tạo ra; test đã
sửa lại để phản ánh đúng, cùng một dòng comment lịch sử giải thích rõ hai
"executors" khác nhau qua thời gian, tránh nhầm lẫn cho người đọc sau.
```

### Full target unit

```text
#### Một collision đã xử lý khi thực thi

`runner.executors` (số nhiều) trùng CHỮ với một field đã bị RÚT hoàn toàn
từ trước (`executors.<tier>`, rung override theo tier, rút tại `tsk-in1-2`,
0 entry sống, chưa bao giờ được validate). Đây là trùng CHỮ, không
trùng Ý — field cũ đã chết hẳn từ trước record này (không xuất hiện ở bất
kỳ config nào trên đĩa), record này tái dùng đúng chuỗi ký tự đó cho một
khái niệm thật, có validate, khác hẳn. Một test cũ (`test/runner/
dispatch.test.mjs`) từng khẳng định field "executors" "never validated,
inert" — đúng cho field CŨ, sai cho field MỚI record này tạo ra; test đã
sửa lại để phản ánh đúng, cùng một dòng comment lịch sử giải thích rõ hai
"executors" khác nhau qua thời gian, tránh nhầm lẫn cho người đọc sau.
```

### Full diff

```diff
No text difference.
```

## claim_c68d7217ca0e657d27be51d28bb0cc14

Source digest: adb1f6a54f7434486030be6a40fc15ed9ef6e560a32c6b3abe68969324d38ba0

Target digest: adb1f6a54f7434486030be6a40fc15ed9ef6e560a32c6b3abe68969324d38ba0

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-300",
  "sourceLines": [
    2941,
    2950
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0034 — Đổi tên `capacity`/`capacities` thành `executor`/`executors`, chốt tách `capability`",
    "Một collision đã xử lý khi thực thi"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-159",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0034 — Đổi tên `capacity`/`capacities` thành `executor`/`executors`, chốt tách `capability`",
    "Một collision đã xử lý khi thực thi"
  ],
  "nativeTargetClaimId": "claim_18e64890de291836b2b934099c6aa2cc",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "một-collision-đã-xử-lý-khi-thực-thi",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_c68d7217ca0e657d27be51d28bb0cc14",
    "sourceUnitDigest": "adb1f6a54f7434486030be6a40fc15ed9ef6e560a32c6b3abe68969324d38ba0",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-159",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-300 (lines 2941–2950) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-159. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "adb1f6a54f7434486030be6a40fc15ed9ef6e560a32c6b3abe68969324d38ba0",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0034 — Đổi tên `capacity`/`capacities` thành `executor`/`executors`, chốt tách `capability`",
      "Một collision đã xử lý khi thực thi"
    ]
  }
}
```

### Full source unit

```text
`runner.executors` (số nhiều) trùng CHỮ với một field đã bị RÚT hoàn toàn
từ trước (`executors.<tier>`, rung override theo tier, rút tại `tsk-in1-2`,
0 entry sống, chưa bao giờ được validate). Đây là trùng CHỮ, không
trùng Ý — field cũ đã chết hẳn từ trước record này (không xuất hiện ở bất
kỳ config nào trên đĩa), record này tái dùng đúng chuỗi ký tự đó cho một
khái niệm thật, có validate, khác hẳn. Một test cũ (`test/runner/
dispatch.test.mjs`) từng khẳng định field "executors" "never validated,
inert" — đúng cho field CŨ, sai cho field MỚI record này tạo ra; test đã
sửa lại để phản ánh đúng, cùng một dòng comment lịch sử giải thích rõ hai
"executors" khác nhau qua thời gian, tránh nhầm lẫn cho người đọc sau.
```

### Full target unit

```text
`runner.executors` (số nhiều) trùng CHỮ với một field đã bị RÚT hoàn toàn
từ trước (`executors.<tier>`, rung override theo tier, rút tại `tsk-in1-2`,
0 entry sống, chưa bao giờ được validate). Đây là trùng CHỮ, không
trùng Ý — field cũ đã chết hẳn từ trước record này (không xuất hiện ở bất
kỳ config nào trên đĩa), record này tái dùng đúng chuỗi ký tự đó cho một
khái niệm thật, có validate, khác hẳn. Một test cũ (`test/runner/
dispatch.test.mjs`) từng khẳng định field "executors" "never validated,
inert" — đúng cho field CŨ, sai cho field MỚI record này tạo ra; test đã
sửa lại để phản ánh đúng, cùng một dòng comment lịch sử giải thích rõ hai
"executors" khác nhau qua thời gian, tránh nhầm lẫn cho người đọc sau.
```

### Full diff

```diff
No text difference.
```

## claim_b92bcaec50873a4ba6513926553e9df2

Source digest: b90fe65b5bef9a02785fc21cad4b5cb34ac2759baf44596540350352ea23c48c

Target digest: b90fe65b5bef9a02785fc21cad4b5cb34ac2759baf44596540350352ea23c48c

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "tham-chiếu-5",
  "sourceLines": [
    2952,
    2952
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0034 — Đổi tên `capacity`/`capacities` thành `executor`/`executors`, chốt tách `capability`"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "tham-chiếu-5",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0034 — Đổi tên `capacity`/`capacities` thành `executor`/`executors`, chốt tách `capability`"
  ],
  "nativeTargetClaimId": "claim_c1a3e962044c9615042eda382cae9c3b",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; source unit shorter than 40 characters",
  "section": "tham-chiếu-5",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_b92bcaec50873a4ba6513926553e9df2",
    "sourceUnitDigest": "b90fe65b5bef9a02785fc21cad4b5cb34ac2759baf44596540350352ea23c48c",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "tham-chiếu-5",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; source unit shorter than 40 characters. Whole heading docs/specs/runner.md#tham-chiếu-5 (lines 2952–2952) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#tham-chiếu-5. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "b90fe65b5bef9a02785fc21cad4b5cb34ac2759baf44596540350352ea23c48c",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0034 — Đổi tên `capacity`/`capacities` thành `executor`/`executors`, chốt tách `capability`"
    ]
  }
}
```

### Full source unit

```text
#### Tham chiếu

- `0029` — định nghĩa gốc, nay được chính thức hóa việc tách
- `docs/history/capability-capacity-remodel/` — tsk-34n, lần đầu tách
  capability/capacity trên thực tế (code), trước khi record này chốt tên
- `docs/history/capacity-naming-rename/` — DISCUSSION.md/CONTEXT.md/
  plan.md/iron-law-evidence.md của chính tsk-225, toàn bộ scout + bằng
  chứng thật cho quyết định này
```

### Full target unit

```text
#### Tham chiếu

- `0029` — định nghĩa gốc, nay được chính thức hóa việc tách
- `docs/history/capability-capacity-remodel/` — tsk-34n, lần đầu tách
  capability/capacity trên thực tế (code), trước khi record này chốt tên
- `docs/history/capacity-naming-rename/` — DISCUSSION.md/CONTEXT.md/
  plan.md/iron-law-evidence.md của chính tsk-225, toàn bộ scout + bằng
  chứng thật cho quyết định này
```

### Full diff

```diff
No text difference.
```

## claim_eef0985b1a2daecb884c83023fd1a14c

Source digest: dace16f243d7b6f64d946d856d4219c03f552af99cdfc3e429110eb7ff2e0b78

Target digest: dace16f243d7b6f64d946d856d4219c03f552af99cdfc3e429110eb7ff2e0b78

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-301",
  "sourceLines": [
    2954,
    2959
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0034 — Đổi tên `capacity`/`capacities` thành `executor`/`executors`, chốt tách `capability`",
    "Tham chiếu"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-160",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0034 — Đổi tên `capacity`/`capacities` thành `executor`/`executors`, chốt tách `capability`",
    "Tham chiếu"
  ],
  "nativeTargetClaimId": "claim_82af297801a5262f6e8e79161ea29794",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "tham-chiếu-5",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_eef0985b1a2daecb884c83023fd1a14c",
    "sourceUnitDigest": "dace16f243d7b6f64d946d856d4219c03f552af99cdfc3e429110eb7ff2e0b78",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-160",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-301 (lines 2954–2959) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-160. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "dace16f243d7b6f64d946d856d4219c03f552af99cdfc3e429110eb7ff2e0b78",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0034 — Đổi tên `capacity`/`capacities` thành `executor`/`executors`, chốt tách `capability`",
      "Tham chiếu"
    ]
  }
}
```

### Full source unit

```text
- `0029` — định nghĩa gốc, nay được chính thức hóa việc tách
- `docs/history/capability-capacity-remodel/` — tsk-34n, lần đầu tách
  capability/capacity trên thực tế (code), trước khi record này chốt tên
- `docs/history/capacity-naming-rename/` — DISCUSSION.md/CONTEXT.md/
  plan.md/iron-law-evidence.md của chính tsk-225, toàn bộ scout + bằng
  chứng thật cho quyết định này
```

### Full target unit

```text
- `0029` — định nghĩa gốc, nay được chính thức hóa việc tách
- `docs/history/capability-capacity-remodel/` — tsk-34n, lần đầu tách
  capability/capacity trên thực tế (code), trước khi record này chốt tên
- `docs/history/capacity-naming-rename/` — DISCUSSION.md/CONTEXT.md/
  plan.md/iron-law-evidence.md của chính tsk-225, toàn bộ scout + bằng
  chứng thật cho quyết định này
```

### Full diff

```diff
No text difference.
```

## claim_f88e4e8f91d884a569207232482994b8

Source digest: 80ab9c4a9405eed4d1289cd8872637275cca4685a9bb0934ed9cb2d807fb8b4a

Target digest: 80ab9c4a9405eed4d1289cd8872637275cca4685a9bb0934ed9cb2d807fb8b4a

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "capability-aware-dispatch-activation-tsk-46f",
  "sourceLines": [
    2961,
    2961
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "capability-aware-dispatch-activation-tsk-46f",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
  ],
  "nativeTargetClaimId": "claim_6fb3f553002809b391934a73cb6c9b4c",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "capability-aware-dispatch-activation-tsk-46f",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_f88e4e8f91d884a569207232482994b8",
    "sourceUnitDigest": "80ab9c4a9405eed4d1289cd8872637275cca4685a9bb0934ed9cb2d807fb8b4a",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "capability-aware-dispatch-activation-tsk-46f",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole heading docs/specs/runner.md#capability-aware-dispatch-activation-tsk-46f (lines 2961–2961) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#capability-aware-dispatch-activation-tsk-46f. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "80ab9c4a9405eed4d1289cd8872637275cca4685a9bb0934ed9cb2d807fb8b4a",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
    ]
  }
}
```

### Full source unit

```text
### Capability-aware dispatch activation (tsk-46f)
```

### Full target unit

```text
### Capability-aware dispatch activation (tsk-46f)
```

### Full diff

```diff
No text difference.
```

## claim_ea6c7805244cf8d32e0049344304793c

Source digest: eb63404bcc234075d335c4fcc64cbd5befb02d4124e963a16b942b574c80d0a0

Target digest: eb63404bcc234075d335c4fcc64cbd5befb02d4124e963a16b942b574c80d0a0

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "quyết-định-13",
  "sourceLines": [
    2963,
    2963
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Capability-aware dispatch activation (tsk-46f)"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "quyết-định-13",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Capability-aware dispatch activation (tsk-46f)"
  ],
  "nativeTargetClaimId": "claim_efbe03d6cab44adbb9935b8bc57eb442",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; source unit shorter than 40 characters",
  "section": "quyết-định-13",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_ea6c7805244cf8d32e0049344304793c",
    "sourceUnitDigest": "eb63404bcc234075d335c4fcc64cbd5befb02d4124e963a16b942b574c80d0a0",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "quyết-định-13",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; source unit shorter than 40 characters. Whole heading docs/specs/runner.md#quyết-định-13 (lines 2963–2963) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#quyết-định-13. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "eb63404bcc234075d335c4fcc64cbd5befb02d4124e963a16b942b574c80d0a0",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Capability-aware dispatch activation (tsk-46f)"
    ]
  }
}
```

### Full source unit

```text
#### Quyết định

1. **Primitive capability & catalog:** `code:implement` được đăng ký làm canonical domain-scoped capability cho coding implementation execution (`runner.capabilities["code:implement"]`).
2. **Decide-before-execute activation doctrine:** Agent chọn canonical capability từ catalog và hỏi `decide` trước khi thực hiện một execution unit (`node src/runner/dispatch.mjs decide --for code:implement [--has-live-task-access]`), chuyển dispatch identity khỏi định danh lifecycle-shaped `fgos-coding-implement`.
3. **Planning capability awareness:** Planning (`plan.md`) ghi canonical dispatch capability cho từng executable unit độc lập, coi capability boundary làm tín hiệu split, không pin executor/provider/model.
```

### Full target unit

```text
#### Quyết định

1. **Primitive capability & catalog:** `code:implement` được đăng ký làm canonical domain-scoped capability cho coding implementation execution (`runner.capabilities["code:implement"]`).
2. **Decide-before-execute activation doctrine:** Agent chọn canonical capability từ catalog và hỏi `decide` trước khi thực hiện một execution unit (`node src/runner/dispatch.mjs decide --for code:implement [--has-live-task-access]`), chuyển dispatch identity khỏi định danh lifecycle-shaped `fgos-coding-implement`.
3. **Planning capability awareness:** Planning (`plan.md`) ghi canonical dispatch capability cho từng executable unit độc lập, coi capability boundary làm tín hiệu split, không pin executor/provider/model.
```

### Full diff

```diff
No text difference.
```

## claim_01c7bf35907bf840b28be6434de1f73c

Source digest: ee4508abb8769894e0144ec5061bb2dc64fe42e096b0b23425a85bf24e9da222

Target digest: ee4508abb8769894e0144ec5061bb2dc64fe42e096b0b23425a85bf24e9da222

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-302",
  "sourceLines": [
    2965,
    2967
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Capability-aware dispatch activation (tsk-46f)",
    "Quyết định"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-161",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Capability-aware dispatch activation (tsk-46f)",
    "Quyết định"
  ],
  "nativeTargetClaimId": "claim_1c3613034623e7589e240ff94d12ae5c",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "quyết-định-13",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_01c7bf35907bf840b28be6434de1f73c",
    "sourceUnitDigest": "ee4508abb8769894e0144ec5061bb2dc64fe42e096b0b23425a85bf24e9da222",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-161",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-302 (lines 2965–2967) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-161. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "ee4508abb8769894e0144ec5061bb2dc64fe42e096b0b23425a85bf24e9da222",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Capability-aware dispatch activation (tsk-46f)",
      "Quyết định"
    ]
  }
}
```

### Full source unit

```text
1. **Primitive capability & catalog:** `code:implement` được đăng ký làm canonical domain-scoped capability cho coding implementation execution (`runner.capabilities["code:implement"]`).
2. **Decide-before-execute activation doctrine:** Agent chọn canonical capability từ catalog và hỏi `decide` trước khi thực hiện một execution unit (`node src/runner/dispatch.mjs decide --for code:implement [--has-live-task-access]`), chuyển dispatch identity khỏi định danh lifecycle-shaped `fgos-coding-implement`.
3. **Planning capability awareness:** Planning (`plan.md`) ghi canonical dispatch capability cho từng executable unit độc lập, coi capability boundary làm tín hiệu split, không pin executor/provider/model.
```

### Full target unit

```text
1. **Primitive capability & catalog:** `code:implement` được đăng ký làm canonical domain-scoped capability cho coding implementation execution (`runner.capabilities["code:implement"]`).
2. **Decide-before-execute activation doctrine:** Agent chọn canonical capability từ catalog và hỏi `decide` trước khi thực hiện một execution unit (`node src/runner/dispatch.mjs decide --for code:implement [--has-live-task-access]`), chuyển dispatch identity khỏi định danh lifecycle-shaped `fgos-coding-implement`.
3. **Planning capability awareness:** Planning (`plan.md`) ghi canonical dispatch capability cho từng executable unit độc lập, coi capability boundary làm tín hiệu split, không pin executor/provider/model.
```

### Full diff

```diff
No text difference.
```

## claim_f47c2464ff9bf0ea6de9116bdbe10a7e

Source digest: f53f0f718c2ee9e2ec07a7c380f22072bdfe1e65e21fc0fa4b60b4031234ae70

Target digest: f53f0f718c2ee9e2ec07a7c380f22072bdfe1e65e21fc0fa4b60b4031234ae70

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "agent-coordination-foundation-shared-capability-catalog-planning-awareness-cluster-docshistoryagent-coordination-foundationplanmd",
  "sourceLines": [
    2969,
    2969
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "agent-coordination-foundation-shared-capability-catalog-planning-awareness-cluster-docshistoryagent-coordination-foundationplanmd",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
  ],
  "nativeTargetClaimId": "claim_3a9f5b0f8e39f8015e10411fed64b471",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "agent-coordination-foundation-shared-capability-catalog-planning-awareness-cluster-docshistoryagent-coordination-foundationplanmd",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_f47c2464ff9bf0ea6de9116bdbe10a7e",
    "sourceUnitDigest": "f53f0f718c2ee9e2ec07a7c380f22072bdfe1e65e21fc0fa4b60b4031234ae70",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "agent-coordination-foundation-shared-capability-catalog-planning-awareness-cluster-docshistoryagent-coordination-foundationplanmd",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole heading docs/specs/runner.md#agent-coordination-foundation-shared-capability-catalog-planning-awareness-cluster-docshistoryagent-coordination-foundationplanmd (lines 2969–2969) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#agent-coordination-foundation-shared-capability-catalog-planning-awareness-cluster-docshistoryagent-coordination-foundationplanmd. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "f53f0f718c2ee9e2ec07a7c380f22072bdfe1e65e21fc0fa4b60b4031234ae70",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
    ]
  }
}
```

### Full source unit

```text
### Agent-coordination foundation — shared capability catalog & planning-awareness cluster (docs/history/agent-coordination-foundation/plan.md)
```

### Full target unit

```text
### Agent-coordination foundation — shared capability catalog & planning-awareness cluster (docs/history/agent-coordination-foundation/plan.md)
```

### Full diff

```diff
No text difference.
```

## claim_9a32cf51438ebcc2dbfcd8e4a11de03f

Source digest: e5395a5b412821882f3c67d2451a4826444e307371e31dd29d081604f3874236

Target digest: e5395a5b412821882f3c67d2451a4826444e307371e31dd29d081604f3874236

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "quyết-định-14",
  "sourceLines": [
    2971,
    2971
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Agent-coordination foundation — shared capability catalog & planning-awareness cluster (docs/history/agent-coordination-foundation/plan.md)"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "quyết-định-14",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Agent-coordination foundation — shared capability catalog & planning-awareness cluster (docs/history/agent-coordination-foundation/plan.md)"
  ],
  "nativeTargetClaimId": "claim_3f64126f381ebb58efb672496ae8ea59",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; source unit shorter than 40 characters",
  "section": "quyết-định-14",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_9a32cf51438ebcc2dbfcd8e4a11de03f",
    "sourceUnitDigest": "e5395a5b412821882f3c67d2451a4826444e307371e31dd29d081604f3874236",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "quyết-định-14",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; source unit shorter than 40 characters. Whole heading docs/specs/runner.md#quyết-định-14 (lines 2971–2971) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#quyết-định-14. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "e5395a5b412821882f3c67d2451a4826444e307371e31dd29d081604f3874236",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Agent-coordination foundation — shared capability catalog & planning-awareness cluster (docs/history/agent-coordination-foundation/plan.md)"
    ]
  }
}
```

### Full source unit

```text
#### Quyết định

1. **Một shared awareness cluster, không phải hai chỗ rời rạc.** Global planning-awareness prose (`core/skills/_shared/planning-capability-awareness.md`) sống cạnh dispatch-awareness prose đã có (`core/skills/_shared/executor-dispatch-fallback.md`), cross-reference lẫn nhau, cùng đọc một catalog dùng chung (`core/skills/_shared/capability-catalog.md`). Domain planner (coding, và bất kỳ planning surface nào khác — kể cả track Work-independent qua `fgos-plan-loop`) đặc-biệt-hóa cluster này, không định nghĩa lại routing doctrine của nó.
2. **Catalog phân biệt generic vs `domain:capability`**, không bao giờ ghi provider/model/tier/executor vào tên capability hay vào một plan. `prefer` là mối quan tâm config/execution-time (`resolveExecutorAndOverrides`), chưa từng là planning artifact.
3. **Capability execution guidance:** một capability có thể được resolve tới agent executor HOẶC MCP/tool provider HOẶC adapter khác đã đăng ký (`EXECUTOR_KINDS = ['agent', 'tool']`; ví dụ sống: `impact-analysis` → `gitnexus`, `kind: "tool"`, `via: "mcp"`). `decide` không giả định mọi capability đều agent-shaped.
4. **P2-runtime mở rộng theo tần suất quan sát được:** thêm `code:review`, `code:test`, `code:debug`, `code:refactor` vào `DEFAULT_CAPABILITY_SLOTS`, cùng khuôn mẫu không-pin-executor như `code:implement`. Không tạo capability `research` — `fgos-researching` là skill/workflow, không phải capability; research dùng capability cụ thể (ví dụ `impact-analysis`) khi thật sự cần dispatch, còn browser/web/repo-search vẫn là primitive tool call inline, không kích hoạt `decide`.
5. **`decide-before-dispatch` là thuật ngữ lịch sử**, không phải một gate độc lập song song với `decide-before-execute`. Chỉ một điểm kích hoạt: ngay trước khi một execution unit thực thi.
6. **Group cognition không đổi ranh giới đã có:** `fgos-advise` (trước đây `fgos-panel`) là surface natural-language chọn route theo loại yêu cầu, bảng kind→route nằm cùng skill tại `core/skills/fgos-advise/references/request-kinds-and-routes.md` (doc `docs/platform/agent-coordination/architecture/group-thinking-trigger-surface.md` chỉ còn trỏ tới đó); `fgos-group-thinking` vẫn là cổng pack mỏng nhận protocol id tường minh từ surface/operator trước `fgos coordination run/show`, điều phối nhiều research contribution nhưng không thay thế hay nhân bản `fgos-researching`. Preset không phải routing identity/capability mới, không định nghĩa protocol semantics, và không pin provider/model/executor/tier; per-actor override hợp lệ của team-cognition vẫn tách biệt khỏi capability annotation ở planning time.
7. **P3 static harness (read-only, không guard):** `src/report/capability-plan-lint.mjs` lint plain text theo đúng convention `- unit: ... / capability: <name>` ví dụ trong `planning-capability-awareness.md` — check syntax hợp lệ, capability đã đăng ký (hoặc đánh dấu `unresolved` rõ ràng), và không có `executor`/`provider`/`model`/`tier` pin trong CHÍNH block đó (không quét toàn file, tránh false-positive trên văn xuôi nói về provider/model như một khái niệm). Không có plan.md nào trong repo dùng convention này chưa nên module chỉ là harness sẵn sàng, không được wire vào `fgos doctor` hay bất kỳ gate tự động nào — execution-boundary guard theo P3 vẫn chờ bằng chứng dogfood non-compliance thật.
8. **P4 observability:** `logExecutorDispatch`/CLI `log` subcommand (`src/runner/dispatch/cli.mjs`) nhận thêm field optional `capability`/`mechanism`/`tier`/`fallbackReason`/`outcome` vào `executor.dispatch` event — additive, mọi caller cũ bỏ qua các field này vẫn ghi payload y hệt trước (null). `executor.dispatch` event là nơi ghi nhận kết quả và provenance của dispatch.
```

### Full target unit

```text
#### Quyết định

1. **Một shared awareness cluster, không phải hai chỗ rời rạc.** Global planning-awareness prose (`core/skills/_shared/planning-capability-awareness.md`) sống cạnh dispatch-awareness prose đã có (`core/skills/_shared/executor-dispatch-fallback.md`), cross-reference lẫn nhau, cùng đọc một catalog dùng chung (`core/skills/_shared/capability-catalog.md`). Domain planner (coding, và bất kỳ planning surface nào khác — kể cả track Work-independent qua `fgos-plan-loop`) đặc-biệt-hóa cluster này, không định nghĩa lại routing doctrine của nó.
2. **Catalog phân biệt generic vs `domain:capability`**, không bao giờ ghi provider/model/tier/executor vào tên capability hay vào một plan. `prefer` là mối quan tâm config/execution-time (`resolveExecutorAndOverrides`), chưa từng là planning artifact.
3. **Capability execution guidance:** một capability có thể được resolve tới agent executor HOẶC MCP/tool provider HOẶC adapter khác đã đăng ký (`EXECUTOR_KINDS = ['agent', 'tool']`; ví dụ sống: `impact-analysis` → `gitnexus`, `kind: "tool"`, `via: "mcp"`). `decide` không giả định mọi capability đều agent-shaped.
4. **P2-runtime mở rộng theo tần suất quan sát được:** thêm `code:review`, `code:test`, `code:debug`, `code:refactor` vào `DEFAULT_CAPABILITY_SLOTS`, cùng khuôn mẫu không-pin-executor như `code:implement`. Không tạo capability `research` — `fgos-researching` là skill/workflow, không phải capability; research dùng capability cụ thể (ví dụ `impact-analysis`) khi thật sự cần dispatch, còn browser/web/repo-search vẫn là primitive tool call inline, không kích hoạt `decide`.
5. **`decide-before-dispatch` là thuật ngữ lịch sử**, không phải một gate độc lập song song với `decide-before-execute`. Chỉ một điểm kích hoạt: ngay trước khi một execution unit thực thi.
6. **Group cognition không đổi ranh giới đã có:** `fgos-advise` (trước đây `fgos-panel`) là surface natural-language chọn route theo loại yêu cầu, bảng kind→route nằm cùng skill tại `core/skills/fgos-advise/references/request-kinds-and-routes.md` (doc `docs/platform/agent-coordination/architecture/group-thinking-trigger-surface.md` chỉ còn trỏ tới đó); `fgos-group-thinking` vẫn là cổng pack mỏng nhận protocol id tường minh từ surface/operator trước `fgos coordination run/show`, điều phối nhiều research contribution nhưng không thay thế hay nhân bản `fgos-researching`. Preset không phải routing identity/capability mới, không định nghĩa protocol semantics, và không pin provider/model/executor/tier; per-actor override hợp lệ của team-cognition vẫn tách biệt khỏi capability annotation ở planning time.
7. **P3 static harness (read-only, không guard):** `src/report/capability-plan-lint.mjs` lint plain text theo đúng convention `- unit: ... / capability: <name>` ví dụ trong `planning-capability-awareness.md` — check syntax hợp lệ, capability đã đăng ký (hoặc đánh dấu `unresolved` rõ ràng), và không có `executor`/`provider`/`model`/`tier` pin trong CHÍNH block đó (không quét toàn file, tránh false-positive trên văn xuôi nói về provider/model như một khái niệm). Không có plan.md nào trong repo dùng convention này chưa nên module chỉ là harness sẵn sàng, không được wire vào `fgos doctor` hay bất kỳ gate tự động nào — execution-boundary guard theo P3 vẫn chờ bằng chứng dogfood non-compliance thật.
8. **P4 observability:** `logExecutorDispatch`/CLI `log` subcommand (`src/runner/dispatch/cli.mjs`) nhận thêm field optional `capability`/`mechanism`/`tier`/`fallbackReason`/`outcome` vào `executor.dispatch` event — additive, mọi caller cũ bỏ qua các field này vẫn ghi payload y hệt trước (null). `executor.dispatch` event là nơi ghi nhận kết quả và provenance của dispatch.
```

### Full diff

```diff
No text difference.
```

## claim_da1e3a8deb956d81d89ec3070c143658

Source digest: 78d71093ff14ddb886031626b95e315ac2111d1475ec1f0eaa6a474f867c91a1

Target digest: 78d71093ff14ddb886031626b95e315ac2111d1475ec1f0eaa6a474f867c91a1

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-303",
  "sourceLines": [
    2973,
    2980
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Agent-coordination foundation — shared capability catalog & planning-awareness cluster (docs/history/agent-coordination-foundation/plan.md)",
    "Quyết định"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-162",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Agent-coordination foundation — shared capability catalog & planning-awareness cluster (docs/history/agent-coordination-foundation/plan.md)",
    "Quyết định"
  ],
  "nativeTargetClaimId": "claim_b03bbfc282c7bdb30fbf71dcdeca064c",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "quyết-định-14",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_da1e3a8deb956d81d89ec3070c143658",
    "sourceUnitDigest": "78d71093ff14ddb886031626b95e315ac2111d1475ec1f0eaa6a474f867c91a1",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-162",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-303 (lines 2973–2980) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-162. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "78d71093ff14ddb886031626b95e315ac2111d1475ec1f0eaa6a474f867c91a1",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Agent-coordination foundation — shared capability catalog & planning-awareness cluster (docs/history/agent-coordination-foundation/plan.md)",
      "Quyết định"
    ]
  }
}
```

### Full source unit

```text
1. **Một shared awareness cluster, không phải hai chỗ rời rạc.** Global planning-awareness prose (`core/skills/_shared/planning-capability-awareness.md`) sống cạnh dispatch-awareness prose đã có (`core/skills/_shared/executor-dispatch-fallback.md`), cross-reference lẫn nhau, cùng đọc một catalog dùng chung (`core/skills/_shared/capability-catalog.md`). Domain planner (coding, và bất kỳ planning surface nào khác — kể cả track Work-independent qua `fgos-plan-loop`) đặc-biệt-hóa cluster này, không định nghĩa lại routing doctrine của nó.
2. **Catalog phân biệt generic vs `domain:capability`**, không bao giờ ghi provider/model/tier/executor vào tên capability hay vào một plan. `prefer` là mối quan tâm config/execution-time (`resolveExecutorAndOverrides`), chưa từng là planning artifact.
3. **Capability execution guidance:** một capability có thể được resolve tới agent executor HOẶC MCP/tool provider HOẶC adapter khác đã đăng ký (`EXECUTOR_KINDS = ['agent', 'tool']`; ví dụ sống: `impact-analysis` → `gitnexus`, `kind: "tool"`, `via: "mcp"`). `decide` không giả định mọi capability đều agent-shaped.
4. **P2-runtime mở rộng theo tần suất quan sát được:** thêm `code:review`, `code:test`, `code:debug`, `code:refactor` vào `DEFAULT_CAPABILITY_SLOTS`, cùng khuôn mẫu không-pin-executor như `code:implement`. Không tạo capability `research` — `fgos-researching` là skill/workflow, không phải capability; research dùng capability cụ thể (ví dụ `impact-analysis`) khi thật sự cần dispatch, còn browser/web/repo-search vẫn là primitive tool call inline, không kích hoạt `decide`.
5. **`decide-before-dispatch` là thuật ngữ lịch sử**, không phải một gate độc lập song song với `decide-before-execute`. Chỉ một điểm kích hoạt: ngay trước khi một execution unit thực thi.
6. **Group cognition không đổi ranh giới đã có:** `fgos-advise` (trước đây `fgos-panel`) là surface natural-language chọn route theo loại yêu cầu, bảng kind→route nằm cùng skill tại `core/skills/fgos-advise/references/request-kinds-and-routes.md` (doc `docs/platform/agent-coordination/architecture/group-thinking-trigger-surface.md` chỉ còn trỏ tới đó); `fgos-group-thinking` vẫn là cổng pack mỏng nhận protocol id tường minh từ surface/operator trước `fgos coordination run/show`, điều phối nhiều research contribution nhưng không thay thế hay nhân bản `fgos-researching`. Preset không phải routing identity/capability mới, không định nghĩa protocol semantics, và không pin provider/model/executor/tier; per-actor override hợp lệ của team-cognition vẫn tách biệt khỏi capability annotation ở planning time.
7. **P3 static harness (read-only, không guard):** `src/report/capability-plan-lint.mjs` lint plain text theo đúng convention `- unit: ... / capability: <name>` ví dụ trong `planning-capability-awareness.md` — check syntax hợp lệ, capability đã đăng ký (hoặc đánh dấu `unresolved` rõ ràng), và không có `executor`/`provider`/`model`/`tier` pin trong CHÍNH block đó (không quét toàn file, tránh false-positive trên văn xuôi nói về provider/model như một khái niệm). Không có plan.md nào trong repo dùng convention này chưa nên module chỉ là harness sẵn sàng, không được wire vào `fgos doctor` hay bất kỳ gate tự động nào — execution-boundary guard theo P3 vẫn chờ bằng chứng dogfood non-compliance thật.
8. **P4 observability:** `logExecutorDispatch`/CLI `log` subcommand (`src/runner/dispatch/cli.mjs`) nhận thêm field optional `capability`/`mechanism`/`tier`/`fallbackReason`/`outcome` vào `executor.dispatch` event — additive, mọi caller cũ bỏ qua các field này vẫn ghi payload y hệt trước (null). `executor.dispatch` event là nơi ghi nhận kết quả và provenance của dispatch.
```

### Full target unit

```text
1. **Một shared awareness cluster, không phải hai chỗ rời rạc.** Global planning-awareness prose (`core/skills/_shared/planning-capability-awareness.md`) sống cạnh dispatch-awareness prose đã có (`core/skills/_shared/executor-dispatch-fallback.md`), cross-reference lẫn nhau, cùng đọc một catalog dùng chung (`core/skills/_shared/capability-catalog.md`). Domain planner (coding, và bất kỳ planning surface nào khác — kể cả track Work-independent qua `fgos-plan-loop`) đặc-biệt-hóa cluster này, không định nghĩa lại routing doctrine của nó.
2. **Catalog phân biệt generic vs `domain:capability`**, không bao giờ ghi provider/model/tier/executor vào tên capability hay vào một plan. `prefer` là mối quan tâm config/execution-time (`resolveExecutorAndOverrides`), chưa từng là planning artifact.
3. **Capability execution guidance:** một capability có thể được resolve tới agent executor HOẶC MCP/tool provider HOẶC adapter khác đã đăng ký (`EXECUTOR_KINDS = ['agent', 'tool']`; ví dụ sống: `impact-analysis` → `gitnexus`, `kind: "tool"`, `via: "mcp"`). `decide` không giả định mọi capability đều agent-shaped.
4. **P2-runtime mở rộng theo tần suất quan sát được:** thêm `code:review`, `code:test`, `code:debug`, `code:refactor` vào `DEFAULT_CAPABILITY_SLOTS`, cùng khuôn mẫu không-pin-executor như `code:implement`. Không tạo capability `research` — `fgos-researching` là skill/workflow, không phải capability; research dùng capability cụ thể (ví dụ `impact-analysis`) khi thật sự cần dispatch, còn browser/web/repo-search vẫn là primitive tool call inline, không kích hoạt `decide`.
5. **`decide-before-dispatch` là thuật ngữ lịch sử**, không phải một gate độc lập song song với `decide-before-execute`. Chỉ một điểm kích hoạt: ngay trước khi một execution unit thực thi.
6. **Group cognition không đổi ranh giới đã có:** `fgos-advise` (trước đây `fgos-panel`) là surface natural-language chọn route theo loại yêu cầu, bảng kind→route nằm cùng skill tại `core/skills/fgos-advise/references/request-kinds-and-routes.md` (doc `docs/platform/agent-coordination/architecture/group-thinking-trigger-surface.md` chỉ còn trỏ tới đó); `fgos-group-thinking` vẫn là cổng pack mỏng nhận protocol id tường minh từ surface/operator trước `fgos coordination run/show`, điều phối nhiều research contribution nhưng không thay thế hay nhân bản `fgos-researching`. Preset không phải routing identity/capability mới, không định nghĩa protocol semantics, và không pin provider/model/executor/tier; per-actor override hợp lệ của team-cognition vẫn tách biệt khỏi capability annotation ở planning time.
7. **P3 static harness (read-only, không guard):** `src/report/capability-plan-lint.mjs` lint plain text theo đúng convention `- unit: ... / capability: <name>` ví dụ trong `planning-capability-awareness.md` — check syntax hợp lệ, capability đã đăng ký (hoặc đánh dấu `unresolved` rõ ràng), và không có `executor`/`provider`/`model`/`tier` pin trong CHÍNH block đó (không quét toàn file, tránh false-positive trên văn xuôi nói về provider/model như một khái niệm). Không có plan.md nào trong repo dùng convention này chưa nên module chỉ là harness sẵn sàng, không được wire vào `fgos doctor` hay bất kỳ gate tự động nào — execution-boundary guard theo P3 vẫn chờ bằng chứng dogfood non-compliance thật.
8. **P4 observability:** `logExecutorDispatch`/CLI `log` subcommand (`src/runner/dispatch/cli.mjs`) nhận thêm field optional `capability`/`mechanism`/`tier`/`fallbackReason`/`outcome` vào `executor.dispatch` event — additive, mọi caller cũ bỏ qua các field này vẫn ghi payload y hệt trước (null). `executor.dispatch` event là nơi ghi nhận kết quả và provenance của dispatch.
```

### Full diff

```diff
No text difference.
```

## claim_fe16812176a17d9c4073dd71e177ead9

Source digest: 6a9b6ff7d029a5a396af6faf728380f673e6388b6c65fb6746894d1fd11dc43d

Target digest: 6a9b6ff7d029a5a396af6faf728380f673e6388b6c65fb6746894d1fd11dc43d

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "0035-ranh-giới-tin-cậy-của-cổng-mutation-gate-caller-trong-tiến-trình-cùng-lớp-tin-cậy-với-user-không-phải-kẻ-tấn-công",
  "sourceLines": [
    2982,
    2982
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "0035-ranh-giới-tin-cậy-của-cổng-mutation-gate-caller-trong-tiến-trình-cùng-lớp-tin-cậy-với-user-không-phải-kẻ-tấn-công",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
  ],
  "nativeTargetClaimId": "claim_ffd78a2fcb58a8e7472146694b70d1a4",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "0035-ranh-giới-tin-cậy-của-cổng-mutation-gate-caller-trong-tiến-trình-cùng-lớp-tin-cậy-với-user-không-phải-kẻ-tấn-công",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_fe16812176a17d9c4073dd71e177ead9",
    "sourceUnitDigest": "6a9b6ff7d029a5a396af6faf728380f673e6388b6c65fb6746894d1fd11dc43d",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "0035-ranh-giới-tin-cậy-của-cổng-mutation-gate-caller-trong-tiến-trình-cùng-lớp-tin-cậy-với-user-không-phải-kẻ-tấn-công",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole heading docs/specs/runner.md#0035-ranh-giới-tin-cậy-của-cổng-mutation-gate-caller-trong-tiến-trình-cùng-lớp-tin-cậy-với-user-không-phải-kẻ-tấn-công (lines 2982–2982) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#0035-ranh-giới-tin-cậy-của-cổng-mutation-gate-caller-trong-tiến-trình-cùng-lớp-tin-cậy-với-user-không-phải-kẻ-tấn-công. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "6a9b6ff7d029a5a396af6faf728380f673e6388b6c65fb6746894d1fd11dc43d",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
    ]
  }
}
```

### Full source unit

```text
### 0035 — Ranh giới tin cậy của cổng mutation-gate: caller trong-tiến-trình cùng lớp tin cậy với user, không phải kẻ tấn công
```

### Full target unit

```text
### 0035 — Ranh giới tin cậy của cổng mutation-gate: caller trong-tiến-trình cùng lớp tin cậy với user, không phải kẻ tấn công
```

### Full diff

```diff
No text difference.
```

## claim_98c9deafd1078e8774b93960ce4d5b3a

Source digest: e22e3f4f933e9b5b9551432d2b8165e1ef3839c6296a10be73f67a35a44ec4e8

Target digest: e22e3f4f933e9b5b9551432d2b8165e1ef3839c6296a10be73f67a35a44ec4e8

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "quyết-định-15",
  "sourceLines": [
    2984,
    2984
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0035 — Ranh giới tin cậy của cổng mutation-gate: caller trong-tiến-trình cùng lớp tin cậy với user, không phải kẻ tấn công"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "quyết-định-15",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0035 — Ranh giới tin cậy của cổng mutation-gate: caller trong-tiến-trình cùng lớp tin cậy với user, không phải kẻ tấn công"
  ],
  "nativeTargetClaimId": "claim_9b5296df9ed34b2fbef6328877468bfa",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; source unit shorter than 40 characters",
  "section": "quyết-định-15",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_98c9deafd1078e8774b93960ce4d5b3a",
    "sourceUnitDigest": "e22e3f4f933e9b5b9551432d2b8165e1ef3839c6296a10be73f67a35a44ec4e8",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "quyết-định-15",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; source unit shorter than 40 characters. Whole heading docs/specs/runner.md#quyết-định-15 (lines 2984–2984) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#quyết-định-15. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "e22e3f4f933e9b5b9551432d2b8165e1ef3839c6296a10be73f67a35a44ec4e8",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0035 — Ranh giới tin cậy của cổng mutation-gate: caller trong-tiến-trình cùng lớp tin cậy với user, không phải kẻ tấn công"
    ]
  }
}
```

### Full source unit

```text
#### Quyết định

Một caller có thể `import` trực tiếp module dispatch nội bộ của codebase
này (vd `buildAssignment`/`executeAssignment`, `src/runner/dispatch/**`)
và ghi file dưới `.fgos/` thuộc CÙNG lớp tin cậy với chính user đã gọi nó
— không phải một lớp kẻ tấn công bên ngoài. Ba điều khoản đã chốt từ
trước (`docs/routing-handoff-contract.md`: containment chỉ là chỉ-dẫn +
nhánh vứt-được, không phải sandbox, không chặn được một worker cố ý phá
hoại; một work item phải xuất phát từ user thật; `.fgos/config.json`'s
`runner` section là config THỰC THI ĐƯỢC — ai sửa được file này quyết
định runner spawn tiến trình gì với tham số gì), cộng với TRUSTED-CONFIG
NOTE của `src/runner/dispatch/config.mjs` và SAME-USER TRUST INVARIANT
của `src/runner/worktree.mjs`, đã xác nhận điều này từ trước khi cổng
`mutation: 'mutating'` cho một Assignment inline tồn tại — mọi worker
runner này dispatch, kể cả worker "read-only", đã luôn chạy với
`--permission-mode acceptEdits`; "read-only" chưa bao giờ là một ranh
giới cấp hệ điều hành, chỉ được chấm điểm/rollback sau khi worker chạy
xong. Do đó, cổng re-verify `result.kind`/worktree-vs-main-checkout cho
một Assignment inline mutating (`assignment-runner.mjs`'s
`assertInlineMutatingAssignmentAuthorized`) là mistake-proofing cho một
caller trong-tiến-trình cư xử đúng đắn nhưng vô ý (chặn tai nạn thực tế:
quên gắn cờ `isReadOnlyMode: false`, hoặc dispatch mutating nhầm vào main
checkout) — KHÔNG phải authentication chống lại một caller trong-tiến-
trình cố ý phá hoại, vì caller đó đã ở lớp tin cậy kiến trúc này chấp
nhận từ trước, giống hệt mọi worker khác. Phạm vi tấn công còn ý nghĩa
với cổng này là INPUT DỮ LIỆU mà thôi — request document, file
FlowDefinition/CoordinationProtocol, cờ CLI, prompt của skill — không
bao giờ là thực thi mã trong-tiến-trình hay ghi file `.fgos/` trực tiếp,
cả hai đã nằm ngoài phạm vi theo chính quyết định kiến trúc này.
```

### Full target unit

```text
#### Quyết định

Một caller có thể `import` trực tiếp module dispatch nội bộ của codebase
này (vd `buildAssignment`/`executeAssignment`, `src/runner/dispatch/**`)
và ghi file dưới `.fgos/` thuộc CÙNG lớp tin cậy với chính user đã gọi nó
— không phải một lớp kẻ tấn công bên ngoài. Ba điều khoản đã chốt từ
trước (`docs/routing-handoff-contract.md`: containment chỉ là chỉ-dẫn +
nhánh vứt-được, không phải sandbox, không chặn được một worker cố ý phá
hoại; một work item phải xuất phát từ user thật; `.fgos/config.json`'s
`runner` section là config THỰC THI ĐƯỢC — ai sửa được file này quyết
định runner spawn tiến trình gì với tham số gì), cộng với TRUSTED-CONFIG
NOTE của `src/runner/dispatch/config.mjs` và SAME-USER TRUST INVARIANT
của `src/runner/worktree.mjs`, đã xác nhận điều này từ trước khi cổng
`mutation: 'mutating'` cho một Assignment inline tồn tại — mọi worker
runner này dispatch, kể cả worker "read-only", đã luôn chạy với
`--permission-mode acceptEdits`; "read-only" chưa bao giờ là một ranh
giới cấp hệ điều hành, chỉ được chấm điểm/rollback sau khi worker chạy
xong. Do đó, cổng re-verify `result.kind`/worktree-vs-main-checkout cho
một Assignment inline mutating (`assignment-runner.mjs`'s
`assertInlineMutatingAssignmentAuthorized`) là mistake-proofing cho một
caller trong-tiến-trình cư xử đúng đắn nhưng vô ý (chặn tai nạn thực tế:
quên gắn cờ `isReadOnlyMode: false`, hoặc dispatch mutating nhầm vào main
checkout) — KHÔNG phải authentication chống lại một caller trong-tiến-
trình cố ý phá hoại, vì caller đó đã ở lớp tin cậy kiến trúc này chấp
nhận từ trước, giống hệt mọi worker khác. Phạm vi tấn công còn ý nghĩa
với cổng này là INPUT DỮ LIỆU mà thôi — request document, file
FlowDefinition/CoordinationProtocol, cờ CLI, prompt của skill — không
bao giờ là thực thi mã trong-tiến-trình hay ghi file `.fgos/` trực tiếp,
cả hai đã nằm ngoài phạm vi theo chính quyết định kiến trúc này.
```

### Full diff

```diff
No text difference.
```

## claim_6ef3646b241b71499ad9cd9d02350ca5

Source digest: ebcf8df01519f8d44425dcb8a4c5cb92ca9b5913961b2c01100d2eefd09469ea

Target digest: ebcf8df01519f8d44425dcb8a4c5cb92ca9b5913961b2c01100d2eefd09469ea

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-304",
  "sourceLines": [
    2986,
    3012
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0035 — Ranh giới tin cậy của cổng mutation-gate: caller trong-tiến-trình cùng lớp tin cậy với user, không phải kẻ tấn công",
    "Quyết định"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-163",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0035 — Ranh giới tin cậy của cổng mutation-gate: caller trong-tiến-trình cùng lớp tin cậy với user, không phải kẻ tấn công",
    "Quyết định"
  ],
  "nativeTargetClaimId": "claim_f16ce7cc231da1ab52d319d572a0d077",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "quyết-định-15",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_6ef3646b241b71499ad9cd9d02350ca5",
    "sourceUnitDigest": "ebcf8df01519f8d44425dcb8a4c5cb92ca9b5913961b2c01100d2eefd09469ea",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-163",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-304 (lines 2986–3012) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-163. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "ebcf8df01519f8d44425dcb8a4c5cb92ca9b5913961b2c01100d2eefd09469ea",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0035 — Ranh giới tin cậy của cổng mutation-gate: caller trong-tiến-trình cùng lớp tin cậy với user, không phải kẻ tấn công",
      "Quyết định"
    ]
  }
}
```

### Full source unit

```text
Một caller có thể `import` trực tiếp module dispatch nội bộ của codebase
này (vd `buildAssignment`/`executeAssignment`, `src/runner/dispatch/**`)
và ghi file dưới `.fgos/` thuộc CÙNG lớp tin cậy với chính user đã gọi nó
— không phải một lớp kẻ tấn công bên ngoài. Ba điều khoản đã chốt từ
trước (`docs/routing-handoff-contract.md`: containment chỉ là chỉ-dẫn +
nhánh vứt-được, không phải sandbox, không chặn được một worker cố ý phá
hoại; một work item phải xuất phát từ user thật; `.fgos/config.json`'s
`runner` section là config THỰC THI ĐƯỢC — ai sửa được file này quyết
định runner spawn tiến trình gì với tham số gì), cộng với TRUSTED-CONFIG
NOTE của `src/runner/dispatch/config.mjs` và SAME-USER TRUST INVARIANT
của `src/runner/worktree.mjs`, đã xác nhận điều này từ trước khi cổng
`mutation: 'mutating'` cho một Assignment inline tồn tại — mọi worker
runner này dispatch, kể cả worker "read-only", đã luôn chạy với
`--permission-mode acceptEdits`; "read-only" chưa bao giờ là một ranh
giới cấp hệ điều hành, chỉ được chấm điểm/rollback sau khi worker chạy
xong. Do đó, cổng re-verify `result.kind`/worktree-vs-main-checkout cho
một Assignment inline mutating (`assignment-runner.mjs`'s
`assertInlineMutatingAssignmentAuthorized`) là mistake-proofing cho một
caller trong-tiến-trình cư xử đúng đắn nhưng vô ý (chặn tai nạn thực tế:
quên gắn cờ `isReadOnlyMode: false`, hoặc dispatch mutating nhầm vào main
checkout) — KHÔNG phải authentication chống lại một caller trong-tiến-
trình cố ý phá hoại, vì caller đó đã ở lớp tin cậy kiến trúc này chấp
nhận từ trước, giống hệt mọi worker khác. Phạm vi tấn công còn ý nghĩa
với cổng này là INPUT DỮ LIỆU mà thôi — request document, file
FlowDefinition/CoordinationProtocol, cờ CLI, prompt của skill — không
bao giờ là thực thi mã trong-tiến-trình hay ghi file `.fgos/` trực tiếp,
cả hai đã nằm ngoài phạm vi theo chính quyết định kiến trúc này.
```

### Full target unit

```text
Một caller có thể `import` trực tiếp module dispatch nội bộ của codebase
này (vd `buildAssignment`/`executeAssignment`, `src/runner/dispatch/**`)
và ghi file dưới `.fgos/` thuộc CÙNG lớp tin cậy với chính user đã gọi nó
— không phải một lớp kẻ tấn công bên ngoài. Ba điều khoản đã chốt từ
trước (`docs/routing-handoff-contract.md`: containment chỉ là chỉ-dẫn +
nhánh vứt-được, không phải sandbox, không chặn được một worker cố ý phá
hoại; một work item phải xuất phát từ user thật; `.fgos/config.json`'s
`runner` section là config THỰC THI ĐƯỢC — ai sửa được file này quyết
định runner spawn tiến trình gì với tham số gì), cộng với TRUSTED-CONFIG
NOTE của `src/runner/dispatch/config.mjs` và SAME-USER TRUST INVARIANT
của `src/runner/worktree.mjs`, đã xác nhận điều này từ trước khi cổng
`mutation: 'mutating'` cho một Assignment inline tồn tại — mọi worker
runner này dispatch, kể cả worker "read-only", đã luôn chạy với
`--permission-mode acceptEdits`; "read-only" chưa bao giờ là một ranh
giới cấp hệ điều hành, chỉ được chấm điểm/rollback sau khi worker chạy
xong. Do đó, cổng re-verify `result.kind`/worktree-vs-main-checkout cho
một Assignment inline mutating (`assignment-runner.mjs`'s
`assertInlineMutatingAssignmentAuthorized`) là mistake-proofing cho một
caller trong-tiến-trình cư xử đúng đắn nhưng vô ý (chặn tai nạn thực tế:
quên gắn cờ `isReadOnlyMode: false`, hoặc dispatch mutating nhầm vào main
checkout) — KHÔNG phải authentication chống lại một caller trong-tiến-
trình cố ý phá hoại, vì caller đó đã ở lớp tin cậy kiến trúc này chấp
nhận từ trước, giống hệt mọi worker khác. Phạm vi tấn công còn ý nghĩa
với cổng này là INPUT DỮ LIỆU mà thôi — request document, file
FlowDefinition/CoordinationProtocol, cờ CLI, prompt của skill — không
bao giờ là thực thi mã trong-tiến-trình hay ghi file `.fgos/` trực tiếp,
cả hai đã nằm ngoài phạm vi theo chính quyết định kiến trúc này.
```

### Full diff

```diff
No text difference.
```

## claim_c1357150cb5532d69feff97882984ccd

Source digest: 1c0f8a82fce53e8ea0e4eb69a11ec8110ac6f111764803a6fcfadd3b51c3b33d

Target digest: 1c0f8a82fce53e8ea0e4eb69a11ec8110ac6f111764803a6fcfadd3b51c3b33d

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "confinement-authority-một-cửa-kiểm-soát-giam-giữ-runtime-executethroughconfinement",
  "sourceLines": [
    3014,
    3014
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "confinement-authority-một-cửa-kiểm-soát-giam-giữ-runtime-executethroughconfinement",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
  ],
  "nativeTargetClaimId": "claim_a72dbd2a75797653334b300c30ebdc09",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "confinement-authority-một-cửa-kiểm-soát-giam-giữ-runtime-executethroughconfinement",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_c1357150cb5532d69feff97882984ccd",
    "sourceUnitDigest": "1c0f8a82fce53e8ea0e4eb69a11ec8110ac6f111764803a6fcfadd3b51c3b33d",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "confinement-authority-một-cửa-kiểm-soát-giam-giữ-runtime-executethroughconfinement",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole heading docs/specs/runner.md#confinement-authority-một-cửa-kiểm-soát-giam-giữ-runtime-executethroughconfinement (lines 3014–3014) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#confinement-authority-một-cửa-kiểm-soát-giam-giữ-runtime-executethroughconfinement. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "1c0f8a82fce53e8ea0e4eb69a11ec8110ac6f111764803a6fcfadd3b51c3b33d",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
    ]
  }
}
```

### Full source unit

```text
### Confinement Authority — một cửa kiểm soát giam giữ runtime (executeThroughConfinement)

Mọi lần dispatch đưa agent ra ngoài process (bao gồm `spawnWorker`, `executeExecutorCli`, `herdr-spawn`, và `fgos coordination run`) đều bắt buộc đi qua một cửa runtime Confinement Authority duy nhất (`src/runner/dispatch/confinement/authority.mjs: executeThroughConfinement`) trước khi bất kỳ executor adapter nào được phép spawn hoặc giao việc cho agent:

1. **Một cửa runtime duy nhất:** Không adapter nào được gọi trực tiếp bởi production call site; kiểm tra AST/import (`test/architecture.test.mjs`) bảo đảm tính bất biến này.
2. **Fail-closed:** Policy `mode: "required"` từ chối trước spawn (refuse) đối với mọi điều kiện thiếu backend (`confinement-backend-missing`), backend disabled (`confinement-backend-disabled`), control không hỗ trợ (`confinement-unsupported`), probe cũ/hỏng (`confinement-probe-failed`), grant không hợp lệ (`confinement-grant-invalid`), unsatisfied resource need (`confinement-need-unsatisfied`), hoặc plan mismatch (`confinement-plan-mismatch`).
3. **Bypass pairing:** Mọi executor khai `permissionMode: "bypass"` bắt buộc phải đi kèm full confinement (`home: "private"`, `session: "isolated"`, `workspace: "own"`), được kiểm tra qua hàm dùng chung `evaluateBypassPairing` ở cả Authority lẫn `herdr-round.mjs`.
4. **Attestation bền:** Mỗi dispatch sinh một bản ghi `confinement-attestation.v1` lưu kèm kết quả dispatch, minh bạch coverage theo 7 policy control axes (`hostWrite`, `hostRead`, `networkEgress`, `process`, `home`, `session`, `workspace`), 5 attestation channel cố định (`filesystem`, `inherited-fd`, `stdio`, `host-ipc`, `network` — không phải 7 control axes ở trên), và các write grant được cấp.
5. **Strict mode:** `runner.confinement.strict` mặc định là `false` với cảnh báo sẵn sàng từ `fgos doctor` (`confinement-strict-readiness`). Khi bật `true`, mọi capability khai báo bắt buộc phải có policy hợp lệ hoặc explicit `unconfined`.
```

### Full target unit

```text
### Confinement Authority — một cửa kiểm soát giam giữ runtime (executeThroughConfinement)

Mọi lần dispatch đưa agent ra ngoài process (bao gồm `spawnWorker`, `executeExecutorCli`, `herdr-spawn`, và `fgos coordination run`) đều bắt buộc đi qua một cửa runtime Confinement Authority duy nhất (`src/runner/dispatch/confinement/authority.mjs: executeThroughConfinement`) trước khi bất kỳ executor adapter nào được phép spawn hoặc giao việc cho agent:

1. **Một cửa runtime duy nhất:** Không adapter nào được gọi trực tiếp bởi production call site; kiểm tra AST/import (`test/architecture.test.mjs`) bảo đảm tính bất biến này.
2. **Fail-closed:** Policy `mode: "required"` từ chối trước spawn (refuse) đối với mọi điều kiện thiếu backend (`confinement-backend-missing`), backend disabled (`confinement-backend-disabled`), control không hỗ trợ (`confinement-unsupported`), probe cũ/hỏng (`confinement-probe-failed`), grant không hợp lệ (`confinement-grant-invalid`), unsatisfied resource need (`confinement-need-unsatisfied`), hoặc plan mismatch (`confinement-plan-mismatch`).
3. **Bypass pairing:** Mọi executor khai `permissionMode: "bypass"` bắt buộc phải đi kèm full confinement (`home: "private"`, `session: "isolated"`, `workspace: "own"`), được kiểm tra qua hàm dùng chung `evaluateBypassPairing` ở cả Authority lẫn `herdr-round.mjs`.
4. **Attestation bền:** Mỗi dispatch sinh một bản ghi `confinement-attestation.v1` lưu kèm kết quả dispatch, minh bạch coverage theo 7 policy control axes (`hostWrite`, `hostRead`, `networkEgress`, `process`, `home`, `session`, `workspace`), 5 attestation channel cố định (`filesystem`, `inherited-fd`, `stdio`, `host-ipc`, `network` — không phải 7 control axes ở trên), và các write grant được cấp.
5. **Strict mode:** `runner.confinement.strict` mặc định là `false` với cảnh báo sẵn sàng từ `fgos doctor` (`confinement-strict-readiness`). Khi bật `true`, mọi capability khai báo bắt buộc phải có policy hợp lệ hoặc explicit `unconfined`.
```

### Full diff

```diff
No text difference.
```

## claim_a943de3a0ff8cc96f993fec6c3cc3a1e

Source digest: 270b554709f785a188e771a8a38c41e6b8193f337e1f848ef9ca23b2d37a16b5

Target digest: 270b554709f785a188e771a8a38c41e6b8193f337e1f848ef9ca23b2d37a16b5

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-305",
  "sourceLines": [
    3016,
    3016
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Confinement Authority — một cửa kiểm soát giam giữ runtime (executeThroughConfinement)"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-164",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Confinement Authority — một cửa kiểm soát giam giữ runtime (executeThroughConfinement)"
  ],
  "nativeTargetClaimId": "claim_a7f9cabb3aa6f3f8cd60ad6d675274eb",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "confinement-authority-một-cửa-kiểm-soát-giam-giữ-runtime-executethroughconfinement",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_a943de3a0ff8cc96f993fec6c3cc3a1e",
    "sourceUnitDigest": "270b554709f785a188e771a8a38c41e6b8193f337e1f848ef9ca23b2d37a16b5",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-164",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-305 (lines 3016–3016) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-164. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "270b554709f785a188e771a8a38c41e6b8193f337e1f848ef9ca23b2d37a16b5",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Confinement Authority — một cửa kiểm soát giam giữ runtime (executeThroughConfinement)"
    ]
  }
}
```

### Full source unit

```text
Mọi lần dispatch đưa agent ra ngoài process (bao gồm `spawnWorker`, `executeExecutorCli`, `herdr-spawn`, và `fgos coordination run`) đều bắt buộc đi qua một cửa runtime Confinement Authority duy nhất (`src/runner/dispatch/confinement/authority.mjs: executeThroughConfinement`) trước khi bất kỳ executor adapter nào được phép spawn hoặc giao việc cho agent:
```

### Full target unit

```text
Mọi lần dispatch đưa agent ra ngoài process (bao gồm `spawnWorker`, `executeExecutorCli`, `herdr-spawn`, và `fgos coordination run`) đều bắt buộc đi qua một cửa runtime Confinement Authority duy nhất (`src/runner/dispatch/confinement/authority.mjs: executeThroughConfinement`) trước khi bất kỳ executor adapter nào được phép spawn hoặc giao việc cho agent:
```

### Full diff

```diff
No text difference.
```

## claim_c11b67ceb76902b9ab0c1b9cab4c30c3

Source digest: 7098c3113ee40ee67a0a8ed78252a61f4ee819fe4a2a166d76bce01ffeefd030

Target digest: 7098c3113ee40ee67a0a8ed78252a61f4ee819fe4a2a166d76bce01ffeefd030

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-306",
  "sourceLines": [
    3018,
    3022
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Confinement Authority — một cửa kiểm soát giam giữ runtime (executeThroughConfinement)"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-165",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Confinement Authority — một cửa kiểm soát giam giữ runtime (executeThroughConfinement)"
  ],
  "nativeTargetClaimId": "claim_82258f053d6e83592b0ea8215f96f1cb",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "confinement-authority-một-cửa-kiểm-soát-giam-giữ-runtime-executethroughconfinement",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_c11b67ceb76902b9ab0c1b9cab4c30c3",
    "sourceUnitDigest": "7098c3113ee40ee67a0a8ed78252a61f4ee819fe4a2a166d76bce01ffeefd030",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-165",
    "claimKind": "architecture",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-306 (lines 3018–3022) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-165. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "7098c3113ee40ee67a0a8ed78252a61f4ee819fe4a2a166d76bce01ffeefd030",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Confinement Authority — một cửa kiểm soát giam giữ runtime (executeThroughConfinement)"
    ]
  }
}
```

### Full source unit

```text
1. **Một cửa runtime duy nhất:** Không adapter nào được gọi trực tiếp bởi production call site; kiểm tra AST/import (`test/architecture.test.mjs`) bảo đảm tính bất biến này.
2. **Fail-closed:** Policy `mode: "required"` từ chối trước spawn (refuse) đối với mọi điều kiện thiếu backend (`confinement-backend-missing`), backend disabled (`confinement-backend-disabled`), control không hỗ trợ (`confinement-unsupported`), probe cũ/hỏng (`confinement-probe-failed`), grant không hợp lệ (`confinement-grant-invalid`), unsatisfied resource need (`confinement-need-unsatisfied`), hoặc plan mismatch (`confinement-plan-mismatch`).
3. **Bypass pairing:** Mọi executor khai `permissionMode: "bypass"` bắt buộc phải đi kèm full confinement (`home: "private"`, `session: "isolated"`, `workspace: "own"`), được kiểm tra qua hàm dùng chung `evaluateBypassPairing` ở cả Authority lẫn `herdr-round.mjs`.
4. **Attestation bền:** Mỗi dispatch sinh một bản ghi `confinement-attestation.v1` lưu kèm kết quả dispatch, minh bạch coverage theo 7 policy control axes (`hostWrite`, `hostRead`, `networkEgress`, `process`, `home`, `session`, `workspace`), 5 attestation channel cố định (`filesystem`, `inherited-fd`, `stdio`, `host-ipc`, `network` — không phải 7 control axes ở trên), và các write grant được cấp.
5. **Strict mode:** `runner.confinement.strict` mặc định là `false` với cảnh báo sẵn sàng từ `fgos doctor` (`confinement-strict-readiness`). Khi bật `true`, mọi capability khai báo bắt buộc phải có policy hợp lệ hoặc explicit `unconfined`.
```

### Full target unit

```text
1. **Một cửa runtime duy nhất:** Không adapter nào được gọi trực tiếp bởi production call site; kiểm tra AST/import (`test/architecture.test.mjs`) bảo đảm tính bất biến này.
2. **Fail-closed:** Policy `mode: "required"` từ chối trước spawn (refuse) đối với mọi điều kiện thiếu backend (`confinement-backend-missing`), backend disabled (`confinement-backend-disabled`), control không hỗ trợ (`confinement-unsupported`), probe cũ/hỏng (`confinement-probe-failed`), grant không hợp lệ (`confinement-grant-invalid`), unsatisfied resource need (`confinement-need-unsatisfied`), hoặc plan mismatch (`confinement-plan-mismatch`).
3. **Bypass pairing:** Mọi executor khai `permissionMode: "bypass"` bắt buộc phải đi kèm full confinement (`home: "private"`, `session: "isolated"`, `workspace: "own"`), được kiểm tra qua hàm dùng chung `evaluateBypassPairing` ở cả Authority lẫn `herdr-round.mjs`.
4. **Attestation bền:** Mỗi dispatch sinh một bản ghi `confinement-attestation.v1` lưu kèm kết quả dispatch, minh bạch coverage theo 7 policy control axes (`hostWrite`, `hostRead`, `networkEgress`, `process`, `home`, `session`, `workspace`), 5 attestation channel cố định (`filesystem`, `inherited-fd`, `stdio`, `host-ipc`, `network` — không phải 7 control axes ở trên), và các write grant được cấp.
5. **Strict mode:** `runner.confinement.strict` mặc định là `false` với cảnh báo sẵn sàng từ `fgos doctor` (`confinement-strict-readiness`). Khi bật `true`, mọi capability khai báo bắt buộc phải có policy hợp lệ hoặc explicit `unconfined`.
```

### Full diff

```diff
No text difference.
```

## claim_fc981ac524ca57bc04c4ead8ea3161fe

Source digest: dbeaeb4c91c0c1aa4cc786077744b445ebe85a135036ce8325e42897dbeeca6e

Target digest: dbeaeb4c91c0c1aa4cc786077744b445ebe85a135036ce8325e42897dbeeca6e

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "đổi-sang-atomic-cas-commit-tree-cho-merge-gate-d-adr0042-atomic-cas-commit-tree-cho-merge-gate",
  "sourceLines": [
    3024,
    3024
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "đổi-sang-atomic-cas-commit-tree-cho-merge-gate-d-adr0042-atomic-cas-commit-tree-cho-merge-gate",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
  ],
  "nativeTargetClaimId": "claim_308e2b74472de895949f48be7e316062",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "đổi-sang-atomic-cas-commit-tree-cho-merge-gate-d-adr0042-atomic-cas-commit-tree-cho-merge-gate",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_fc981ac524ca57bc04c4ead8ea3161fe",
    "sourceUnitDigest": "dbeaeb4c91c0c1aa4cc786077744b445ebe85a135036ce8325e42897dbeeca6e",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "đổi-sang-atomic-cas-commit-tree-cho-merge-gate-d-adr0042-atomic-cas-commit-tree-cho-merge-gate",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole heading docs/specs/runner.md#đổi-sang-atomic-cas-commit-tree-cho-merge-gate-d-adr0042-atomic-cas-commit-tree-cho-merge-gate (lines 3024–3024) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#đổi-sang-atomic-cas-commit-tree-cho-merge-gate-d-adr0042-atomic-cas-commit-tree-cho-merge-gate. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "dbeaeb4c91c0c1aa4cc786077744b445ebe85a135036ce8325e42897dbeeca6e",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
    ]
  }
}
```

### Full source unit

```text
### Đổi sang atomic CAS commit tree cho Merge Gate (D-ADR0042 (atomic CAS commit tree cho Merge Gate))

- **Context**: \`mergeRunnerItem\` cũ sử dụng \`git merge --no-commit\` trực tiếp trên main checkout để kiểm tra và sau đó \`git commit\`. Điều này gây rủi ro làm bẩn working tree của main checkout và dễ lỗi nếu có tiến trình khác can thiệp.
- **Decision**: Thay thế bằng cơ chế Git CAS (Compare-And-Swap) kết hợp isolated worktree cho luồng \`root-into-main\`. Sử dụng \`git worktree add --detach\` để tạo một worktree ẩn danh trỏ tới tip của trunk. Quá trình patch (\`git merge --no-commit\`) và test suite chạy hoàn toàn trong isolated worktree này. Nếu test pass, dùng \`git write-tree\` lấy tree, \`git commit-tree\` tạo commit với hai parent, và cập nhật ref atomically qua \`git update-ref\`.
- **Consequences**:
  - Merge + verify không chạm main checkout. Nhưng khi main checkout đang checkout chính trunk, `update-ref` dời nhánh đó rồi `read-tree -m -u HEAD` đồng bộ working tree — nên cổng clean-tree theo own-file-set (tsk-598: committed diff + `footprint`, bỏ qua `.fgos/` và path không liên quan) vẫn chạy trước merge; path trong own-file-set đang dirty → từ chối (exit 4, `not clean`), không dời ref. Lần kiểm đó chạy TRƯỚC worktree CAS mở ra (merge+verify có thể mất vài phút), nên kiểm lại lần hai dưới `main-checkout.lock`, ngay trước `update-ref` (`landCasMergeUnderLock`, cùng `ownFileSet`) — dính bẩn ở lần hai → `blocked` với lý do `main-checkout-dirty-mid-merge` (nằm trong tập lý do `catchup` chấp nhận thử lại, cùng hình dạng `lock-lost-mid-merge`), không `update-ref`.
  - Khóa (lock) thời gian dài không còn cần thiết cho việc thao tác file, chỉ cần cho việc update-ref (nhưng update-ref đã có cơ chế CAS an toàn).
  - Lỗi test hoặc timeout tự động dọn dẹp worktree mà không rò rỉ state vào nhánh chính.
```

### Full target unit

```text
### Đổi sang atomic CAS commit tree cho Merge Gate (D-ADR0042 (atomic CAS commit tree cho Merge Gate))

- **Context**: \`mergeRunnerItem\` cũ sử dụng \`git merge --no-commit\` trực tiếp trên main checkout để kiểm tra và sau đó \`git commit\`. Điều này gây rủi ro làm bẩn working tree của main checkout và dễ lỗi nếu có tiến trình khác can thiệp.
- **Decision**: Thay thế bằng cơ chế Git CAS (Compare-And-Swap) kết hợp isolated worktree cho luồng \`root-into-main\`. Sử dụng \`git worktree add --detach\` để tạo một worktree ẩn danh trỏ tới tip của trunk. Quá trình patch (\`git merge --no-commit\`) và test suite chạy hoàn toàn trong isolated worktree này. Nếu test pass, dùng \`git write-tree\` lấy tree, \`git commit-tree\` tạo commit với hai parent, và cập nhật ref atomically qua \`git update-ref\`.
- **Consequences**:
  - Merge + verify không chạm main checkout. Nhưng khi main checkout đang checkout chính trunk, `update-ref` dời nhánh đó rồi `read-tree -m -u HEAD` đồng bộ working tree — nên cổng clean-tree theo own-file-set (tsk-598: committed diff + `footprint`, bỏ qua `.fgos/` và path không liên quan) vẫn chạy trước merge; path trong own-file-set đang dirty → từ chối (exit 4, `not clean`), không dời ref. Lần kiểm đó chạy TRƯỚC worktree CAS mở ra (merge+verify có thể mất vài phút), nên kiểm lại lần hai dưới `main-checkout.lock`, ngay trước `update-ref` (`landCasMergeUnderLock`, cùng `ownFileSet`) — dính bẩn ở lần hai → `blocked` với lý do `main-checkout-dirty-mid-merge` (nằm trong tập lý do `catchup` chấp nhận thử lại, cùng hình dạng `lock-lost-mid-merge`), không `update-ref`.
  - Khóa (lock) thời gian dài không còn cần thiết cho việc thao tác file, chỉ cần cho việc update-ref (nhưng update-ref đã có cơ chế CAS an toàn).
  - Lỗi test hoặc timeout tự động dọn dẹp worktree mà không rò rỉ state vào nhánh chính.
```

### Full diff

```diff
No text difference.
```

## claim_d924302fcdb23d9601a6054fb6957ec0

Source digest: 450553919592889f5e80d08bda88ef06f79f36bcb330393e417cda65ac98ce32

Target digest: 450553919592889f5e80d08bda88ef06f79f36bcb330393e417cda65ac98ce32

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-307",
  "sourceLines": [
    3026,
    3031
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Đổi sang atomic CAS commit tree cho Merge Gate (D-ADR0042 (atomic CAS commit tree cho Merge Gate))"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-166",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Đổi sang atomic CAS commit tree cho Merge Gate (D-ADR0042 (atomic CAS commit tree cho Merge Gate))"
  ],
  "nativeTargetClaimId": "claim_465e9dd89829bb10f2ed03181e026bb3",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "đổi-sang-atomic-cas-commit-tree-cho-merge-gate-d-adr0042-atomic-cas-commit-tree-cho-merge-gate",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_d924302fcdb23d9601a6054fb6957ec0",
    "sourceUnitDigest": "450553919592889f5e80d08bda88ef06f79f36bcb330393e417cda65ac98ce32",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-166",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-307 (lines 3026–3031) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-166. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "450553919592889f5e80d08bda88ef06f79f36bcb330393e417cda65ac98ce32",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Đổi sang atomic CAS commit tree cho Merge Gate (D-ADR0042 (atomic CAS commit tree cho Merge Gate))"
    ]
  }
}
```

### Full source unit

```text
- **Context**: \`mergeRunnerItem\` cũ sử dụng \`git merge --no-commit\` trực tiếp trên main checkout để kiểm tra và sau đó \`git commit\`. Điều này gây rủi ro làm bẩn working tree của main checkout và dễ lỗi nếu có tiến trình khác can thiệp.
- **Decision**: Thay thế bằng cơ chế Git CAS (Compare-And-Swap) kết hợp isolated worktree cho luồng \`root-into-main\`. Sử dụng \`git worktree add --detach\` để tạo một worktree ẩn danh trỏ tới tip của trunk. Quá trình patch (\`git merge --no-commit\`) và test suite chạy hoàn toàn trong isolated worktree này. Nếu test pass, dùng \`git write-tree\` lấy tree, \`git commit-tree\` tạo commit với hai parent, và cập nhật ref atomically qua \`git update-ref\`.
- **Consequences**:
  - Merge + verify không chạm main checkout. Nhưng khi main checkout đang checkout chính trunk, `update-ref` dời nhánh đó rồi `read-tree -m -u HEAD` đồng bộ working tree — nên cổng clean-tree theo own-file-set (tsk-598: committed diff + `footprint`, bỏ qua `.fgos/` và path không liên quan) vẫn chạy trước merge; path trong own-file-set đang dirty → từ chối (exit 4, `not clean`), không dời ref. Lần kiểm đó chạy TRƯỚC worktree CAS mở ra (merge+verify có thể mất vài phút), nên kiểm lại lần hai dưới `main-checkout.lock`, ngay trước `update-ref` (`landCasMergeUnderLock`, cùng `ownFileSet`) — dính bẩn ở lần hai → `blocked` với lý do `main-checkout-dirty-mid-merge` (nằm trong tập lý do `catchup` chấp nhận thử lại, cùng hình dạng `lock-lost-mid-merge`), không `update-ref`.
  - Khóa (lock) thời gian dài không còn cần thiết cho việc thao tác file, chỉ cần cho việc update-ref (nhưng update-ref đã có cơ chế CAS an toàn).
  - Lỗi test hoặc timeout tự động dọn dẹp worktree mà không rò rỉ state vào nhánh chính.
```

### Full target unit

```text
- **Context**: \`mergeRunnerItem\` cũ sử dụng \`git merge --no-commit\` trực tiếp trên main checkout để kiểm tra và sau đó \`git commit\`. Điều này gây rủi ro làm bẩn working tree của main checkout và dễ lỗi nếu có tiến trình khác can thiệp.
- **Decision**: Thay thế bằng cơ chế Git CAS (Compare-And-Swap) kết hợp isolated worktree cho luồng \`root-into-main\`. Sử dụng \`git worktree add --detach\` để tạo một worktree ẩn danh trỏ tới tip của trunk. Quá trình patch (\`git merge --no-commit\`) và test suite chạy hoàn toàn trong isolated worktree này. Nếu test pass, dùng \`git write-tree\` lấy tree, \`git commit-tree\` tạo commit với hai parent, và cập nhật ref atomically qua \`git update-ref\`.
- **Consequences**:
  - Merge + verify không chạm main checkout. Nhưng khi main checkout đang checkout chính trunk, `update-ref` dời nhánh đó rồi `read-tree -m -u HEAD` đồng bộ working tree — nên cổng clean-tree theo own-file-set (tsk-598: committed diff + `footprint`, bỏ qua `.fgos/` và path không liên quan) vẫn chạy trước merge; path trong own-file-set đang dirty → từ chối (exit 4, `not clean`), không dời ref. Lần kiểm đó chạy TRƯỚC worktree CAS mở ra (merge+verify có thể mất vài phút), nên kiểm lại lần hai dưới `main-checkout.lock`, ngay trước `update-ref` (`landCasMergeUnderLock`, cùng `ownFileSet`) — dính bẩn ở lần hai → `blocked` với lý do `main-checkout-dirty-mid-merge` (nằm trong tập lý do `catchup` chấp nhận thử lại, cùng hình dạng `lock-lost-mid-merge`), không `update-ref`.
  - Khóa (lock) thời gian dài không còn cần thiết cho việc thao tác file, chỉ cần cho việc update-ref (nhưng update-ref đã có cơ chế CAS an toàn).
  - Lỗi test hoặc timeout tự động dọn dẹp worktree mà không rò rỉ state vào nhánh chính.
```

### Full diff

```diff
No text difference.
```

## claim_e79647f02e8a3507c31e2e57c75b929c

Source digest: 0c685ba69f0bc771bdafc5184a8e95fd810a9363471c286072076c9c4798ae37

Target digest: 0c685ba69f0bc771bdafc5184a8e95fd810a9363471c286072076c9c4798ae37

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "0043-vocabulary-bound-invocation-supervisor-vs-detached-run-supervisor",
  "sourceLines": [
    3033,
    3033
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "0043-vocabulary-bound-invocation-supervisor-vs-detached-run-supervisor",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
  ],
  "nativeTargetClaimId": "claim_8908e6428ae53a95a3f14c921bae5f35",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "0043-vocabulary-bound-invocation-supervisor-vs-detached-run-supervisor",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_e79647f02e8a3507c31e2e57c75b929c",
    "sourceUnitDigest": "0c685ba69f0bc771bdafc5184a8e95fd810a9363471c286072076c9c4798ae37",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "0043-vocabulary-bound-invocation-supervisor-vs-detached-run-supervisor",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole heading docs/specs/runner.md#0043-vocabulary-bound-invocation-supervisor-vs-detached-run-supervisor (lines 3033–3033) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#0043-vocabulary-bound-invocation-supervisor-vs-detached-run-supervisor. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "0c685ba69f0bc771bdafc5184a8e95fd810a9363471c286072076c9c4798ae37",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
    ]
  }
}
```

### Full source unit

```text
### 0043 — Vocabulary: bound-invocation-supervisor vs detached-run-supervisor
```

### Full target unit

```text
### 0043 — Vocabulary: bound-invocation-supervisor vs detached-run-supervisor
```

### Full diff

```diff
No text difference.
```

## claim_cdf96a5e899850a9fdb3343d9d6c4fcd

Source digest: c0bbf53368466ef1474fbff89514a960821b2902802db0104386c556b460a32c

Target digest: c0bbf53368466ef1474fbff89514a960821b2902802db0104386c556b460a32c

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "bối-cảnh-13",
  "sourceLines": [
    3035,
    3035
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0043 — Vocabulary: bound-invocation-supervisor vs detached-run-supervisor"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "bối-cảnh-13",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0043 — Vocabulary: bound-invocation-supervisor vs detached-run-supervisor"
  ],
  "nativeTargetClaimId": "claim_6ea68d84676e834064c0d8dbd08e5224",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; source unit shorter than 40 characters",
  "section": "bối-cảnh-13",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_cdf96a5e899850a9fdb3343d9d6c4fcd",
    "sourceUnitDigest": "c0bbf53368466ef1474fbff89514a960821b2902802db0104386c556b460a32c",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "bối-cảnh-13",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; source unit shorter than 40 characters. Whole heading docs/specs/runner.md#bối-cảnh-13 (lines 3035–3035) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#bối-cảnh-13. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "c0bbf53368466ef1474fbff89514a960821b2902802db0104386c556b460a32c",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0043 — Vocabulary: bound-invocation-supervisor vs detached-run-supervisor"
    ]
  }
}
```

### Full source unit

```text
#### Bối cảnh

Phase 8's C4 investigation (reading `invocation_service.rs`,
`operation_provider_router.rs`, `providers/external_process/{supervisor,
adapter,registry}.rs`, `apps/fgos/src/legacy_exec.rs`, and
`docs/platform/host-invocation-routing/architecture/invocation-kernel.md`)
found `supervisor.rs` (Rust, ~855 lines) and `cli-spawn-supervisor.mjs`
(Node, ~1208 lines) look like duplicate "supervisor" implementations —
both do bounded capture, deadlines, crash mapping, cancellation grace — but
they answer different questions. `supervisor.rs` has zero detach/setsid/
process-group logic anywhere (confirmed via source) and short default
deadlines (2-5s): a short RPC-shaped call bound to ONE invocation's own
lifetime, never expected to outlive its caller. `cli-spawn-supervisor.mjs`
deliberately detaches (`startSupervisorProcess`'s own detached spawn,
PGID-based kill, immutable receipt publication) so a long agent/executor
run survives the crash of whatever dispatched it. Zero live conflict
today: the Rust mechanism has zero current consumers (`command-routes.json`
confirms `dispatch` is 100% `legacy-cli`; only 2 `native` routes exist,
neither uses it).
```

### Full target unit

```text
#### Bối cảnh

Phase 8's C4 investigation (reading `invocation_service.rs`,
`operation_provider_router.rs`, `providers/external_process/{supervisor,
adapter,registry}.rs`, `apps/fgos/src/legacy_exec.rs`, and
`docs/platform/host-invocation-routing/architecture/invocation-kernel.md`)
found `supervisor.rs` (Rust, ~855 lines) and `cli-spawn-supervisor.mjs`
(Node, ~1208 lines) look like duplicate "supervisor" implementations —
both do bounded capture, deadlines, crash mapping, cancellation grace — but
they answer different questions. `supervisor.rs` has zero detach/setsid/
process-group logic anywhere (confirmed via source) and short default
deadlines (2-5s): a short RPC-shaped call bound to ONE invocation's own
lifetime, never expected to outlive its caller. `cli-spawn-supervisor.mjs`
deliberately detaches (`startSupervisorProcess`'s own detached spawn,
PGID-based kill, immutable receipt publication) so a long agent/executor
run survives the crash of whatever dispatched it. Zero live conflict
today: the Rust mechanism has zero current consumers (`command-routes.json`
confirms `dispatch` is 100% `legacy-cli`; only 2 `native` routes exist,
neither uses it).
```

### Full diff

```diff
No text difference.
```

## claim_3f61f80f487a94e1e4bb0963bf6348b5

Source digest: b348235f25df183af98143ce5220b4b9731b2e44dd4578dcd41d9432a5461c48

Target digest: b348235f25df183af98143ce5220b4b9731b2e44dd4578dcd41d9432a5461c48

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-308",
  "sourceLines": [
    3037,
    3053
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0043 — Vocabulary: bound-invocation-supervisor vs detached-run-supervisor",
    "Bối cảnh"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-167",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0043 — Vocabulary: bound-invocation-supervisor vs detached-run-supervisor",
    "Bối cảnh"
  ],
  "nativeTargetClaimId": "claim_5b6bf7cc085d6f62bc3487b97be66647",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "bối-cảnh-13",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_3f61f80f487a94e1e4bb0963bf6348b5",
    "sourceUnitDigest": "b348235f25df183af98143ce5220b4b9731b2e44dd4578dcd41d9432a5461c48",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-167",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-308 (lines 3037–3053) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-167. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "b348235f25df183af98143ce5220b4b9731b2e44dd4578dcd41d9432a5461c48",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0043 — Vocabulary: bound-invocation-supervisor vs detached-run-supervisor",
      "Bối cảnh"
    ]
  }
}
```

### Full source unit

```text
Phase 8's C4 investigation (reading `invocation_service.rs`,
`operation_provider_router.rs`, `providers/external_process/{supervisor,
adapter,registry}.rs`, `apps/fgos/src/legacy_exec.rs`, and
`docs/platform/host-invocation-routing/architecture/invocation-kernel.md`)
found `supervisor.rs` (Rust, ~855 lines) and `cli-spawn-supervisor.mjs`
(Node, ~1208 lines) look like duplicate "supervisor" implementations —
both do bounded capture, deadlines, crash mapping, cancellation grace — but
they answer different questions. `supervisor.rs` has zero detach/setsid/
process-group logic anywhere (confirmed via source) and short default
deadlines (2-5s): a short RPC-shaped call bound to ONE invocation's own
lifetime, never expected to outlive its caller. `cli-spawn-supervisor.mjs`
deliberately detaches (`startSupervisorProcess`'s own detached spawn,
PGID-based kill, immutable receipt publication) so a long agent/executor
run survives the crash of whatever dispatched it. Zero live conflict
today: the Rust mechanism has zero current consumers (`command-routes.json`
confirms `dispatch` is 100% `legacy-cli`; only 2 `native` routes exist,
neither uses it).
```

### Full target unit

```text
Phase 8's C4 investigation (reading `invocation_service.rs`,
`operation_provider_router.rs`, `providers/external_process/{supervisor,
adapter,registry}.rs`, `apps/fgos/src/legacy_exec.rs`, and
`docs/platform/host-invocation-routing/architecture/invocation-kernel.md`)
found `supervisor.rs` (Rust, ~855 lines) and `cli-spawn-supervisor.mjs`
(Node, ~1208 lines) look like duplicate "supervisor" implementations —
both do bounded capture, deadlines, crash mapping, cancellation grace — but
they answer different questions. `supervisor.rs` has zero detach/setsid/
process-group logic anywhere (confirmed via source) and short default
deadlines (2-5s): a short RPC-shaped call bound to ONE invocation's own
lifetime, never expected to outlive its caller. `cli-spawn-supervisor.mjs`
deliberately detaches (`startSupervisorProcess`'s own detached spawn,
PGID-based kill, immutable receipt publication) so a long agent/executor
run survives the crash of whatever dispatched it. Zero live conflict
today: the Rust mechanism has zero current consumers (`command-routes.json`
confirms `dispatch` is 100% `legacy-cli`; only 2 `native` routes exist,
neither uses it).
```

### Full diff

```diff
No text difference.
```

## claim_bd37b242f88115e67cb9870bf1741376

Source digest: 435237be21da6e98f5e57f152e12c65d5d01a3f36040305b225d95a2eda0ab1a

Target digest: 435237be21da6e98f5e57f152e12c65d5d01a3f36040305b225d95a2eda0ab1a

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "quyết-định-16",
  "sourceLines": [
    3055,
    3055
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0043 — Vocabulary: bound-invocation-supervisor vs detached-run-supervisor"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "quyết-định-16",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0043 — Vocabulary: bound-invocation-supervisor vs detached-run-supervisor"
  ],
  "nativeTargetClaimId": "claim_04674b3f17b772aecc910a6416fc88e9",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; source unit shorter than 40 characters",
  "section": "quyết-định-16",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_bd37b242f88115e67cb9870bf1741376",
    "sourceUnitDigest": "435237be21da6e98f5e57f152e12c65d5d01a3f36040305b225d95a2eda0ab1a",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "quyết-định-16",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; source unit shorter than 40 characters. Whole heading docs/specs/runner.md#quyết-định-16 (lines 3055–3055) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#quyết-định-16. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "435237be21da6e98f5e57f152e12c65d5d01a3f36040305b225d95a2eda0ab1a",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0043 — Vocabulary: bound-invocation-supervisor vs detached-run-supervisor"
    ]
  }
}
```

### Full source unit

```text
#### Quyết định

Name the two roles by the load-bearing axis — lifecycle/detachment — not
current content label ("agent" vs "RPC"), so the names stay correct if
either mechanism's real use case shifts later:

- **`detached-run-supervisor`** — `cli-spawn-supervisor.mjs`'s role: a
  supervised run deliberately detached, must survive the crash of whatever
  dispatched it.
- **`bound-invocation-supervisor`** — `supervisor.rs`'s role (renamed
  `BoundInvocationSupervisor`, module `providers::external_process::
  bound_invocation_supervisor`): a supervised external-process call bound
  to one invocation's own lifetime, never detached.

Renamed both implementations to match: `cli-spawn-supervisor.mjs`'s
adapter-specific exports (Node side, unit P8a) and `supervisor.rs`/
`ExternalProcessSupervisor` → `bound_invocation_supervisor.rs`/
`BoundInvocationSupervisor` (Rust side, unit P8b, this record).
```

### Full target unit

```text
#### Quyết định

Name the two roles by the load-bearing axis — lifecycle/detachment — not
current content label ("agent" vs "RPC"), so the names stay correct if
either mechanism's real use case shifts later:

- **`detached-run-supervisor`** — `cli-spawn-supervisor.mjs`'s role: a
  supervised run deliberately detached, must survive the crash of whatever
  dispatched it.
- **`bound-invocation-supervisor`** — `supervisor.rs`'s role (renamed
  `BoundInvocationSupervisor`, module `providers::external_process::
  bound_invocation_supervisor`): a supervised external-process call bound
  to one invocation's own lifetime, never detached.

Renamed both implementations to match: `cli-spawn-supervisor.mjs`'s
adapter-specific exports (Node side, unit P8a) and `supervisor.rs`/
`ExternalProcessSupervisor` → `bound_invocation_supervisor.rs`/
`BoundInvocationSupervisor` (Rust side, unit P8b, this record).
```

### Full diff

```diff
No text difference.
```

## claim_755111c889e95014f99c54a41a112ca3

Source digest: 58e740e33a9a769ae192744c810c87b42186d4cdf7bd00141de737534efe7c0c

Target digest: 58e740e33a9a769ae192744c810c87b42186d4cdf7bd00141de737534efe7c0c

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-309",
  "sourceLines": [
    3057,
    3059
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0043 — Vocabulary: bound-invocation-supervisor vs detached-run-supervisor",
    "Quyết định"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-168",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0043 — Vocabulary: bound-invocation-supervisor vs detached-run-supervisor",
    "Quyết định"
  ],
  "nativeTargetClaimId": "claim_be3a45785f38c58722a4d94945fc8f67",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "quyết-định-16",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_755111c889e95014f99c54a41a112ca3",
    "sourceUnitDigest": "58e740e33a9a769ae192744c810c87b42186d4cdf7bd00141de737534efe7c0c",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-168",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-309 (lines 3057–3059) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-168. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "58e740e33a9a769ae192744c810c87b42186d4cdf7bd00141de737534efe7c0c",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0043 — Vocabulary: bound-invocation-supervisor vs detached-run-supervisor",
      "Quyết định"
    ]
  }
}
```

### Full source unit

```text
Name the two roles by the load-bearing axis — lifecycle/detachment — not
current content label ("agent" vs "RPC"), so the names stay correct if
either mechanism's real use case shifts later:
```

### Full target unit

```text
Name the two roles by the load-bearing axis — lifecycle/detachment — not
current content label ("agent" vs "RPC"), so the names stay correct if
either mechanism's real use case shifts later:
```

### Full diff

```diff
No text difference.
```

## claim_dc3c8fc66a4e43d514339862bcc10846

Source digest: 28a2888fab360eae6e8483223120b6b767c32cddd3194d81541cc478bdc06af9

Target digest: 28a2888fab360eae6e8483223120b6b767c32cddd3194d81541cc478bdc06af9

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-310",
  "sourceLines": [
    3061,
    3067
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0043 — Vocabulary: bound-invocation-supervisor vs detached-run-supervisor",
    "Quyết định"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-169",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0043 — Vocabulary: bound-invocation-supervisor vs detached-run-supervisor",
    "Quyết định"
  ],
  "nativeTargetClaimId": "claim_3b3c93ef9ade7fd95faf8fda86781de0",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "quyết-định-16",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_dc3c8fc66a4e43d514339862bcc10846",
    "sourceUnitDigest": "28a2888fab360eae6e8483223120b6b767c32cddd3194d81541cc478bdc06af9",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-169",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-310 (lines 3061–3067) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-169. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "28a2888fab360eae6e8483223120b6b767c32cddd3194d81541cc478bdc06af9",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0043 — Vocabulary: bound-invocation-supervisor vs detached-run-supervisor",
      "Quyết định"
    ]
  }
}
```

### Full source unit

```text
- **`detached-run-supervisor`** — `cli-spawn-supervisor.mjs`'s role: a
  supervised run deliberately detached, must survive the crash of whatever
  dispatched it.
- **`bound-invocation-supervisor`** — `supervisor.rs`'s role (renamed
  `BoundInvocationSupervisor`, module `providers::external_process::
  bound_invocation_supervisor`): a supervised external-process call bound
  to one invocation's own lifetime, never detached.
```

### Full target unit

```text
- **`detached-run-supervisor`** — `cli-spawn-supervisor.mjs`'s role: a
  supervised run deliberately detached, must survive the crash of whatever
  dispatched it.
- **`bound-invocation-supervisor`** — `supervisor.rs`'s role (renamed
  `BoundInvocationSupervisor`, module `providers::external_process::
  bound_invocation_supervisor`): a supervised external-process call bound
  to one invocation's own lifetime, never detached.
```

### Full diff

```diff
No text difference.
```

## claim_0a282d6aafb1cee14928a469d20dbcf2

Source digest: 44dac5df762c5f87cc45d20804acdd3feb26cc918d6555421c131c555aea4fd4

Target digest: 44dac5df762c5f87cc45d20804acdd3feb26cc918d6555421c131c555aea4fd4

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-311",
  "sourceLines": [
    3069,
    3072
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0043 — Vocabulary: bound-invocation-supervisor vs detached-run-supervisor",
    "Quyết định"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-170",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0043 — Vocabulary: bound-invocation-supervisor vs detached-run-supervisor",
    "Quyết định"
  ],
  "nativeTargetClaimId": "claim_1c4b14fe69637bac33a23fea713c9616",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "quyết-định-16",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_0a282d6aafb1cee14928a469d20dbcf2",
    "sourceUnitDigest": "44dac5df762c5f87cc45d20804acdd3feb26cc918d6555421c131c555aea4fd4",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-170",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-311 (lines 3069–3072) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-170. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "44dac5df762c5f87cc45d20804acdd3feb26cc918d6555421c131c555aea4fd4",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0043 — Vocabulary: bound-invocation-supervisor vs detached-run-supervisor",
      "Quyết định"
    ]
  }
}
```

### Full source unit

```text
Renamed both implementations to match: `cli-spawn-supervisor.mjs`'s
adapter-specific exports (Node side, unit P8a) and `supervisor.rs`/
`ExternalProcessSupervisor` → `bound_invocation_supervisor.rs`/
`BoundInvocationSupervisor` (Rust side, unit P8b, this record).
```

### Full target unit

```text
Renamed both implementations to match: `cli-spawn-supervisor.mjs`'s
adapter-specific exports (Node side, unit P8a) and `supervisor.rs`/
`ExternalProcessSupervisor` → `bound_invocation_supervisor.rs`/
`BoundInvocationSupervisor` (Rust side, unit P8b, this record).
```

### Full diff

```diff
No text difference.
```

## claim_b34c6fba42019062dea0b1058540985e

Source digest: eede37c34599d00d26acf3126dcc0dd2f0ef3db8aaaf8b372af48043b41531b1

Target digest: eede37c34599d00d26acf3126dcc0dd2f0ef3db8aaaf8b372af48043b41531b1

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "hệ-quả-11",
  "sourceLines": [
    3074,
    3074
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0043 — Vocabulary: bound-invocation-supervisor vs detached-run-supervisor"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "hệ-quả-11",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0043 — Vocabulary: bound-invocation-supervisor vs detached-run-supervisor"
  ],
  "nativeTargetClaimId": "claim_ba2ac784d0f7b1054cada469e7d0fb08",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; source unit shorter than 40 characters",
  "section": "hệ-quả-11",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_b34c6fba42019062dea0b1058540985e",
    "sourceUnitDigest": "eede37c34599d00d26acf3126dcc0dd2f0ef3db8aaaf8b372af48043b41531b1",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "hệ-quả-11",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; source unit shorter than 40 characters. Whole heading docs/specs/runner.md#hệ-quả-11 (lines 3074–3074) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#hệ-quả-11. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "eede37c34599d00d26acf3126dcc0dd2f0ef3db8aaaf8b372af48043b41531b1",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0043 — Vocabulary: bound-invocation-supervisor vs detached-run-supervisor"
    ]
  }
}
```

### Full source unit

```text
#### Hệ quả

- A future reader comparing the two "supervisor" files judges them by
  lifecycle ownership, not by guessing from a shared generic name.
- `ExternalProcessConfig`/`Request`/`Outcome` and
  `ExternalProcessProviderAdapter` keep their current names — they name the
  wire protocol and the `OperationProvider` adapter, not the supervisor
  role, so this rename doesn't touch them.
- The day any operation (including `dispatch`) is routed `native` instead
  of `legacy-cli`, `bound-invocation-supervisor` becomes a real second
  invocation mechanism alongside `detached-run-supervisor` — this record is
  the ownership boundary written down before that happens, not after.
```

### Full target unit

```text
#### Hệ quả

- A future reader comparing the two "supervisor" files judges them by
  lifecycle ownership, not by guessing from a shared generic name.
- `ExternalProcessConfig`/`Request`/`Outcome` and
  `ExternalProcessProviderAdapter` keep their current names — they name the
  wire protocol and the `OperationProvider` adapter, not the supervisor
  role, so this rename doesn't touch them.
- The day any operation (including `dispatch`) is routed `native` instead
  of `legacy-cli`, `bound-invocation-supervisor` becomes a real second
  invocation mechanism alongside `detached-run-supervisor` — this record is
  the ownership boundary written down before that happens, not after.
```

### Full diff

```diff
No text difference.
```

## claim_44294c754f97f771769d49ebd6a0614d

Source digest: b65eccb0bfb36f2ca3b4aea4c026dfaaaa60367e4b4e0ee0b082bf19ad74d5eb

Target digest: b65eccb0bfb36f2ca3b4aea4c026dfaaaa60367e4b4e0ee0b082bf19ad74d5eb

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-312",
  "sourceLines": [
    3076,
    3085
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0043 — Vocabulary: bound-invocation-supervisor vs detached-run-supervisor",
    "Hệ quả"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-171",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0043 — Vocabulary: bound-invocation-supervisor vs detached-run-supervisor",
    "Hệ quả"
  ],
  "nativeTargetClaimId": "claim_6c3d3e6ed6e54cbe8eaf94bd7e629ec5",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "hệ-quả-11",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_44294c754f97f771769d49ebd6a0614d",
    "sourceUnitDigest": "b65eccb0bfb36f2ca3b4aea4c026dfaaaa60367e4b4e0ee0b082bf19ad74d5eb",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-171",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-312 (lines 3076–3085) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-171. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "b65eccb0bfb36f2ca3b4aea4c026dfaaaa60367e4b4e0ee0b082bf19ad74d5eb",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0043 — Vocabulary: bound-invocation-supervisor vs detached-run-supervisor",
      "Hệ quả"
    ]
  }
}
```

### Full source unit

```text
- A future reader comparing the two "supervisor" files judges them by
  lifecycle ownership, not by guessing from a shared generic name.
- `ExternalProcessConfig`/`Request`/`Outcome` and
  `ExternalProcessProviderAdapter` keep their current names — they name the
  wire protocol and the `OperationProvider` adapter, not the supervisor
  role, so this rename doesn't touch them.
- The day any operation (including `dispatch`) is routed `native` instead
  of `legacy-cli`, `bound-invocation-supervisor` becomes a real second
  invocation mechanism alongside `detached-run-supervisor` — this record is
  the ownership boundary written down before that happens, not after.
```

### Full target unit

```text
- A future reader comparing the two "supervisor" files judges them by
  lifecycle ownership, not by guessing from a shared generic name.
- `ExternalProcessConfig`/`Request`/`Outcome` and
  `ExternalProcessProviderAdapter` keep their current names — they name the
  wire protocol and the `OperationProvider` adapter, not the supervisor
  role, so this rename doesn't touch them.
- The day any operation (including `dispatch`) is routed `native` instead
  of `legacy-cli`, `bound-invocation-supervisor` becomes a real second
  invocation mechanism alongside `detached-run-supervisor` — this record is
  the ownership boundary written down before that happens, not after.
```

### Full diff

```diff
No text difference.
```
