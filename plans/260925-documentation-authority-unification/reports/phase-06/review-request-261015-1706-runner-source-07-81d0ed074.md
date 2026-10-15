# Independent bounded runner source review

Content commit: 81d0ed0747014e976c0d29222439fd6e3592b468

Author session: codex-session:unit-run-1792057868388-68b4a62c@2026-10-15

Entries: **12**. Target: `docs/platform/runner/operations/h-51f5cd7279fd.md`; part 3/3. Shard: `plans/260925-documentation-authority-unification/ledger/decisions/s9-runner-01.json`; SHA256 `de26feeaa57cfde916a78fdb423735da6335dbc35138e4ef545293c3bb50222b`. Sidecar SHA256 `ce9dd9cc9d4094860072d77952fdffa919992598e13e765a806798dc27917aab`.

Read review-brief.md, owner-answers.md A19/A22/A28/A34/A36 and the frozen runner map. Ordinary conservation review only; no truth, promotion or retirement approval. Mechanically verify every digest, anchor, ancestry, native identity, one owner and shard/pack equality. Reviewer independently selects and records seeds and IDs, reads both directions with the full diff, and labels every own note deep or mechanical. More than 3% deep rework requires full-pack deep reading. Return Reviewer, Author session(s), Review mode: ordinary, content/request/shard pins and one five-column Claim | Verdict | Note | Source digest | Target digest row per entry; full 64-hex digests, literal none for absent target, ok/rework/hold. No producer verdict, draw or seed is supplied. Consolidate source packs by the original shard before ordinary application.

A36: reviewer-drawn minimum **10/12** Weak-exact/Judgment entries for this pack, plus every unequal-digest pair. Complete batch: 494 Weak-exact and 1 Judgment; at least 75 Weak-exact plus the sole Judgment overall (per-pack minima can require more). No Unit-exact population exists. Full direct-section text is shown for headings; large single sections may span consecutive block packs, without truncating any unit. Map additions and both rebound anchors are explicitly marked on every affected section row.

```json
{
  "classes": {
    "Unit-exact": [],
    "Weak-exact": [
      "claim_66c5a56d447d241a438d212c7b6222d2",
      "claim_d883159fc9171a01070453df2af79a8f",
      "claim_41571c8f42f542be1f44c9371fad823a",
      "claim_60ee5b173a01a6a4032956ede901812f",
      "claim_dab55f62d062b24d930be5af90b2f60f",
      "claim_1bceeeebe69033b803ed37f2a1e6213e",
      "claim_0cc820888c045e6521247c5e7291c177",
      "claim_eb7624af9ce523f5f4e81b159e5b3f09",
      "claim_23ed035dde0aa5b6a4c5b0c2605520a3",
      "claim_c3971ec3042b6f9fd5a3ab9d47b8f98f",
      "claim_0d8f8fd8b474f605f31bb35d82bdbea2",
      "claim_a770eb9e2dcb4322ef3615c199829d18"
    ],
    "Judgment": []
  },
  "unequalDigestPairs": [],
  "mapAmendmentIDs": [],
  "reboundAnchorIDs": []
}
```

## claim_66c5a56d447d241a438d212c7b6222d2

Source digest: df9402da4e0b1087fb0b38c82b93963f70524eff5988cad5d9e4715eade7953a

Target digest: df9402da4e0b1087fb0b38c82b93963f70524eff5988cad5d9e4715eade7953a

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "khóa-hoạt-động-cây-chính-chặn-commit-trần-khi-phiên-khác-đang-hoạt-động-str65",
  "sourceLines": [
    878,
    878
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Behaviors & Operations"
  ],
  "targetPath": "docs/platform/runner/operations/h-51f5cd7279fd.md",
  "targetAnchor": "khóa-hoạt-động-cây-chính-chặn-commit-trần-khi-phiên-khác-đang-hoạt-động-str65",
  "targetAncestry": [
    "Added in candidate: Runner Behaviors & Operations",
    "Behaviors & Operations"
  ],
  "nativeTargetClaimId": "claim_54ef40a24cbce50f203cf2619fa3f07d",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; document exact share below one half",
  "section": "khóa-hoạt-động-cây-chính-chặn-commit-trần-khi-phiên-khác-đang-hoạt-động-str65",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_66c5a56d447d241a438d212c7b6222d2",
    "sourceUnitDigest": "df9402da4e0b1087fb0b38c82b93963f70524eff5988cad5d9e4715eade7953a",
    "targetOwner": "docs/platform/runner/operations/h-51f5cd7279fd.md",
    "targetAnchor": "khóa-hoạt-động-cây-chính-chặn-commit-trần-khi-phiên-khác-đang-hoạt-động-str65",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. Whole heading docs/specs/runner.md#khóa-hoạt-động-cây-chính-chặn-commit-trần-khi-phiên-khác-đang-hoạt-động-str65 (lines 878–878) carried at docs/platform/runner/operations/h-51f5cd7279fd.md#khóa-hoạt-động-cây-chính-chặn-commit-trần-khi-phiên-khác-đang-hoạt-động-str65. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "df9402da4e0b1087fb0b38c82b93963f70524eff5988cad5d9e4715eade7953a",
    "targetAncestry": [
      "Added in candidate: Runner Behaviors & Operations",
      "Behaviors & Operations"
    ]
  }
}
```

### Full source unit

```text
### Khóa hoạt động cây chính — chặn commit trần khi phiên khác đang hoạt động (STR65)

Khác với "Bảo vệ approve khỏi lồng phiên" trên (chỉ canh MỘT verb, `approve`, và chỉ
canh phiên đã đăng ký qua sổ `session start`), cơ chế này canh MỌI `git commit` trần
vào cây chính (dù qua verb fgOS nào, qua một trợ lý, hay tay gõ thẳng) và không phụ
thuộc sổ đăng ký — vá đúng lỗ hổng "một `git worktree add` thủ công chưa từng đăng ký"
mà rủi ro-còn-lại ở trên nêu tên.

- **Runs when:** mọi lần `git commit` chạm cây chính — dù người gõ tay, một trợ lý,
  hay CI — đi qua một hook cài sẵn ở tầng git (không phải một verb fgOS, không phải
  một cấu hình riêng của công cụ trợ lý nào).
- **Blocked when:** một khóa hoạt động ghi rằng một danh tính KHÁC đã chạm cây chính
  này trong cửa sổ gần đây (mặc định 15 phút) — commit bị từ chối thẳng, không chạy;
  hoặc khóa không đọc được (hỏng/không phân tích được) — commit CŨNG bị từ chối (thà
  chặn nhầm còn hơn để lọt một race thật).
- **What changes:** khi cây chính đang rảnh, hoặc khi CHÍNH danh tính đang commit là
  danh tính đã ghi khóa gần nhất (cùng phiên tiếp tục làm việc), commit đi qua bình
  thường, không thông báo gì. Danh tính ưu tiên biến môi trường phiên trợ lý khi có;
  vắng mặt (terminal tay gõ) thì suy ra từ một tiến trình tổ tiên gần đó — suy đoán
  tốt-nhất, không tuyệt đối (hai terminal tay gõ chia sẻ cùng tiến trình cha gần có
  thể không phân biệt được nhau — xem Open Gaps).
- **Side effects:** ghi lại khóa hoạt động (danh tính + thời điểm) ngay tại chính cây
  chính, dùng đúng cơ chế tạo-nguyên-tử + đòi-lại-pid-chết đã có ba lần trong hệ (xem
  "Phiên checkout đa-phiên" trên) — không đụng sổ đăng ký phiên, không đụng khóa
  `sessions.lock`/`runner.lock`/`events.lock` nào đã có.
- **Afterwards:** một commit bị từ chối in thông điệp giải thích bằng thời gian ("một
  phiên khác dường như đang hoạt động ở đây gần đây") và trỏ người tới đúng cách mở
  một cây làm việc cô lập — không bao giờ in ra một định danh thô (pid/session-id) như
  thể đó là thứ người đọc cần tự hành động theo.
```

### Full target unit

```text
### Khóa hoạt động cây chính — chặn commit trần khi phiên khác đang hoạt động (STR65)

Khác với "Bảo vệ approve khỏi lồng phiên" trên (chỉ canh MỘT verb, `approve`, và chỉ
canh phiên đã đăng ký qua sổ `session start`), cơ chế này canh MỌI `git commit` trần
vào cây chính (dù qua verb fgOS nào, qua một trợ lý, hay tay gõ thẳng) và không phụ
thuộc sổ đăng ký — vá đúng lỗ hổng "một `git worktree add` thủ công chưa từng đăng ký"
mà rủi ro-còn-lại ở trên nêu tên.

- **Runs when:** mọi lần `git commit` chạm cây chính — dù người gõ tay, một trợ lý,
  hay CI — đi qua một hook cài sẵn ở tầng git (không phải một verb fgOS, không phải
  một cấu hình riêng của công cụ trợ lý nào).
- **Blocked when:** một khóa hoạt động ghi rằng một danh tính KHÁC đã chạm cây chính
  này trong cửa sổ gần đây (mặc định 15 phút) — commit bị từ chối thẳng, không chạy;
  hoặc khóa không đọc được (hỏng/không phân tích được) — commit CŨNG bị từ chối (thà
  chặn nhầm còn hơn để lọt một race thật).
- **What changes:** khi cây chính đang rảnh, hoặc khi CHÍNH danh tính đang commit là
  danh tính đã ghi khóa gần nhất (cùng phiên tiếp tục làm việc), commit đi qua bình
  thường, không thông báo gì. Danh tính ưu tiên biến môi trường phiên trợ lý khi có;
  vắng mặt (terminal tay gõ) thì suy ra từ một tiến trình tổ tiên gần đó — suy đoán
  tốt-nhất, không tuyệt đối (hai terminal tay gõ chia sẻ cùng tiến trình cha gần có
  thể không phân biệt được nhau — xem Open Gaps).
- **Side effects:** ghi lại khóa hoạt động (danh tính + thời điểm) ngay tại chính cây
  chính, dùng đúng cơ chế tạo-nguyên-tử + đòi-lại-pid-chết đã có ba lần trong hệ (xem
  "Phiên checkout đa-phiên" trên) — không đụng sổ đăng ký phiên, không đụng khóa
  `sessions.lock`/`runner.lock`/`events.lock` nào đã có.
- **Afterwards:** một commit bị từ chối in thông điệp giải thích bằng thời gian ("một
  phiên khác dường như đang hoạt động ở đây gần đây") và trỏ người tới đúng cách mở
  một cây làm việc cô lập — không bao giờ in ra một định danh thô (pid/session-id) như
  thể đó là thứ người đọc cần tự hành động theo.
```

### Full diff

```diff
No text difference.
```

## claim_d883159fc9171a01070453df2af79a8f

Source digest: 0a2e8a0bd017b6f8d8eaedfa35a8b20aeb8fdd77ac0fad161d80749f151b42df

Target digest: 0a2e8a0bd017b6f8d8eaedfa35a8b20aeb8fdd77ac0fad161d80749f151b42df

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-51",
  "sourceLines": [
    880,
    884
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Behaviors & Operations",
    "Khóa hoạt động cây chính — chặn commit trần khi phiên khác đang hoạt động (STR65)"
  ],
  "targetPath": "docs/platform/runner/operations/h-51f5cd7279fd.md",
  "targetAnchor": "unheaded-block-39",
  "targetAncestry": [
    "Added in candidate: Runner Behaviors & Operations",
    "Behaviors & Operations",
    "Khóa hoạt động cây chính — chặn commit trần khi phiên khác đang hoạt động (STR65)"
  ],
  "nativeTargetClaimId": "claim_6a8b2ae444fd778cf3977fcaed6a61ea",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; document exact share below one half",
  "section": "khóa-hoạt-động-cây-chính-chặn-commit-trần-khi-phiên-khác-đang-hoạt-động-str65",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_d883159fc9171a01070453df2af79a8f",
    "sourceUnitDigest": "0a2e8a0bd017b6f8d8eaedfa35a8b20aeb8fdd77ac0fad161d80749f151b42df",
    "targetOwner": "docs/platform/runner/operations/h-51f5cd7279fd.md",
    "targetAnchor": "unheaded-block-39",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. Whole unheaded-block docs/specs/runner.md#unheaded-block-51 (lines 880–884) carried at docs/platform/runner/operations/h-51f5cd7279fd.md#unheaded-block-39. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "0a2e8a0bd017b6f8d8eaedfa35a8b20aeb8fdd77ac0fad161d80749f151b42df",
    "targetAncestry": [
      "Added in candidate: Runner Behaviors & Operations",
      "Behaviors & Operations",
      "Khóa hoạt động cây chính — chặn commit trần khi phiên khác đang hoạt động (STR65)"
    ]
  }
}
```

### Full source unit

```text
Khác với "Bảo vệ approve khỏi lồng phiên" trên (chỉ canh MỘT verb, `approve`, và chỉ
canh phiên đã đăng ký qua sổ `session start`), cơ chế này canh MỌI `git commit` trần
vào cây chính (dù qua verb fgOS nào, qua một trợ lý, hay tay gõ thẳng) và không phụ
thuộc sổ đăng ký — vá đúng lỗ hổng "một `git worktree add` thủ công chưa từng đăng ký"
mà rủi ro-còn-lại ở trên nêu tên.
```

### Full target unit

```text
Khác với "Bảo vệ approve khỏi lồng phiên" trên (chỉ canh MỘT verb, `approve`, và chỉ
canh phiên đã đăng ký qua sổ `session start`), cơ chế này canh MỌI `git commit` trần
vào cây chính (dù qua verb fgOS nào, qua một trợ lý, hay tay gõ thẳng) và không phụ
thuộc sổ đăng ký — vá đúng lỗ hổng "một `git worktree add` thủ công chưa từng đăng ký"
mà rủi ro-còn-lại ở trên nêu tên.
```

### Full diff

```diff
No text difference.
```

## claim_41571c8f42f542be1f44c9371fad823a

Source digest: 1b272bfab383f72def5df026184449f797cb7723c812253713808d6aed302988

Target digest: 1b272bfab383f72def5df026184449f797cb7723c812253713808d6aed302988

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-52",
  "sourceLines": [
    886,
    906
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Behaviors & Operations",
    "Khóa hoạt động cây chính — chặn commit trần khi phiên khác đang hoạt động (STR65)"
  ],
  "targetPath": "docs/platform/runner/operations/h-51f5cd7279fd.md",
  "targetAnchor": "unheaded-block-40",
  "targetAncestry": [
    "Added in candidate: Runner Behaviors & Operations",
    "Behaviors & Operations",
    "Khóa hoạt động cây chính — chặn commit trần khi phiên khác đang hoạt động (STR65)"
  ],
  "nativeTargetClaimId": "claim_650f0b44fcee4ada661c421a8e5a3540",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; document exact share below one half",
  "section": "khóa-hoạt-động-cây-chính-chặn-commit-trần-khi-phiên-khác-đang-hoạt-động-str65",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_41571c8f42f542be1f44c9371fad823a",
    "sourceUnitDigest": "1b272bfab383f72def5df026184449f797cb7723c812253713808d6aed302988",
    "targetOwner": "docs/platform/runner/operations/h-51f5cd7279fd.md",
    "targetAnchor": "unheaded-block-40",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. Whole unheaded-block docs/specs/runner.md#unheaded-block-52 (lines 886–906) carried at docs/platform/runner/operations/h-51f5cd7279fd.md#unheaded-block-40. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "1b272bfab383f72def5df026184449f797cb7723c812253713808d6aed302988",
    "targetAncestry": [
      "Added in candidate: Runner Behaviors & Operations",
      "Behaviors & Operations",
      "Khóa hoạt động cây chính — chặn commit trần khi phiên khác đang hoạt động (STR65)"
    ]
  }
}
```

### Full source unit

```text
- **Runs when:** mọi lần `git commit` chạm cây chính — dù người gõ tay, một trợ lý,
  hay CI — đi qua một hook cài sẵn ở tầng git (không phải một verb fgOS, không phải
  một cấu hình riêng của công cụ trợ lý nào).
- **Blocked when:** một khóa hoạt động ghi rằng một danh tính KHÁC đã chạm cây chính
  này trong cửa sổ gần đây (mặc định 15 phút) — commit bị từ chối thẳng, không chạy;
  hoặc khóa không đọc được (hỏng/không phân tích được) — commit CŨNG bị từ chối (thà
  chặn nhầm còn hơn để lọt một race thật).
- **What changes:** khi cây chính đang rảnh, hoặc khi CHÍNH danh tính đang commit là
  danh tính đã ghi khóa gần nhất (cùng phiên tiếp tục làm việc), commit đi qua bình
  thường, không thông báo gì. Danh tính ưu tiên biến môi trường phiên trợ lý khi có;
  vắng mặt (terminal tay gõ) thì suy ra từ một tiến trình tổ tiên gần đó — suy đoán
  tốt-nhất, không tuyệt đối (hai terminal tay gõ chia sẻ cùng tiến trình cha gần có
  thể không phân biệt được nhau — xem Open Gaps).
- **Side effects:** ghi lại khóa hoạt động (danh tính + thời điểm) ngay tại chính cây
  chính, dùng đúng cơ chế tạo-nguyên-tử + đòi-lại-pid-chết đã có ba lần trong hệ (xem
  "Phiên checkout đa-phiên" trên) — không đụng sổ đăng ký phiên, không đụng khóa
  `sessions.lock`/`runner.lock`/`events.lock` nào đã có.
- **Afterwards:** một commit bị từ chối in thông điệp giải thích bằng thời gian ("một
  phiên khác dường như đang hoạt động ở đây gần đây") và trỏ người tới đúng cách mở
  một cây làm việc cô lập — không bao giờ in ra một định danh thô (pid/session-id) như
  thể đó là thứ người đọc cần tự hành động theo.
```

### Full target unit

```text
- **Runs when:** mọi lần `git commit` chạm cây chính — dù người gõ tay, một trợ lý,
  hay CI — đi qua một hook cài sẵn ở tầng git (không phải một verb fgOS, không phải
  một cấu hình riêng của công cụ trợ lý nào).
- **Blocked when:** một khóa hoạt động ghi rằng một danh tính KHÁC đã chạm cây chính
  này trong cửa sổ gần đây (mặc định 15 phút) — commit bị từ chối thẳng, không chạy;
  hoặc khóa không đọc được (hỏng/không phân tích được) — commit CŨNG bị từ chối (thà
  chặn nhầm còn hơn để lọt một race thật).
- **What changes:** khi cây chính đang rảnh, hoặc khi CHÍNH danh tính đang commit là
  danh tính đã ghi khóa gần nhất (cùng phiên tiếp tục làm việc), commit đi qua bình
  thường, không thông báo gì. Danh tính ưu tiên biến môi trường phiên trợ lý khi có;
  vắng mặt (terminal tay gõ) thì suy ra từ một tiến trình tổ tiên gần đó — suy đoán
  tốt-nhất, không tuyệt đối (hai terminal tay gõ chia sẻ cùng tiến trình cha gần có
  thể không phân biệt được nhau — xem Open Gaps).
- **Side effects:** ghi lại khóa hoạt động (danh tính + thời điểm) ngay tại chính cây
  chính, dùng đúng cơ chế tạo-nguyên-tử + đòi-lại-pid-chết đã có ba lần trong hệ (xem
  "Phiên checkout đa-phiên" trên) — không đụng sổ đăng ký phiên, không đụng khóa
  `sessions.lock`/`runner.lock`/`events.lock` nào đã có.
- **Afterwards:** một commit bị từ chối in thông điệp giải thích bằng thời gian ("một
  phiên khác dường như đang hoạt động ở đây gần đây") và trỏ người tới đúng cách mở
  một cây làm việc cô lập — không bao giờ in ra một định danh thô (pid/session-id) như
  thể đó là thứ người đọc cần tự hành động theo.
```

### Full diff

```diff
No text difference.
```

## claim_60ee5b173a01a6a4032956ede901812f

Source digest: bc39a14690eeaef19cc3c657d134b42e6a2a9bbd58479381e65e1b1f552c8d44

Target digest: bc39a14690eeaef19cc3c657d134b42e6a2a9bbd58479381e65e1b1f552c8d44

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "vòng-làm-việc-có-hướng-dẫn-qua-tầng-skill-trích-xuất-entry-skill-phase-skills-p50",
  "sourceLines": [
    908,
    908
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Behaviors & Operations"
  ],
  "targetPath": "docs/platform/runner/operations/h-51f5cd7279fd.md",
  "targetAnchor": "vòng-làm-việc-có-hướng-dẫn-qua-tầng-skill-trích-xuất-entry-skill-phase-skills-p50",
  "targetAncestry": [
    "Added in candidate: Runner Behaviors & Operations",
    "Behaviors & Operations"
  ],
  "nativeTargetClaimId": "claim_b3653a62e1e9967a0ba1a90077e7b17f",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; document exact share below one half",
  "section": "vòng-làm-việc-có-hướng-dẫn-qua-tầng-skill-trích-xuất-entry-skill-phase-skills-p50",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_60ee5b173a01a6a4032956ede901812f",
    "sourceUnitDigest": "bc39a14690eeaef19cc3c657d134b42e6a2a9bbd58479381e65e1b1f552c8d44",
    "targetOwner": "docs/platform/runner/operations/h-51f5cd7279fd.md",
    "targetAnchor": "vòng-làm-việc-có-hướng-dẫn-qua-tầng-skill-trích-xuất-entry-skill-phase-skills-p50",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. Whole heading docs/specs/runner.md#vòng-làm-việc-có-hướng-dẫn-qua-tầng-skill-trích-xuất-entry-skill-phase-skills-p50 (lines 908–908) carried at docs/platform/runner/operations/h-51f5cd7279fd.md#vòng-làm-việc-có-hướng-dẫn-qua-tầng-skill-trích-xuất-entry-skill-phase-skills-p50. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "bc39a14690eeaef19cc3c657d134b42e6a2a9bbd58479381e65e1b1f552c8d44",
    "targetAncestry": [
      "Added in candidate: Runner Behaviors & Operations",
      "Behaviors & Operations"
    ]
  }
}
```

### Full source unit

```text
### Vòng làm việc có hướng dẫn qua tầng skill trích xuất (entry skill + phase skills, P50)

Khi một phiên trợ lý (người hoặc agent) mở repo để làm một item qua vòng đời của nó, phiên tự định vị bằng một entry skill đọc `stage` hiện tại của item rồi trỏ tới đúng skill giai đoạn kế tiếp — không có nghi thức khởi động nào khác ngoài đọc verb đọc-thuần (`list`/`ready`) rồi vào việc qua cửa pull `take` (per p50-workflow-induct). Bản đồ giai đoạn: skill `nghiên-cứu` hoạt động ở stage `discovery` — pha máy-một-mình, tự tra cứu rồi tự phán đủ-rõ hay chưa, không hỏi ai; một phán quyết đủ-rõ ở đây bỏ qua hẳn `exploring`, đi thẳng tới `planning`. Skill `làm-rõ` hoạt động ở stage `exploring` — pha máy+người; nó sàng lọc câu hỏi thật qua ba phép thử (chất-liệu/có-căn-cứ/trả-lời-được) trước khi hỏi người; câu hỏi không đạt sàng lọc (vd một lựa chọn chỉ ảnh hưởng người-triển-khai, không ảnh hưởng phạm vi sản phẩm) được ghim thành một giả định thay vì tạo cổng chờ-người. Skill `chia-việc` hoạt động ở nửa đầu stage `planning`; skill `thẩm-định` hoạt động ở nửa cuối, gác cạnh `planning→executing` — một thẩm định thất bại quay lại `chia-việc`, không bao giờ tự nhận đã qua; `thẩm-định` không phải một stage riêng và không chiếm ô nào trong bảng stage→skill, nó là pha thứ hai của chính skill `chia-việc`. Bước chuyển stage thật sự (đánh giá item đã đủ rõ/đủ khả thi hay chưa) luôn là verb máy của engine, không phải chính skill — skill không bao giờ tự áp cạnh chuyển-trạng-thái (cùng stance "trí tuệ không cầm picker" của RUL42 (stance trí-tuệ-giao-việc — picker cơ học vĩnh viễn, trí tuệ vào qua đúng hai cửa) áp dụng tương tự ở lớp hướng dẫn này — chính `fgos-routing/SKILL.md` cũng nêu tường minh nguyên tắc này trong mục "Precedence: the engine's verb always wins" của nó). Một cổng chờ-người thật (engine tự phán không đủ rõ) không bao giờ được chính vòng skill tự trả lời — nó luôn escalate ra ngoài phiên, chờ người quyết (mở rộng nguyên tắc "không tin lời trợ lý"/"không tự quyết thay người" của RUL3 (thứ tự ghi bất biến: sự kiện vào nhật ký trước, bản chiếu cập nhật sau) sang lớp hướng dẫn này). Toàn bộ vòng này chỉ dùng lại các verb/trạng thái đã có — không có event, stage, hay domain mới nào cho lớp hướng dẫn (per p50-workflow-induct).

Từ str89-fgos-domain-skills, vòng này không còn giả định ngầm domain
`coding`: entry skill (`fgos-routing`) đọc trường `domain` của item (mặc
định `coding` khi vắng mặt) rồi tra sổ đăng ký domain (spec Work-State,
mục "Mô hình domain") để biết skill nào ứng với từng stage — bảng
skill/stage không còn hard-code trong entry skill, mà đọc động từ sổ đăng
ký mỗi domain khai riêng (một domain khác `coding` có thể ánh xạ khác,
hoặc không ánh xạ skill nào cho một stage). Stage `executing` — trước đây
không skill nào ứng (thi công máy móc, không hướng dẫn) — nay CÓ một skill
cho domain `coding`: nó chạy vòng cài-đặt→kiểm-chứng→trả-việc (đọc item đã
claim, cài thật, chạy đúng `verify` đã ghi trên item, rồi `return`) — cùng
kỷ luật RUL46 (lớp hướng dẫn không bao giờ tự áp cạnh chuyển-trạng-thái — chỉ engine mới được)/RUL47 (cổng chờ-người của lớp hướng dẫn không bao giờ tự trả lời) (không tự áp cạnh chuyển-stage, không tự trả lời cổng
chờ-người) áp dụng ở stage này y hệt ba stage trước. Domain `marketing`
(nếu/khi được xây, xem backlog STR52) nằm ngoài phạm vi này — chưa có skill
executing riêng, hoãn có chủ ý.

Chứng minh vận hành thật (case-study, 2026-07-20): một item thật (thêm một hàm mới vào một dự án đồ chơi dogfood) đi trọn `submit → clarify (entry skill → skill làm-rõ, một câu hỏi bị lọc không đạt sàng lọc, không tạo cổng chờ-người) → engine tự phán "chưa đủ rõ" (cổng chờ-người THẬT, không phải kịch bản dàn dựng — nguyên nhân: một lời gọi phán-đoán lồng bên trong một phiên trợ lý đang chạy trả về văn xuôi thay vì phán quyết máy-đọc-được, xem Open Gaps) → escalate ra ngoài, không tự trả lời → người trả lời thật → engine tự phán "đủ rõ" → decompose (skill chia-việc → skill thẩm-định, thẩm-định gắn cờ "đạt kèm ràng buộc") → executing → cài đặt thật → trả việc (bắt được một lỗi thật khác: chuỗi lệnh xác nhận do skill chia-việc đề xuất giả định sai thư mục làm việc — sửa tại chỗ qua verb sửa-trường sẵn có, một sai lệch thật chứ không phải giả lập) → duyệt → xong, không chạm bất kỳ cơ chế riêng nào của công cụ điều phối bên ngoài dự án.
```

### Full target unit

```text
### Vòng làm việc có hướng dẫn qua tầng skill trích xuất (entry skill + phase skills, P50)

Khi một phiên trợ lý (người hoặc agent) mở repo để làm một item qua vòng đời của nó, phiên tự định vị bằng một entry skill đọc `stage` hiện tại của item rồi trỏ tới đúng skill giai đoạn kế tiếp — không có nghi thức khởi động nào khác ngoài đọc verb đọc-thuần (`list`/`ready`) rồi vào việc qua cửa pull `take` (per p50-workflow-induct). Bản đồ giai đoạn: skill `nghiên-cứu` hoạt động ở stage `discovery` — pha máy-một-mình, tự tra cứu rồi tự phán đủ-rõ hay chưa, không hỏi ai; một phán quyết đủ-rõ ở đây bỏ qua hẳn `exploring`, đi thẳng tới `planning`. Skill `làm-rõ` hoạt động ở stage `exploring` — pha máy+người; nó sàng lọc câu hỏi thật qua ba phép thử (chất-liệu/có-căn-cứ/trả-lời-được) trước khi hỏi người; câu hỏi không đạt sàng lọc (vd một lựa chọn chỉ ảnh hưởng người-triển-khai, không ảnh hưởng phạm vi sản phẩm) được ghim thành một giả định thay vì tạo cổng chờ-người. Skill `chia-việc` hoạt động ở nửa đầu stage `planning`; skill `thẩm-định` hoạt động ở nửa cuối, gác cạnh `planning→executing` — một thẩm định thất bại quay lại `chia-việc`, không bao giờ tự nhận đã qua; `thẩm-định` không phải một stage riêng và không chiếm ô nào trong bảng stage→skill, nó là pha thứ hai của chính skill `chia-việc`. Bước chuyển stage thật sự (đánh giá item đã đủ rõ/đủ khả thi hay chưa) luôn là verb máy của engine, không phải chính skill — skill không bao giờ tự áp cạnh chuyển-trạng-thái (cùng stance "trí tuệ không cầm picker" của RUL42 (stance trí-tuệ-giao-việc — picker cơ học vĩnh viễn, trí tuệ vào qua đúng hai cửa) áp dụng tương tự ở lớp hướng dẫn này — chính `fgos-routing/SKILL.md` cũng nêu tường minh nguyên tắc này trong mục "Precedence: the engine's verb always wins" của nó). Một cổng chờ-người thật (engine tự phán không đủ rõ) không bao giờ được chính vòng skill tự trả lời — nó luôn escalate ra ngoài phiên, chờ người quyết (mở rộng nguyên tắc "không tin lời trợ lý"/"không tự quyết thay người" của RUL3 (thứ tự ghi bất biến: sự kiện vào nhật ký trước, bản chiếu cập nhật sau) sang lớp hướng dẫn này). Toàn bộ vòng này chỉ dùng lại các verb/trạng thái đã có — không có event, stage, hay domain mới nào cho lớp hướng dẫn (per p50-workflow-induct).

Từ str89-fgos-domain-skills, vòng này không còn giả định ngầm domain
`coding`: entry skill (`fgos-routing`) đọc trường `domain` của item (mặc
định `coding` khi vắng mặt) rồi tra sổ đăng ký domain (spec Work-State,
mục "Mô hình domain") để biết skill nào ứng với từng stage — bảng
skill/stage không còn hard-code trong entry skill, mà đọc động từ sổ đăng
ký mỗi domain khai riêng (một domain khác `coding` có thể ánh xạ khác,
hoặc không ánh xạ skill nào cho một stage). Stage `executing` — trước đây
không skill nào ứng (thi công máy móc, không hướng dẫn) — nay CÓ một skill
cho domain `coding`: nó chạy vòng cài-đặt→kiểm-chứng→trả-việc (đọc item đã
claim, cài thật, chạy đúng `verify` đã ghi trên item, rồi `return`) — cùng
kỷ luật RUL46 (lớp hướng dẫn không bao giờ tự áp cạnh chuyển-trạng-thái — chỉ engine mới được)/RUL47 (cổng chờ-người của lớp hướng dẫn không bao giờ tự trả lời) (không tự áp cạnh chuyển-stage, không tự trả lời cổng
chờ-người) áp dụng ở stage này y hệt ba stage trước. Domain `marketing`
(nếu/khi được xây, xem backlog STR52) nằm ngoài phạm vi này — chưa có skill
executing riêng, hoãn có chủ ý.

Chứng minh vận hành thật (case-study, 2026-07-20): một item thật (thêm một hàm mới vào một dự án đồ chơi dogfood) đi trọn `submit → clarify (entry skill → skill làm-rõ, một câu hỏi bị lọc không đạt sàng lọc, không tạo cổng chờ-người) → engine tự phán "chưa đủ rõ" (cổng chờ-người THẬT, không phải kịch bản dàn dựng — nguyên nhân: một lời gọi phán-đoán lồng bên trong một phiên trợ lý đang chạy trả về văn xuôi thay vì phán quyết máy-đọc-được, xem Open Gaps) → escalate ra ngoài, không tự trả lời → người trả lời thật → engine tự phán "đủ rõ" → decompose (skill chia-việc → skill thẩm-định, thẩm-định gắn cờ "đạt kèm ràng buộc") → executing → cài đặt thật → trả việc (bắt được một lỗi thật khác: chuỗi lệnh xác nhận do skill chia-việc đề xuất giả định sai thư mục làm việc — sửa tại chỗ qua verb sửa-trường sẵn có, một sai lệch thật chứ không phải giả lập) → duyệt → xong, không chạm bất kỳ cơ chế riêng nào của công cụ điều phối bên ngoài dự án.
```

### Full diff

```diff
No text difference.
```

## claim_dab55f62d062b24d930be5af90b2f60f

Source digest: 68e54965cdd0365aab241af3df035ccd6b81acbd1439eac6e81e60ef92504091

Target digest: 68e54965cdd0365aab241af3df035ccd6b81acbd1439eac6e81e60ef92504091

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-53",
  "sourceLines": [
    910,
    910
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Behaviors & Operations",
    "Vòng làm việc có hướng dẫn qua tầng skill trích xuất (entry skill + phase skills, P50)"
  ],
  "targetPath": "docs/platform/runner/operations/h-51f5cd7279fd.md",
  "targetAnchor": "unheaded-block-41",
  "targetAncestry": [
    "Added in candidate: Runner Behaviors & Operations",
    "Behaviors & Operations",
    "Vòng làm việc có hướng dẫn qua tầng skill trích xuất (entry skill + phase skills, P50)"
  ],
  "nativeTargetClaimId": "claim_4b7920309cc7b6da50f6c4cb21527cc3",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; document exact share below one half",
  "section": "vòng-làm-việc-có-hướng-dẫn-qua-tầng-skill-trích-xuất-entry-skill-phase-skills-p50",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_dab55f62d062b24d930be5af90b2f60f",
    "sourceUnitDigest": "68e54965cdd0365aab241af3df035ccd6b81acbd1439eac6e81e60ef92504091",
    "targetOwner": "docs/platform/runner/operations/h-51f5cd7279fd.md",
    "targetAnchor": "unheaded-block-41",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. Whole unheaded-block docs/specs/runner.md#unheaded-block-53 (lines 910–910) carried at docs/platform/runner/operations/h-51f5cd7279fd.md#unheaded-block-41. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "68e54965cdd0365aab241af3df035ccd6b81acbd1439eac6e81e60ef92504091",
    "targetAncestry": [
      "Added in candidate: Runner Behaviors & Operations",
      "Behaviors & Operations",
      "Vòng làm việc có hướng dẫn qua tầng skill trích xuất (entry skill + phase skills, P50)"
    ]
  }
}
```

### Full source unit

```text
Khi một phiên trợ lý (người hoặc agent) mở repo để làm một item qua vòng đời của nó, phiên tự định vị bằng một entry skill đọc `stage` hiện tại của item rồi trỏ tới đúng skill giai đoạn kế tiếp — không có nghi thức khởi động nào khác ngoài đọc verb đọc-thuần (`list`/`ready`) rồi vào việc qua cửa pull `take` (per p50-workflow-induct). Bản đồ giai đoạn: skill `nghiên-cứu` hoạt động ở stage `discovery` — pha máy-một-mình, tự tra cứu rồi tự phán đủ-rõ hay chưa, không hỏi ai; một phán quyết đủ-rõ ở đây bỏ qua hẳn `exploring`, đi thẳng tới `planning`. Skill `làm-rõ` hoạt động ở stage `exploring` — pha máy+người; nó sàng lọc câu hỏi thật qua ba phép thử (chất-liệu/có-căn-cứ/trả-lời-được) trước khi hỏi người; câu hỏi không đạt sàng lọc (vd một lựa chọn chỉ ảnh hưởng người-triển-khai, không ảnh hưởng phạm vi sản phẩm) được ghim thành một giả định thay vì tạo cổng chờ-người. Skill `chia-việc` hoạt động ở nửa đầu stage `planning`; skill `thẩm-định` hoạt động ở nửa cuối, gác cạnh `planning→executing` — một thẩm định thất bại quay lại `chia-việc`, không bao giờ tự nhận đã qua; `thẩm-định` không phải một stage riêng và không chiếm ô nào trong bảng stage→skill, nó là pha thứ hai của chính skill `chia-việc`. Bước chuyển stage thật sự (đánh giá item đã đủ rõ/đủ khả thi hay chưa) luôn là verb máy của engine, không phải chính skill — skill không bao giờ tự áp cạnh chuyển-trạng-thái (cùng stance "trí tuệ không cầm picker" của RUL42 (stance trí-tuệ-giao-việc — picker cơ học vĩnh viễn, trí tuệ vào qua đúng hai cửa) áp dụng tương tự ở lớp hướng dẫn này — chính `fgos-routing/SKILL.md` cũng nêu tường minh nguyên tắc này trong mục "Precedence: the engine's verb always wins" của nó). Một cổng chờ-người thật (engine tự phán không đủ rõ) không bao giờ được chính vòng skill tự trả lời — nó luôn escalate ra ngoài phiên, chờ người quyết (mở rộng nguyên tắc "không tin lời trợ lý"/"không tự quyết thay người" của RUL3 (thứ tự ghi bất biến: sự kiện vào nhật ký trước, bản chiếu cập nhật sau) sang lớp hướng dẫn này). Toàn bộ vòng này chỉ dùng lại các verb/trạng thái đã có — không có event, stage, hay domain mới nào cho lớp hướng dẫn (per p50-workflow-induct).
```

### Full target unit

```text
Khi một phiên trợ lý (người hoặc agent) mở repo để làm một item qua vòng đời của nó, phiên tự định vị bằng một entry skill đọc `stage` hiện tại của item rồi trỏ tới đúng skill giai đoạn kế tiếp — không có nghi thức khởi động nào khác ngoài đọc verb đọc-thuần (`list`/`ready`) rồi vào việc qua cửa pull `take` (per p50-workflow-induct). Bản đồ giai đoạn: skill `nghiên-cứu` hoạt động ở stage `discovery` — pha máy-một-mình, tự tra cứu rồi tự phán đủ-rõ hay chưa, không hỏi ai; một phán quyết đủ-rõ ở đây bỏ qua hẳn `exploring`, đi thẳng tới `planning`. Skill `làm-rõ` hoạt động ở stage `exploring` — pha máy+người; nó sàng lọc câu hỏi thật qua ba phép thử (chất-liệu/có-căn-cứ/trả-lời-được) trước khi hỏi người; câu hỏi không đạt sàng lọc (vd một lựa chọn chỉ ảnh hưởng người-triển-khai, không ảnh hưởng phạm vi sản phẩm) được ghim thành một giả định thay vì tạo cổng chờ-người. Skill `chia-việc` hoạt động ở nửa đầu stage `planning`; skill `thẩm-định` hoạt động ở nửa cuối, gác cạnh `planning→executing` — một thẩm định thất bại quay lại `chia-việc`, không bao giờ tự nhận đã qua; `thẩm-định` không phải một stage riêng và không chiếm ô nào trong bảng stage→skill, nó là pha thứ hai của chính skill `chia-việc`. Bước chuyển stage thật sự (đánh giá item đã đủ rõ/đủ khả thi hay chưa) luôn là verb máy của engine, không phải chính skill — skill không bao giờ tự áp cạnh chuyển-trạng-thái (cùng stance "trí tuệ không cầm picker" của RUL42 (stance trí-tuệ-giao-việc — picker cơ học vĩnh viễn, trí tuệ vào qua đúng hai cửa) áp dụng tương tự ở lớp hướng dẫn này — chính `fgos-routing/SKILL.md` cũng nêu tường minh nguyên tắc này trong mục "Precedence: the engine's verb always wins" của nó). Một cổng chờ-người thật (engine tự phán không đủ rõ) không bao giờ được chính vòng skill tự trả lời — nó luôn escalate ra ngoài phiên, chờ người quyết (mở rộng nguyên tắc "không tin lời trợ lý"/"không tự quyết thay người" của RUL3 (thứ tự ghi bất biến: sự kiện vào nhật ký trước, bản chiếu cập nhật sau) sang lớp hướng dẫn này). Toàn bộ vòng này chỉ dùng lại các verb/trạng thái đã có — không có event, stage, hay domain mới nào cho lớp hướng dẫn (per p50-workflow-induct).
```

### Full diff

```diff
No text difference.
```

## claim_1bceeeebe69033b803ed37f2a1e6213e

Source digest: 7081262730c5a022bfa4b1c815bc90bffe5649538cc01fee4880433cb1144a4b

Target digest: 7081262730c5a022bfa4b1c815bc90bffe5649538cc01fee4880433cb1144a4b

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-54",
  "sourceLines": [
    912,
    925
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Behaviors & Operations",
    "Vòng làm việc có hướng dẫn qua tầng skill trích xuất (entry skill + phase skills, P50)"
  ],
  "targetPath": "docs/platform/runner/operations/h-51f5cd7279fd.md",
  "targetAnchor": "unheaded-block-42",
  "targetAncestry": [
    "Added in candidate: Runner Behaviors & Operations",
    "Behaviors & Operations",
    "Vòng làm việc có hướng dẫn qua tầng skill trích xuất (entry skill + phase skills, P50)"
  ],
  "nativeTargetClaimId": "claim_786c47e0b5ed4f8491a36a556b2900c3",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; document exact share below one half",
  "section": "vòng-làm-việc-có-hướng-dẫn-qua-tầng-skill-trích-xuất-entry-skill-phase-skills-p50",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_1bceeeebe69033b803ed37f2a1e6213e",
    "sourceUnitDigest": "7081262730c5a022bfa4b1c815bc90bffe5649538cc01fee4880433cb1144a4b",
    "targetOwner": "docs/platform/runner/operations/h-51f5cd7279fd.md",
    "targetAnchor": "unheaded-block-42",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. Whole unheaded-block docs/specs/runner.md#unheaded-block-54 (lines 912–925) carried at docs/platform/runner/operations/h-51f5cd7279fd.md#unheaded-block-42. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "7081262730c5a022bfa4b1c815bc90bffe5649538cc01fee4880433cb1144a4b",
    "targetAncestry": [
      "Added in candidate: Runner Behaviors & Operations",
      "Behaviors & Operations",
      "Vòng làm việc có hướng dẫn qua tầng skill trích xuất (entry skill + phase skills, P50)"
    ]
  }
}
```

### Full source unit

```text
Từ str89-fgos-domain-skills, vòng này không còn giả định ngầm domain
`coding`: entry skill (`fgos-routing`) đọc trường `domain` của item (mặc
định `coding` khi vắng mặt) rồi tra sổ đăng ký domain (spec Work-State,
mục "Mô hình domain") để biết skill nào ứng với từng stage — bảng
skill/stage không còn hard-code trong entry skill, mà đọc động từ sổ đăng
ký mỗi domain khai riêng (một domain khác `coding` có thể ánh xạ khác,
hoặc không ánh xạ skill nào cho một stage). Stage `executing` — trước đây
không skill nào ứng (thi công máy móc, không hướng dẫn) — nay CÓ một skill
cho domain `coding`: nó chạy vòng cài-đặt→kiểm-chứng→trả-việc (đọc item đã
claim, cài thật, chạy đúng `verify` đã ghi trên item, rồi `return`) — cùng
kỷ luật RUL46 (lớp hướng dẫn không bao giờ tự áp cạnh chuyển-trạng-thái — chỉ engine mới được)/RUL47 (cổng chờ-người của lớp hướng dẫn không bao giờ tự trả lời) (không tự áp cạnh chuyển-stage, không tự trả lời cổng
chờ-người) áp dụng ở stage này y hệt ba stage trước. Domain `marketing`
(nếu/khi được xây, xem backlog STR52) nằm ngoài phạm vi này — chưa có skill
executing riêng, hoãn có chủ ý.
```

### Full target unit

```text
Từ str89-fgos-domain-skills, vòng này không còn giả định ngầm domain
`coding`: entry skill (`fgos-routing`) đọc trường `domain` của item (mặc
định `coding` khi vắng mặt) rồi tra sổ đăng ký domain (spec Work-State,
mục "Mô hình domain") để biết skill nào ứng với từng stage — bảng
skill/stage không còn hard-code trong entry skill, mà đọc động từ sổ đăng
ký mỗi domain khai riêng (một domain khác `coding` có thể ánh xạ khác,
hoặc không ánh xạ skill nào cho một stage). Stage `executing` — trước đây
không skill nào ứng (thi công máy móc, không hướng dẫn) — nay CÓ một skill
cho domain `coding`: nó chạy vòng cài-đặt→kiểm-chứng→trả-việc (đọc item đã
claim, cài thật, chạy đúng `verify` đã ghi trên item, rồi `return`) — cùng
kỷ luật RUL46 (lớp hướng dẫn không bao giờ tự áp cạnh chuyển-trạng-thái — chỉ engine mới được)/RUL47 (cổng chờ-người của lớp hướng dẫn không bao giờ tự trả lời) (không tự áp cạnh chuyển-stage, không tự trả lời cổng
chờ-người) áp dụng ở stage này y hệt ba stage trước. Domain `marketing`
(nếu/khi được xây, xem backlog STR52) nằm ngoài phạm vi này — chưa có skill
executing riêng, hoãn có chủ ý.
```

### Full diff

```diff
No text difference.
```

## claim_0cc820888c045e6521247c5e7291c177

Source digest: cb6a2b60e8c62091a37dbe5e29ad3546d82a62a7190729d8dc62bdd372c43fb5

Target digest: cb6a2b60e8c62091a37dbe5e29ad3546d82a62a7190729d8dc62bdd372c43fb5

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-55",
  "sourceLines": [
    927,
    927
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Behaviors & Operations",
    "Vòng làm việc có hướng dẫn qua tầng skill trích xuất (entry skill + phase skills, P50)"
  ],
  "targetPath": "docs/platform/runner/operations/h-51f5cd7279fd.md",
  "targetAnchor": "unheaded-block-43",
  "targetAncestry": [
    "Added in candidate: Runner Behaviors & Operations",
    "Behaviors & Operations",
    "Vòng làm việc có hướng dẫn qua tầng skill trích xuất (entry skill + phase skills, P50)"
  ],
  "nativeTargetClaimId": "claim_d1a17da1dfeac201f461d0aa63e7e5db",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; document exact share below one half",
  "section": "vòng-làm-việc-có-hướng-dẫn-qua-tầng-skill-trích-xuất-entry-skill-phase-skills-p50",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_0cc820888c045e6521247c5e7291c177",
    "sourceUnitDigest": "cb6a2b60e8c62091a37dbe5e29ad3546d82a62a7190729d8dc62bdd372c43fb5",
    "targetOwner": "docs/platform/runner/operations/h-51f5cd7279fd.md",
    "targetAnchor": "unheaded-block-43",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. Whole unheaded-block docs/specs/runner.md#unheaded-block-55 (lines 927–927) carried at docs/platform/runner/operations/h-51f5cd7279fd.md#unheaded-block-43. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "cb6a2b60e8c62091a37dbe5e29ad3546d82a62a7190729d8dc62bdd372c43fb5",
    "targetAncestry": [
      "Added in candidate: Runner Behaviors & Operations",
      "Behaviors & Operations",
      "Vòng làm việc có hướng dẫn qua tầng skill trích xuất (entry skill + phase skills, P50)"
    ]
  }
}
```

### Full source unit

```text
Chứng minh vận hành thật (case-study, 2026-07-20): một item thật (thêm một hàm mới vào một dự án đồ chơi dogfood) đi trọn `submit → clarify (entry skill → skill làm-rõ, một câu hỏi bị lọc không đạt sàng lọc, không tạo cổng chờ-người) → engine tự phán "chưa đủ rõ" (cổng chờ-người THẬT, không phải kịch bản dàn dựng — nguyên nhân: một lời gọi phán-đoán lồng bên trong một phiên trợ lý đang chạy trả về văn xuôi thay vì phán quyết máy-đọc-được, xem Open Gaps) → escalate ra ngoài, không tự trả lời → người trả lời thật → engine tự phán "đủ rõ" → decompose (skill chia-việc → skill thẩm-định, thẩm-định gắn cờ "đạt kèm ràng buộc") → executing → cài đặt thật → trả việc (bắt được một lỗi thật khác: chuỗi lệnh xác nhận do skill chia-việc đề xuất giả định sai thư mục làm việc — sửa tại chỗ qua verb sửa-trường sẵn có, một sai lệch thật chứ không phải giả lập) → duyệt → xong, không chạm bất kỳ cơ chế riêng nào của công cụ điều phối bên ngoài dự án.
```

### Full target unit

```text
Chứng minh vận hành thật (case-study, 2026-07-20): một item thật (thêm một hàm mới vào một dự án đồ chơi dogfood) đi trọn `submit → clarify (entry skill → skill làm-rõ, một câu hỏi bị lọc không đạt sàng lọc, không tạo cổng chờ-người) → engine tự phán "chưa đủ rõ" (cổng chờ-người THẬT, không phải kịch bản dàn dựng — nguyên nhân: một lời gọi phán-đoán lồng bên trong một phiên trợ lý đang chạy trả về văn xuôi thay vì phán quyết máy-đọc-được, xem Open Gaps) → escalate ra ngoài, không tự trả lời → người trả lời thật → engine tự phán "đủ rõ" → decompose (skill chia-việc → skill thẩm-định, thẩm-định gắn cờ "đạt kèm ràng buộc") → executing → cài đặt thật → trả việc (bắt được một lỗi thật khác: chuỗi lệnh xác nhận do skill chia-việc đề xuất giả định sai thư mục làm việc — sửa tại chỗ qua verb sửa-trường sẵn có, một sai lệch thật chứ không phải giả lập) → duyệt → xong, không chạm bất kỳ cơ chế riêng nào của công cụ điều phối bên ngoài dự án.
```

### Full diff

```diff
No text difference.
```

## claim_eb7624af9ce523f5f4e81b159e5b3f09

Source digest: 59aa6f5d6d68c416a22eeea6fa6c4247fb7d7de59f69325d790f3bd7d7015581

Target digest: 59aa6f5d6d68c416a22eeea6fa6c4247fb7d7de59f69325d790f3bd7d7015581

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "báo-việc-phát-hiện-từ-trợ-lý-workerrunner-discovery-report",
  "sourceLines": [
    929,
    929
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Behaviors & Operations"
  ],
  "targetPath": "docs/platform/runner/operations/h-51f5cd7279fd.md",
  "targetAnchor": "báo-việc-phát-hiện-từ-trợ-lý-workerrunner-discovery-report",
  "targetAncestry": [
    "Added in candidate: Runner Behaviors & Operations",
    "Behaviors & Operations"
  ],
  "nativeTargetClaimId": "claim_504efaa3cc4c207793709b52bc9a3ea7",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; document exact share below one half",
  "section": "báo-việc-phát-hiện-từ-trợ-lý-workerrunner-discovery-report",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_eb7624af9ce523f5f4e81b159e5b3f09",
    "sourceUnitDigest": "59aa6f5d6d68c416a22eeea6fa6c4247fb7d7de59f69325d790f3bd7d7015581",
    "targetOwner": "docs/platform/runner/operations/h-51f5cd7279fd.md",
    "targetAnchor": "báo-việc-phát-hiện-từ-trợ-lý-workerrunner-discovery-report",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. Whole heading docs/specs/runner.md#báo-việc-phát-hiện-từ-trợ-lý-workerrunner-discovery-report (lines 929–929) carried at docs/platform/runner/operations/h-51f5cd7279fd.md#báo-việc-phát-hiện-từ-trợ-lý-workerrunner-discovery-report. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "59aa6f5d6d68c416a22eeea6fa6c4247fb7d7de59f69325d790f3bd7d7015581",
    "targetAncestry": [
      "Added in candidate: Runner Behaviors & Operations",
      "Behaviors & Operations"
    ]
  }
}
```

### Full source unit

```text
### Báo việc-phát-hiện từ trợ lý (worker→runner discovery report)

Trong lúc thi công một item, trợ lý CÓ THỂ nhận ra một việc mới đáng tách ra thành item riêng — một việc kéo theo, một phụ thuộc mới lộ ra, hoặc một mối lo nên tách khỏi việc đang làm. Trợ lý KHÔNG được phép tự ghi việc đó vào work-state (nguyên tắc một-người-ghi giữ nguyên tuyệt đối cho kênh này — xem "Ai ngã-ngũ" ở trên): nó chỉ được BÁO — đưa một mô tả có cấu trúc của việc phát-hiện vào chính output của mình, thuần dữ liệu, không phải một lệnh ghi.

Sau khi lượt dispatch của item đó KẾT THÚC — dù kết cục là thành đề xuất, chấm-trượt, quá-giờ, hay hỏng — runner đọc lại output đã ghi được của trợ lý, tách ra mọi báo-cáo hợp lệ, rồi TỰ MÌNH tạo một item mới cho mỗi báo-cáo (runner vẫn là bên duy nhất ghi, không đổi), đóng dấu dòng dõi PHÁT-HIỆN của item mới trỏ về đúng item đang thi công (xem spec Work-State Data Dictionary #22). Việc tách-báo-cáo này chạy ĐÚNG MỘT LẦN cho mỗi lượt dispatch, tại đúng thời điểm kết thúc — không chạy lại giữa các lần thử nội bộ của cùng một lượt — nên một lượt chạy không ổn định lặp lại cùng một báo-cáo nhiều lần trước khi kết thúc không tạo ra nhiều bản.

Một báo-cáo hỏng-hình (không phân tích được, thiếu tên việc) bị âm thầm bỏ qua — không bao giờ làm hỏng hay đổi kết cục của chính lượt dispatch đang xét. Item mới tạo ra vào hệ như một item bình thường ở giai đoạn đầu vào tiêu chuẩn — không có niềm tin đặc biệt, chịu cùng vòng xét-lại/làm-rõ như mọi item khác.

**Kỷ luật S10 (chống lạm dụng + chống trùng lặp, review-fix 2 P2):**
- **Trần mỗi lượt.** Một lượt dispatch chỉ hành động trên một số lượng báo-cáo GIỚI HẠN — output vượt trần chỉ tạo đúng số item bằng trần, phần dư bị bỏ qua có ghi lại, không bao giờ ảnh hưởng tới kết cục của chính lượt dispatch. Chặn đường một trợ lý bất thường (hay bị chèn lệnh từ nội dung không đáng tin nó đọc phải) sinh ra vô hạn item.
- **Chống trùng lặp.** Một báo-cáo ĐÃ được ghi nhận trước đó (cùng dòng dõi phát-hiện + tên việc khớp, không phân biệt hoa/thường/khoảng trắng) không tạo item thứ hai — dù báo-cáo đó lặp lại hai lần trong CÙNG một output, hay item nguồn được nhận lại và chạy một lượt SAU tự báo lại đúng báo-cáo đã ghi nhận. Hai việc có tên KHÁC NHAU thật sự vẫn cả hai đều được tạo — phép so khớp không vơ trùng những gì không trùng.
```

### Full target unit

```text
### Báo việc-phát-hiện từ trợ lý (worker→runner discovery report)

Trong lúc thi công một item, trợ lý CÓ THỂ nhận ra một việc mới đáng tách ra thành item riêng — một việc kéo theo, một phụ thuộc mới lộ ra, hoặc một mối lo nên tách khỏi việc đang làm. Trợ lý KHÔNG được phép tự ghi việc đó vào work-state (nguyên tắc một-người-ghi giữ nguyên tuyệt đối cho kênh này — xem "Ai ngã-ngũ" ở trên): nó chỉ được BÁO — đưa một mô tả có cấu trúc của việc phát-hiện vào chính output của mình, thuần dữ liệu, không phải một lệnh ghi.

Sau khi lượt dispatch của item đó KẾT THÚC — dù kết cục là thành đề xuất, chấm-trượt, quá-giờ, hay hỏng — runner đọc lại output đã ghi được của trợ lý, tách ra mọi báo-cáo hợp lệ, rồi TỰ MÌNH tạo một item mới cho mỗi báo-cáo (runner vẫn là bên duy nhất ghi, không đổi), đóng dấu dòng dõi PHÁT-HIỆN của item mới trỏ về đúng item đang thi công (xem spec Work-State Data Dictionary #22). Việc tách-báo-cáo này chạy ĐÚNG MỘT LẦN cho mỗi lượt dispatch, tại đúng thời điểm kết thúc — không chạy lại giữa các lần thử nội bộ của cùng một lượt — nên một lượt chạy không ổn định lặp lại cùng một báo-cáo nhiều lần trước khi kết thúc không tạo ra nhiều bản.

Một báo-cáo hỏng-hình (không phân tích được, thiếu tên việc) bị âm thầm bỏ qua — không bao giờ làm hỏng hay đổi kết cục của chính lượt dispatch đang xét. Item mới tạo ra vào hệ như một item bình thường ở giai đoạn đầu vào tiêu chuẩn — không có niềm tin đặc biệt, chịu cùng vòng xét-lại/làm-rõ như mọi item khác.

**Kỷ luật S10 (chống lạm dụng + chống trùng lặp, review-fix 2 P2):**
- **Trần mỗi lượt.** Một lượt dispatch chỉ hành động trên một số lượng báo-cáo GIỚI HẠN — output vượt trần chỉ tạo đúng số item bằng trần, phần dư bị bỏ qua có ghi lại, không bao giờ ảnh hưởng tới kết cục của chính lượt dispatch. Chặn đường một trợ lý bất thường (hay bị chèn lệnh từ nội dung không đáng tin nó đọc phải) sinh ra vô hạn item.
- **Chống trùng lặp.** Một báo-cáo ĐÃ được ghi nhận trước đó (cùng dòng dõi phát-hiện + tên việc khớp, không phân biệt hoa/thường/khoảng trắng) không tạo item thứ hai — dù báo-cáo đó lặp lại hai lần trong CÙNG một output, hay item nguồn được nhận lại và chạy một lượt SAU tự báo lại đúng báo-cáo đã ghi nhận. Hai việc có tên KHÁC NHAU thật sự vẫn cả hai đều được tạo — phép so khớp không vơ trùng những gì không trùng.
```

### Full diff

```diff
No text difference.
```

## claim_23ed035dde0aa5b6a4c5b0c2605520a3

Source digest: d73ae443ec4917df0cbfbdd0f9f4f241f403da68788d72f9195b576bfc2d92b3

Target digest: d73ae443ec4917df0cbfbdd0f9f4f241f403da68788d72f9195b576bfc2d92b3

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-56",
  "sourceLines": [
    931,
    931
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Behaviors & Operations",
    "Báo việc-phát-hiện từ trợ lý (worker→runner discovery report)"
  ],
  "targetPath": "docs/platform/runner/operations/h-51f5cd7279fd.md",
  "targetAnchor": "unheaded-block-44",
  "targetAncestry": [
    "Added in candidate: Runner Behaviors & Operations",
    "Behaviors & Operations",
    "Báo việc-phát-hiện từ trợ lý (worker→runner discovery report)"
  ],
  "nativeTargetClaimId": "claim_862913dd397234cbe821b589db15c927",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; document exact share below one half",
  "section": "báo-việc-phát-hiện-từ-trợ-lý-workerrunner-discovery-report",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_23ed035dde0aa5b6a4c5b0c2605520a3",
    "sourceUnitDigest": "d73ae443ec4917df0cbfbdd0f9f4f241f403da68788d72f9195b576bfc2d92b3",
    "targetOwner": "docs/platform/runner/operations/h-51f5cd7279fd.md",
    "targetAnchor": "unheaded-block-44",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. Whole unheaded-block docs/specs/runner.md#unheaded-block-56 (lines 931–931) carried at docs/platform/runner/operations/h-51f5cd7279fd.md#unheaded-block-44. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "d73ae443ec4917df0cbfbdd0f9f4f241f403da68788d72f9195b576bfc2d92b3",
    "targetAncestry": [
      "Added in candidate: Runner Behaviors & Operations",
      "Behaviors & Operations",
      "Báo việc-phát-hiện từ trợ lý (worker→runner discovery report)"
    ]
  }
}
```

### Full source unit

```text
Trong lúc thi công một item, trợ lý CÓ THỂ nhận ra một việc mới đáng tách ra thành item riêng — một việc kéo theo, một phụ thuộc mới lộ ra, hoặc một mối lo nên tách khỏi việc đang làm. Trợ lý KHÔNG được phép tự ghi việc đó vào work-state (nguyên tắc một-người-ghi giữ nguyên tuyệt đối cho kênh này — xem "Ai ngã-ngũ" ở trên): nó chỉ được BÁO — đưa một mô tả có cấu trúc của việc phát-hiện vào chính output của mình, thuần dữ liệu, không phải một lệnh ghi.
```

### Full target unit

```text
Trong lúc thi công một item, trợ lý CÓ THỂ nhận ra một việc mới đáng tách ra thành item riêng — một việc kéo theo, một phụ thuộc mới lộ ra, hoặc một mối lo nên tách khỏi việc đang làm. Trợ lý KHÔNG được phép tự ghi việc đó vào work-state (nguyên tắc một-người-ghi giữ nguyên tuyệt đối cho kênh này — xem "Ai ngã-ngũ" ở trên): nó chỉ được BÁO — đưa một mô tả có cấu trúc của việc phát-hiện vào chính output của mình, thuần dữ liệu, không phải một lệnh ghi.
```

### Full diff

```diff
No text difference.
```

## claim_c3971ec3042b6f9fd5a3ab9d47b8f98f

Source digest: 53fb6468389cdd9a308c7f0dad3422eb0bd29dcc52eb18d85eefeeeb3cb344a2

Target digest: 53fb6468389cdd9a308c7f0dad3422eb0bd29dcc52eb18d85eefeeeb3cb344a2

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-57",
  "sourceLines": [
    933,
    933
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Behaviors & Operations",
    "Báo việc-phát-hiện từ trợ lý (worker→runner discovery report)"
  ],
  "targetPath": "docs/platform/runner/operations/h-51f5cd7279fd.md",
  "targetAnchor": "unheaded-block-45",
  "targetAncestry": [
    "Added in candidate: Runner Behaviors & Operations",
    "Behaviors & Operations",
    "Báo việc-phát-hiện từ trợ lý (worker→runner discovery report)"
  ],
  "nativeTargetClaimId": "claim_46b1883fd1bdcd03bdeff76cc8e25dc2",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; document exact share below one half",
  "section": "báo-việc-phát-hiện-từ-trợ-lý-workerrunner-discovery-report",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_c3971ec3042b6f9fd5a3ab9d47b8f98f",
    "sourceUnitDigest": "53fb6468389cdd9a308c7f0dad3422eb0bd29dcc52eb18d85eefeeeb3cb344a2",
    "targetOwner": "docs/platform/runner/operations/h-51f5cd7279fd.md",
    "targetAnchor": "unheaded-block-45",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. Whole unheaded-block docs/specs/runner.md#unheaded-block-57 (lines 933–933) carried at docs/platform/runner/operations/h-51f5cd7279fd.md#unheaded-block-45. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "53fb6468389cdd9a308c7f0dad3422eb0bd29dcc52eb18d85eefeeeb3cb344a2",
    "targetAncestry": [
      "Added in candidate: Runner Behaviors & Operations",
      "Behaviors & Operations",
      "Báo việc-phát-hiện từ trợ lý (worker→runner discovery report)"
    ]
  }
}
```

### Full source unit

```text
Sau khi lượt dispatch của item đó KẾT THÚC — dù kết cục là thành đề xuất, chấm-trượt, quá-giờ, hay hỏng — runner đọc lại output đã ghi được của trợ lý, tách ra mọi báo-cáo hợp lệ, rồi TỰ MÌNH tạo một item mới cho mỗi báo-cáo (runner vẫn là bên duy nhất ghi, không đổi), đóng dấu dòng dõi PHÁT-HIỆN của item mới trỏ về đúng item đang thi công (xem spec Work-State Data Dictionary #22). Việc tách-báo-cáo này chạy ĐÚNG MỘT LẦN cho mỗi lượt dispatch, tại đúng thời điểm kết thúc — không chạy lại giữa các lần thử nội bộ của cùng một lượt — nên một lượt chạy không ổn định lặp lại cùng một báo-cáo nhiều lần trước khi kết thúc không tạo ra nhiều bản.
```

### Full target unit

```text
Sau khi lượt dispatch của item đó KẾT THÚC — dù kết cục là thành đề xuất, chấm-trượt, quá-giờ, hay hỏng — runner đọc lại output đã ghi được của trợ lý, tách ra mọi báo-cáo hợp lệ, rồi TỰ MÌNH tạo một item mới cho mỗi báo-cáo (runner vẫn là bên duy nhất ghi, không đổi), đóng dấu dòng dõi PHÁT-HIỆN của item mới trỏ về đúng item đang thi công (xem spec Work-State Data Dictionary #22). Việc tách-báo-cáo này chạy ĐÚNG MỘT LẦN cho mỗi lượt dispatch, tại đúng thời điểm kết thúc — không chạy lại giữa các lần thử nội bộ của cùng một lượt — nên một lượt chạy không ổn định lặp lại cùng một báo-cáo nhiều lần trước khi kết thúc không tạo ra nhiều bản.
```

### Full diff

```diff
No text difference.
```

## claim_0d8f8fd8b474f605f31bb35d82bdbea2

Source digest: 0eebe0217b73affa40bc19896c099549479ffab6dc7308c33548ed1088a022bb

Target digest: 0eebe0217b73affa40bc19896c099549479ffab6dc7308c33548ed1088a022bb

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-58",
  "sourceLines": [
    935,
    935
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Behaviors & Operations",
    "Báo việc-phát-hiện từ trợ lý (worker→runner discovery report)"
  ],
  "targetPath": "docs/platform/runner/operations/h-51f5cd7279fd.md",
  "targetAnchor": "unheaded-block-46",
  "targetAncestry": [
    "Added in candidate: Runner Behaviors & Operations",
    "Behaviors & Operations",
    "Báo việc-phát-hiện từ trợ lý (worker→runner discovery report)"
  ],
  "nativeTargetClaimId": "claim_2a7baff885715a28acc4b8d58d405010",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; document exact share below one half",
  "section": "báo-việc-phát-hiện-từ-trợ-lý-workerrunner-discovery-report",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_0d8f8fd8b474f605f31bb35d82bdbea2",
    "sourceUnitDigest": "0eebe0217b73affa40bc19896c099549479ffab6dc7308c33548ed1088a022bb",
    "targetOwner": "docs/platform/runner/operations/h-51f5cd7279fd.md",
    "targetAnchor": "unheaded-block-46",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. Whole unheaded-block docs/specs/runner.md#unheaded-block-58 (lines 935–935) carried at docs/platform/runner/operations/h-51f5cd7279fd.md#unheaded-block-46. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "0eebe0217b73affa40bc19896c099549479ffab6dc7308c33548ed1088a022bb",
    "targetAncestry": [
      "Added in candidate: Runner Behaviors & Operations",
      "Behaviors & Operations",
      "Báo việc-phát-hiện từ trợ lý (worker→runner discovery report)"
    ]
  }
}
```

### Full source unit

```text
Một báo-cáo hỏng-hình (không phân tích được, thiếu tên việc) bị âm thầm bỏ qua — không bao giờ làm hỏng hay đổi kết cục của chính lượt dispatch đang xét. Item mới tạo ra vào hệ như một item bình thường ở giai đoạn đầu vào tiêu chuẩn — không có niềm tin đặc biệt, chịu cùng vòng xét-lại/làm-rõ như mọi item khác.
```

### Full target unit

```text
Một báo-cáo hỏng-hình (không phân tích được, thiếu tên việc) bị âm thầm bỏ qua — không bao giờ làm hỏng hay đổi kết cục của chính lượt dispatch đang xét. Item mới tạo ra vào hệ như một item bình thường ở giai đoạn đầu vào tiêu chuẩn — không có niềm tin đặc biệt, chịu cùng vòng xét-lại/làm-rõ như mọi item khác.
```

### Full diff

```diff
No text difference.
```

## claim_a770eb9e2dcb4322ef3615c199829d18

Source digest: b842ea307f8de6939cd5995947dc7452e0102aaf7a8bea6655bebaf18424dd4b

Target digest: b842ea307f8de6939cd5995947dc7452e0102aaf7a8bea6655bebaf18424dd4b

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-59",
  "sourceLines": [
    937,
    939
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Behaviors & Operations",
    "Báo việc-phát-hiện từ trợ lý (worker→runner discovery report)"
  ],
  "targetPath": "docs/platform/runner/operations/h-51f5cd7279fd.md",
  "targetAnchor": "unheaded-block-47",
  "targetAncestry": [
    "Added in candidate: Runner Behaviors & Operations",
    "Behaviors & Operations",
    "Báo việc-phát-hiện từ trợ lý (worker→runner discovery report)"
  ],
  "nativeTargetClaimId": "claim_64d99c961b1fc200bc6566e5399eab26",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; document exact share below one half",
  "section": "báo-việc-phát-hiện-từ-trợ-lý-workerrunner-discovery-report",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_a770eb9e2dcb4322ef3615c199829d18",
    "sourceUnitDigest": "b842ea307f8de6939cd5995947dc7452e0102aaf7a8bea6655bebaf18424dd4b",
    "targetOwner": "docs/platform/runner/operations/h-51f5cd7279fd.md",
    "targetAnchor": "unheaded-block-47",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. Whole unheaded-block docs/specs/runner.md#unheaded-block-59 (lines 937–939) carried at docs/platform/runner/operations/h-51f5cd7279fd.md#unheaded-block-47. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "b842ea307f8de6939cd5995947dc7452e0102aaf7a8bea6655bebaf18424dd4b",
    "targetAncestry": [
      "Added in candidate: Runner Behaviors & Operations",
      "Behaviors & Operations",
      "Báo việc-phát-hiện từ trợ lý (worker→runner discovery report)"
    ]
  }
}
```

### Full source unit

```text
**Kỷ luật S10 (chống lạm dụng + chống trùng lặp, review-fix 2 P2):**
- **Trần mỗi lượt.** Một lượt dispatch chỉ hành động trên một số lượng báo-cáo GIỚI HẠN — output vượt trần chỉ tạo đúng số item bằng trần, phần dư bị bỏ qua có ghi lại, không bao giờ ảnh hưởng tới kết cục của chính lượt dispatch. Chặn đường một trợ lý bất thường (hay bị chèn lệnh từ nội dung không đáng tin nó đọc phải) sinh ra vô hạn item.
- **Chống trùng lặp.** Một báo-cáo ĐÃ được ghi nhận trước đó (cùng dòng dõi phát-hiện + tên việc khớp, không phân biệt hoa/thường/khoảng trắng) không tạo item thứ hai — dù báo-cáo đó lặp lại hai lần trong CÙNG một output, hay item nguồn được nhận lại và chạy một lượt SAU tự báo lại đúng báo-cáo đã ghi nhận. Hai việc có tên KHÁC NHAU thật sự vẫn cả hai đều được tạo — phép so khớp không vơ trùng những gì không trùng.
```

### Full target unit

```text
**Kỷ luật S10 (chống lạm dụng + chống trùng lặp, review-fix 2 P2):**
- **Trần mỗi lượt.** Một lượt dispatch chỉ hành động trên một số lượng báo-cáo GIỚI HẠN — output vượt trần chỉ tạo đúng số item bằng trần, phần dư bị bỏ qua có ghi lại, không bao giờ ảnh hưởng tới kết cục của chính lượt dispatch. Chặn đường một trợ lý bất thường (hay bị chèn lệnh từ nội dung không đáng tin nó đọc phải) sinh ra vô hạn item.
- **Chống trùng lặp.** Một báo-cáo ĐÃ được ghi nhận trước đó (cùng dòng dõi phát-hiện + tên việc khớp, không phân biệt hoa/thường/khoảng trắng) không tạo item thứ hai — dù báo-cáo đó lặp lại hai lần trong CÙNG một output, hay item nguồn được nhận lại và chạy một lượt SAU tự báo lại đúng báo-cáo đã ghi nhận. Hai việc có tên KHÁC NHAU thật sự vẫn cả hai đều được tạo — phép so khớp không vơ trùng những gì không trùng.
```

### Full diff

```diff
No text difference.
```
