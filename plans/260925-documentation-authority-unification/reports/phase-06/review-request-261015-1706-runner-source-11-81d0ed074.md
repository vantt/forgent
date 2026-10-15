# Independent bounded runner source review

Content commit: 81d0ed0747014e976c0d29222439fd6e3592b468

Author session: codex-session:unit-run-1792057868388-68b4a62c@2026-10-15

Entries: **4**. Target: `docs/platform/runner/subcomponents/h-37aced3896a8/spec.md`; part 1/1. Shard: `plans/260925-documentation-authority-unification/ledger/decisions/s9-runner-01.json`; SHA256 `de26feeaa57cfde916a78fdb423735da6335dbc35138e4ef545293c3bb50222b`. Sidecar SHA256 `82ad928ab955039f852199de40b876b445b120974760779747802cb3a35e5263`.

Read review-brief.md, owner-answers.md A19/A22/A28/A34/A36 and the frozen runner map. Ordinary conservation review only; no truth, promotion or retirement approval. Mechanically verify every digest, anchor, ancestry, native identity, one owner and shard/pack equality. Reviewer independently selects and records seeds and IDs, reads both directions with the full diff, and labels every own note deep or mechanical. More than 3% deep rework requires full-pack deep reading. Return Reviewer, Author session(s), Review mode: ordinary, content/request/shard pins and one five-column Claim | Verdict | Note | Source digest | Target digest row per entry; full 64-hex digests, literal none for absent target, ok/rework/hold. No producer verdict, draw or seed is supplied. Consolidate source packs by the original shard before ordinary application.

A36: reviewer-drawn minimum **4/4** Weak-exact/Judgment entries for this pack, plus every unequal-digest pair. Complete batch: 494 Weak-exact and 1 Judgment; at least 75 Weak-exact plus the sole Judgment overall (per-pack minima can require more). No Unit-exact population exists. Full direct-section text is shown for headings; large single sections may span consecutive block packs, without truncating any unit. Map additions and both rebound anchors are explicitly marked on every affected section row.

```json
{
  "classes": {
    "Unit-exact": [],
    "Weak-exact": [
      "claim_099eb566c825967cf35f9397f2d7b947",
      "claim_3332d3ab8fadd91605a8a92da08091b7",
      "claim_e3bd4567b6cb5b3e9da820c7a01da19a",
      "claim_36f4a3c4ae623f3a348faadd747dcba7"
    ],
    "Judgment": []
  },
  "unequalDigestPairs": [],
  "mapAmendmentIDs": [],
  "reboundAnchorIDs": []
}
```

## claim_099eb566c825967cf35f9397f2d7b947

Source digest: c1c87e9a7f22cc4d3693c5d83d5ecac2fd90fa0386e03fb890638cf059c10de4

Target digest: c1c87e9a7f22cc4d3693c5d83d5ecac2fd90fa0386e03fb890638cf059c10de4

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "edge-cases-settled",
  "sourceLines": [
    1123,
    1123
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)"
  ],
  "targetPath": "docs/platform/runner/subcomponents/h-37aced3896a8/spec.md",
  "targetAnchor": "edge-cases-settled",
  "targetAncestry": [
    "Added in candidate: Runner Edge Cases Settled"
  ],
  "nativeTargetClaimId": "claim_61a63c4d8f9e49a059f603260d9e51fd",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; source unit shorter than 40 characters; document exact share below one half",
  "section": "edge-cases-settled",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_099eb566c825967cf35f9397f2d7b947",
    "sourceUnitDigest": "c1c87e9a7f22cc4d3693c5d83d5ecac2fd90fa0386e03fb890638cf059c10de4",
    "targetOwner": "docs/platform/runner/subcomponents/h-37aced3896a8/spec.md",
    "targetAnchor": "edge-cases-settled",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; source unit shorter than 40 characters; document exact share below one half. Whole heading docs/specs/runner.md#edge-cases-settled (lines 1123–1123) carried at docs/platform/runner/subcomponents/h-37aced3896a8/spec.md#edge-cases-settled. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "c1c87e9a7f22cc4d3693c5d83d5ecac2fd90fa0386e03fb890638cf059c10de4",
    "targetAncestry": [
      "Added in candidate: Runner Edge Cases Settled"
    ]
  }
}
```

### Full source unit

```text
## Edge Cases Settled

- Worker `cli-spawn` chạy trong sandbox (bwrap) chỉ ghi được dưới `runs/<n>/worker-output/outbox`: effective contract và prompt gọi tên claim/report ở đó (không phải thư mục run phẳng, vốn read-only → `EROFS`); collector, reconcile run chết và lần chọn thao tác sau đều tìm claim/report qua cùng một lookup (`worker-output/outbox`, rồi `worker-output`, rồi `outbox`, rồi tên phẳng). herdr-spawn giữ outbox riêng của brief.
- Runner bị giết giữa việc: lần chạy sau gặt lại đúng trạng thái (proof đạt → awaiting-approval, không → blocked), nhánh có ĐÚNG MỘT commit worker — test giết thật.
- Nhánh bị worktree mồ côi giữ (path còn hoặc đã mất) đều đòi lại được — bug thật do e2e bắt sau khi code ship, vá bằng cell fix-first (phase-2-routing-10).
- Đề xuất bị người duyệt trả (`awaiting-approval→todo` kèm lý do): việc vào lại frontier, chống-lặp đếm và chặn lặp vô hạn.
- Kho chưa init / frontier trống: vòng kết thúc sạch, không nghi thức.
- Hai lần chạy chồng lấp: lần hai thoát «bận» — 0 ghi trạng thái, 0 thao tác worktree, khoá của lần một còn nguyên vẹn. Khoá mồ côi (chủ đã chết, hoặc nội dung rác) → lượt gặp nó dọn đi rồi vẫn lui ra «bận»; lượt kế tiếp chiếm khoá sạch và chạy bình thường (sau crash: hai lượt là phục hồi xong).
- Cách ly vị trí của worker có by construction: worktree nằm trong thư mục tạm hệ thống — đường walk-up từ cwd của worker không bao giờ gặp xưởng/harness phát triển.
- `fgos-runner` khởi động trên một repo git 0 commit: dừng ngay ở `validation`, nêu rõ nguyên nhân (HEAD không resolve) + cách sửa (`git commit` trước) — không claim item nào, không chạm bảng phục hồi/retry per-item, cùng phạm trù lỗi với nhánh không-phải-repo-git đã có.
- `fgos-runner` khởi động trên một repo git có ≥1 commit: hành vi không đổi một byte so với trước quyết định này — `resolveRepoRoot` vẫn trả về đúng chuỗi repo root như cũ.
- Việc bị đỗ-lại hoặc bị dừng cũng để lại bản ghi thực tế (outcome) — vòng học nhìn thấy thất bại, không chỉ thành công; đọc lại được qua `fgos metrics outcomes` — chứng minh bằng một lần dispatch thật (không chỉ fixture).
- Quét nghiên-cứu gặp worker sập giữa chừng, hoặc chạy xong mà không để lại commit nào: không crash vòng chạy — item nằm nguyên `discovery`/`todo` cho lượt quét sau thử lại, không bao giờ bị đẩy tiếp âm thầm; lượt chạy vẫn tiếp tục xử các item khác — chứng minh bằng e2e fail-safe qua binary thật.
- Item vừa được quét nghiên-cứu đẩy sang `planning` trong CÙNG lượt chạy: quét chia-việc ngay bên dưới đọc view tươi nên nhặt được nó trong chính lượt đó, không đợi lượt kế tiếp. Nó chỉ đi tiếp tới dispatch trong cùng lượt khi bản kế hoạch của chính nó đã khai là việc một-mảnh; còn lại nó dừng ở `planning` chờ một phiên sống phán tay — chứng minh bằng e2e một lượt `--once` đưa item từ `discovery` tới `planning` với status vẫn `todo` (không bị claim, không bị đề xuất).
- Ngã-ngũ tự động của runner trong một lượt dispatch thật (quét nghiên-cứu, nhận việc, đề xuất, đỗ) đều mang đúng `role` = `runner`; ngã-ngũ đóng tay qua CLI mang `role` = `human` — chứng minh bằng benchmark F4 chạy qua binary thật (không chỉ fixture), round 2: 6/6 tiêu chí đạt.
- `check` chạy hai lần liên tiếp trên cùng kho: lần hai luôn in phần chênh lệch entropy thật so lần một, kể cả khi điểm không đổi (in "+0 so lần trước", không im lặng) — chứng minh bằng benchmark thật.
- Một kênh seal-digest có số đếm khác 0 nhưng chênh lệch bằng 0 (không có gì mới kể từ lần trước) vẫn in ra — chỉ kênh trống tuyệt đối (số đếm 0 VÀ chênh lệch 0) mới im lặng hoàn toàn (bài học rút ra từ một lần khai sai kỳ vọng ở benchmark F4 vòng 1, sửa lại đúng ở vòng 2).
- Item đơn giản đi qua quét nghiên-cứu rồi quét chia-việc trong CÙNG một lượt chạy `--once`: chuỗi `discovery → planning → executing` hoàn tất và item tới `awaiting-approval` trước khi lượt chạy đó kết thúc — với điều kiện bản kế hoạch của nó khai một-mảnh; nếu không, nó dừng ở `planning` chờ người, và đó cũng là kết cục ĐÚNG — chứng minh bằng e2e một lượt duy nhất qua binary thật.
- Một phiên đi qua lớp hướng dẫn giai đoạn (P50) hỏi một item rõ ràng: skill làm-rõ sàng lọc câu hỏi ứng viên không đạt (chỉ ảnh hưởng người-triển-khai) và không tạo cổng chờ-người — item đi thẳng, không hỏi oan (chứng minh bằng case-study 2026-07-20).
- Engine tự phán "chưa đủ rõ" NGAY CẢ với một item khách quan rõ ràng, khi lời gọi phán-đoán bên dưới thất bại vì lý do hạ tầng (không phải vì item mơ hồ) — cổng chờ-người thật vẫn nổi lên đúng theo thiết kế fail-safe (không bao giờ coi phán đoán không chắc là pass); lớp hướng dẫn không tự trả lời thay, escalate đúng luật (chứng minh bằng case-study 2026-07-20, xem Open Gaps).
- Item phức tạp sinh ≥2 con qua một phán quyết chia-việc: gốc bị bộ lọc frontier chặn (lineage qua `parent`, không qua `deps`) cho tới khi cả hai con tới `done`; con cuối đóng xong, gốc tự lọt frontier ở lượt kế tiếp và runner tự chạy verify CỦA CHÍNH GỐC (mang từ lúc rời vòng làm-rõ) làm goal-check — chứng minh bằng e2e qua binary thật, không chỉ fixture.
- Item mơ hồ ở chia-việc (verdict cần người quyết, hoặc gốc mang risk `heavy`): đậu `awaiting-human` mang đề xuất chia làm câu hỏi; người trả lời xong, lượt phán sau phán lại từ đầu (không giữ đề xuất cũ) — chứng minh bằng e2e round-trip qua binary thật, cùng khuôn parity với vòng nghiên-cứu.
- Quét chia-việc không bao giờ tự gọi model, nên không có đường "model trả rác" ở bước này; còn một phán quyết chia tay mà có con thiếu verify thì bị từ chối — gốc ở nguyên trạng thái/stage hiện tại, không con nào được ghi, lượt chạy vẫn tiếp tục xử các item khác.
- Gặt-lại lúc khởi động SKIP một item `doing` mang `claimRole` người/phiên (cửa pull), dù item đó không mang commit/proof nào — nhưng vẫn gặt bình thường một claim mồ côi của chính runner ở cùng lượt gặt (chọn lọc, không phải tắt hẳn gặt-lại) — chứng minh bằng test thật cả hai nhánh trong cùng một pass.
- Một `fgos-runner --once` chạy song song trong khi một người đang cầm item qua cửa pull `take`: gặt-lại của lượt runner đó không đụng vào claim người, và runner cũng không dispatch lại item đã `doing` — chứng minh bằng e2e qua binary thật (submit → pass-through 2 stage → `take` người → `fgos-runner --once` song song → `return` xanh của người, không lượt nào giẫm lượt nào).
- Vòng đủ của một item runner qua cổng duyệt: submit/add → runner dispatch → `awaiting-approval` → `review` → `approve` → merge → `done`, mang settlement role human, bài học câu-6, và dọn nhánh/worktree đều được assert — chứng minh bằng e2e qua binary + git thật.
- Merge conflict thật trên một main đã rẽ nhánh: sau `approve` bị hủy, cây làm việc NGUYÊN VẸN byte-for-byte (HEAD không đổi, tracked tree sạch, nội dung file không đổi) — chứng minh bằng e2e thật, không chỉ spike.
- Vòng đủ của một item pull-door qua cổng duyệt: `take` → commit → `return` → `review` → `approve` (không bước merge) → `done` — chứng minh bằng e2e qua binary thật.
- `reject` một item pull-door: commit của nó vẫn là lịch sử THẬT trên main sau reject (no-auto-revert) — chứng minh bằng e2e thật.
- Hai việc độc lập (không chung gốc, không phụ thuộc nhau) dispatch trong CÙNG một mẻ đều tới đề xuất, và nhật ký sự kiện sau đó dựng lại đúng nguyên vẹn — chứng minh bằng một cửa sổ chồng-lấn THẬT giữa hai việc (không phải suy luận từ thời gian tường trình, vốn cũng đúng cho hai lần chạy tuần tự trông giống song song).
- Quyền-sở-hữu-gốc dưới hai chủ tranh cùng một gốc: chủ thứ hai luôn bị từ chối nhận, không có cửa sổ nào cả hai cùng nhận được cùng lúc — chứng minh bằng kịch bản đối đầu 2 tác nhân trước khi cell dựng thật, giữ nguyên khi dựng thật.
- Nhập xung đột thật ở tầng con→nhánh-của-gốc VÀ ở tầng gốc→cây chính: cả hai hủy sạch bằng đúng một cơ chế đã chứng minh cho việc-độc-lập trước đây — nhánh/cây nguyên vẹn sau khi hủy, không có tầng nào cần cơ chế riêng.
- Đồng bộ-lại thành công thật (đích đổi không đụng cùng chỗ với việc): việc chuyển thẳng từ đỗ về sẵn sàng nộp lại mà không đi qua "đang làm" — chứng minh bằng kịch bản thật, không rút gọn.
- Đồng bộ-lại gặp xung đột thật (đích đổi đụng đúng chỗ với việc): hủy sạch, việc giữ nguyên đỗ, nhánh của việc không đổi tip — chứng minh bằng kịch bản xung đột thật (không phải một xung đột dựng tắt), cùng cơ chế chứng minh cho cả tầng con→gốc lẫn tầng gốc→cây chính.
- Một câu trả lời làm-rõ của người (`answer`) hoặc một reject/park mang `reason` của người reset ngân sách cổng chống-lặp của chính việc đó — việc dispatch lại thay vì bị đỗ dù đã chạm trần trước đó; một resume trần (không `reason`), một `take` của người (không `answer`/`reason`), và mọi park của chính runner (kể cả mang `reason`) KHÔNG reset — chứng minh bằng test thật per-item cho từng hình, cộng một kịch bản tích hợp `runOnce` thật (RUL29 (cổng chống-lặp reset theo can thiệp người cuối cùng của chính việc)).
- Một vòng chỉ-máy-lỗi (không sự kiện người nào) vẫn chết đúng ở trần 3 — reset chỉ xảy ra khi CÓ can thiệp người, không phải mặc định (regression giữ nguyên cùng lúc RUL29 (cổng chống-lặp reset theo can thiệp người cuối cùng của chính việc) được thêm).
- Vòng đủ của một đề xuất nguồn-nhánh từng bị đỗ (chạm trần chống-lặp): người `take` (ghi `branchHeadAtTake`) → commit thêm lên nhánh → `return` đo sạch trên worktree tạm detached tại tip nhánh → `awaiting-approval` mang `branchHeadAtReturn` (không `headAtReturn`) → `review`/`approve` (nguồn đọc là `runner`) → `done` — chứng minh bằng e2e qua binary + git thật (RUL30 (cửa người-hoàn-tất một đề xuất nguồn-nhánh bị đỗ — mở rộng take/return, không verb mới)).
- `return` nguồn-nhánh với nhánh KHÔNG có commit mới kể từ `branchHeadAtTake`: từ chối rõ lý do, việc giữ nguyên `doing`, không đổi tip nhánh — chứng minh bằng test thật.
- `return` nguồn-nhánh trong khi người đang đứng trên chính nhánh `fgw/<id>` đó ở một worktree khác: worktree tạm detached không đụng worktree của người (snapshot trước/sau byte-identical) — chứng minh bằng kịch bản hai-worktree thật, không phải suy luận.

- Đề xuất nguồn runner mở PR qua GitHub (`review --github`) rồi được merge sạch qua `approve --github --pr <n>`: item `done` mang role `human`, cùng khuôn với merge cục bộ — chứng minh bằng test thật qua một `gh` giả tiêm vào tiến trình con thật của CLI (không mock).
- `approve --github` gãy vì lời gọi GitHub thất bại (mọi lý do — xác thực, mạng, giới hạn tần suất, hay chưa rõ): item `blocked` mang lý do cụ thể cộng một bản ghi friction, cùng khuôn `merge-conflict`/`verify-fail-post-merge` — chứng minh bằng test thật.
- `review`/`approve --github` gọi trên một đề xuất KHÔNG phải nguồn runner (pull-door/legacy): từ chối `validation` ngay, không gọi GitHub, đề xuất giữ nguyên trạng thái — chứng minh bằng test thật cho cả hai verb.
- `approve --github` trên một cây làm việc chính đang bẩn (file KHÔNG liên quan đến GitHub còn thay đổi chưa commit): KHÔNG bị chặn bởi phép kiểm cây-sạch của đường cục bộ — phép kiểm đó chỉ áp cho merge cục bộ, không áp cho merge qua GitHub — chứng minh bằng test thật.
- `review --github --pr <n>` trên một PR đã bị đóng KHÔNG merge: nêu đúng số PR, hướng dẫn `fgos reject`, không đổi trạng thái item, không ghi friction — và trả lời trong đúng MỘT lời gọi GitHub dù trường sẵn-sàng-merge của PR đó đọc "chưa rõ" (không chờ-lặp cho phép hỏi thăm này, khác `viewGitHubPRStatus`'s hành vi mặc định) — chứng minh bằng test thật đo số lần gọi GitHub VÀ thời gian chạy.
- `review --github --pr <n>` trên một PR đã merge (kể cả merge thẳng trên GitHub, bỏ qua `approve --github`): chỉ báo tin, không tự đổi trạng thái item cục bộ — chứng minh bằng test thật.
- Một lượt dispatch hỏng vì lý do KHÔNG liên quan tới trợ lý (lỗi worktree, không có output/tier/model) vẫn ghi được một khối vào bản ghi cục bộ, chỉ mang loại lỗi + thông điệp — không throw vì thiếu trường — chứng minh bằng test thật.
- Một việc bị thử lại nhiều lần: mỗi lần thử nối thêm một khối MỚI vào CÙNG bản ghi cục bộ của việc đó, lần thử trước không bị mất — chứng minh bằng test thật.

- Vòng đủ tự-cải-thiện (self-improve loop STR13): một bản ghi friction chưa ngã-ngũ mang từ khóa rủi ro nặng → `evolve` (liệt kê, candidate hiện đủ trường) → `evolve --pick` (đọc-thuần, byte-compare nhật ký trước/sau xác nhận không sự kiện nào bị thêm) → `evolve --submit` (đúng một việc mới, mô tả mang từ khóa) → runner dispatch việc mới đó tới `awaiting-approval` → `review` (source: runner) → `approve` KHÔNG `--acknowledge-iron-law` (item không cha nên target là trunk, và `ironLaw.level` mặc định `ask` — từ chối cứng, nêu tên từ khóa khớp, HEAD không đổi, nhánh còn sống) → `approve --acknowledge-iron-law` (merge, verify xanh, `awaiting-approval → done`, settlement role human, nhánh/worktree dọn sạch) — chứng minh bằng e2e qua binary + git thật, mọi bước tự chạy trong CÙNG file, không dựa vào tham chiếu chéo sang test của cell khác. Hai điều kiện trong ngoặc là điều `0032` làm thành tường minh: cùng diff ấy trên một leaf land vào `fgw/<root>`, hoặc ở `ironLaw.level = "warn"`, không dừng ở bước từ chối.
- `fgos discover <id>` gọi trên một thư mục dự án MỚI, chưa từng có cấu hình runner: không còn chết vì không đọc được cấu hình — cấu hình mặc định được tự viết tại đường mặc định, item đi tiếp vào phán làm-rõ thật (đậu `awaiting-human` khi phán không chắc, đúng fail-safe hiện có, KHÔNG phải một kết quả "thành công" trần trụi) — chứng minh bằng test thật qua binary, PATH của tiến trình phán bị thu hẹp có chủ đích để không gọi trợ lý thật nào trong lúc test. Một `--config` tường minh trỏ đường vắng mặt vẫn báo lỗi ngay như trước, không bao giờ được tự sinh thay (RUL48 (cấu hình runner tự sinh tại đường mặc định khi vắng mặt — không bao giờ đòi người tạo tay trước)).
```

### Full target unit

```text
## Edge Cases Settled

- Worker `cli-spawn` chạy trong sandbox (bwrap) chỉ ghi được dưới `runs/<n>/worker-output/outbox`: effective contract và prompt gọi tên claim/report ở đó (không phải thư mục run phẳng, vốn read-only → `EROFS`); collector, reconcile run chết và lần chọn thao tác sau đều tìm claim/report qua cùng một lookup (`worker-output/outbox`, rồi `worker-output`, rồi `outbox`, rồi tên phẳng). herdr-spawn giữ outbox riêng của brief.
- Runner bị giết giữa việc: lần chạy sau gặt lại đúng trạng thái (proof đạt → awaiting-approval, không → blocked), nhánh có ĐÚNG MỘT commit worker — test giết thật.
- Nhánh bị worktree mồ côi giữ (path còn hoặc đã mất) đều đòi lại được — bug thật do e2e bắt sau khi code ship, vá bằng cell fix-first (phase-2-routing-10).
- Đề xuất bị người duyệt trả (`awaiting-approval→todo` kèm lý do): việc vào lại frontier, chống-lặp đếm và chặn lặp vô hạn.
- Kho chưa init / frontier trống: vòng kết thúc sạch, không nghi thức.
- Hai lần chạy chồng lấp: lần hai thoát «bận» — 0 ghi trạng thái, 0 thao tác worktree, khoá của lần một còn nguyên vẹn. Khoá mồ côi (chủ đã chết, hoặc nội dung rác) → lượt gặp nó dọn đi rồi vẫn lui ra «bận»; lượt kế tiếp chiếm khoá sạch và chạy bình thường (sau crash: hai lượt là phục hồi xong).
- Cách ly vị trí của worker có by construction: worktree nằm trong thư mục tạm hệ thống — đường walk-up từ cwd của worker không bao giờ gặp xưởng/harness phát triển.
- `fgos-runner` khởi động trên một repo git 0 commit: dừng ngay ở `validation`, nêu rõ nguyên nhân (HEAD không resolve) + cách sửa (`git commit` trước) — không claim item nào, không chạm bảng phục hồi/retry per-item, cùng phạm trù lỗi với nhánh không-phải-repo-git đã có.
- `fgos-runner` khởi động trên một repo git có ≥1 commit: hành vi không đổi một byte so với trước quyết định này — `resolveRepoRoot` vẫn trả về đúng chuỗi repo root như cũ.
- Việc bị đỗ-lại hoặc bị dừng cũng để lại bản ghi thực tế (outcome) — vòng học nhìn thấy thất bại, không chỉ thành công; đọc lại được qua `fgos metrics outcomes` — chứng minh bằng một lần dispatch thật (không chỉ fixture).
- Quét nghiên-cứu gặp worker sập giữa chừng, hoặc chạy xong mà không để lại commit nào: không crash vòng chạy — item nằm nguyên `discovery`/`todo` cho lượt quét sau thử lại, không bao giờ bị đẩy tiếp âm thầm; lượt chạy vẫn tiếp tục xử các item khác — chứng minh bằng e2e fail-safe qua binary thật.
- Item vừa được quét nghiên-cứu đẩy sang `planning` trong CÙNG lượt chạy: quét chia-việc ngay bên dưới đọc view tươi nên nhặt được nó trong chính lượt đó, không đợi lượt kế tiếp. Nó chỉ đi tiếp tới dispatch trong cùng lượt khi bản kế hoạch của chính nó đã khai là việc một-mảnh; còn lại nó dừng ở `planning` chờ một phiên sống phán tay — chứng minh bằng e2e một lượt `--once` đưa item từ `discovery` tới `planning` với status vẫn `todo` (không bị claim, không bị đề xuất).
- Ngã-ngũ tự động của runner trong một lượt dispatch thật (quét nghiên-cứu, nhận việc, đề xuất, đỗ) đều mang đúng `role` = `runner`; ngã-ngũ đóng tay qua CLI mang `role` = `human` — chứng minh bằng benchmark F4 chạy qua binary thật (không chỉ fixture), round 2: 6/6 tiêu chí đạt.
- `check` chạy hai lần liên tiếp trên cùng kho: lần hai luôn in phần chênh lệch entropy thật so lần một, kể cả khi điểm không đổi (in "+0 so lần trước", không im lặng) — chứng minh bằng benchmark thật.
- Một kênh seal-digest có số đếm khác 0 nhưng chênh lệch bằng 0 (không có gì mới kể từ lần trước) vẫn in ra — chỉ kênh trống tuyệt đối (số đếm 0 VÀ chênh lệch 0) mới im lặng hoàn toàn (bài học rút ra từ một lần khai sai kỳ vọng ở benchmark F4 vòng 1, sửa lại đúng ở vòng 2).
- Item đơn giản đi qua quét nghiên-cứu rồi quét chia-việc trong CÙNG một lượt chạy `--once`: chuỗi `discovery → planning → executing` hoàn tất và item tới `awaiting-approval` trước khi lượt chạy đó kết thúc — với điều kiện bản kế hoạch của nó khai một-mảnh; nếu không, nó dừng ở `planning` chờ người, và đó cũng là kết cục ĐÚNG — chứng minh bằng e2e một lượt duy nhất qua binary thật.
- Một phiên đi qua lớp hướng dẫn giai đoạn (P50) hỏi một item rõ ràng: skill làm-rõ sàng lọc câu hỏi ứng viên không đạt (chỉ ảnh hưởng người-triển-khai) và không tạo cổng chờ-người — item đi thẳng, không hỏi oan (chứng minh bằng case-study 2026-07-20).
- Engine tự phán "chưa đủ rõ" NGAY CẢ với một item khách quan rõ ràng, khi lời gọi phán-đoán bên dưới thất bại vì lý do hạ tầng (không phải vì item mơ hồ) — cổng chờ-người thật vẫn nổi lên đúng theo thiết kế fail-safe (không bao giờ coi phán đoán không chắc là pass); lớp hướng dẫn không tự trả lời thay, escalate đúng luật (chứng minh bằng case-study 2026-07-20, xem Open Gaps).
- Item phức tạp sinh ≥2 con qua một phán quyết chia-việc: gốc bị bộ lọc frontier chặn (lineage qua `parent`, không qua `deps`) cho tới khi cả hai con tới `done`; con cuối đóng xong, gốc tự lọt frontier ở lượt kế tiếp và runner tự chạy verify CỦA CHÍNH GỐC (mang từ lúc rời vòng làm-rõ) làm goal-check — chứng minh bằng e2e qua binary thật, không chỉ fixture.
- Item mơ hồ ở chia-việc (verdict cần người quyết, hoặc gốc mang risk `heavy`): đậu `awaiting-human` mang đề xuất chia làm câu hỏi; người trả lời xong, lượt phán sau phán lại từ đầu (không giữ đề xuất cũ) — chứng minh bằng e2e round-trip qua binary thật, cùng khuôn parity với vòng nghiên-cứu.
- Quét chia-việc không bao giờ tự gọi model, nên không có đường "model trả rác" ở bước này; còn một phán quyết chia tay mà có con thiếu verify thì bị từ chối — gốc ở nguyên trạng thái/stage hiện tại, không con nào được ghi, lượt chạy vẫn tiếp tục xử các item khác.
- Gặt-lại lúc khởi động SKIP một item `doing` mang `claimRole` người/phiên (cửa pull), dù item đó không mang commit/proof nào — nhưng vẫn gặt bình thường một claim mồ côi của chính runner ở cùng lượt gặt (chọn lọc, không phải tắt hẳn gặt-lại) — chứng minh bằng test thật cả hai nhánh trong cùng một pass.
- Một `fgos-runner --once` chạy song song trong khi một người đang cầm item qua cửa pull `take`: gặt-lại của lượt runner đó không đụng vào claim người, và runner cũng không dispatch lại item đã `doing` — chứng minh bằng e2e qua binary thật (submit → pass-through 2 stage → `take` người → `fgos-runner --once` song song → `return` xanh của người, không lượt nào giẫm lượt nào).
- Vòng đủ của một item runner qua cổng duyệt: submit/add → runner dispatch → `awaiting-approval` → `review` → `approve` → merge → `done`, mang settlement role human, bài học câu-6, và dọn nhánh/worktree đều được assert — chứng minh bằng e2e qua binary + git thật.
- Merge conflict thật trên một main đã rẽ nhánh: sau `approve` bị hủy, cây làm việc NGUYÊN VẸN byte-for-byte (HEAD không đổi, tracked tree sạch, nội dung file không đổi) — chứng minh bằng e2e thật, không chỉ spike.
- Vòng đủ của một item pull-door qua cổng duyệt: `take` → commit → `return` → `review` → `approve` (không bước merge) → `done` — chứng minh bằng e2e qua binary thật.
- `reject` một item pull-door: commit của nó vẫn là lịch sử THẬT trên main sau reject (no-auto-revert) — chứng minh bằng e2e thật.
- Hai việc độc lập (không chung gốc, không phụ thuộc nhau) dispatch trong CÙNG một mẻ đều tới đề xuất, và nhật ký sự kiện sau đó dựng lại đúng nguyên vẹn — chứng minh bằng một cửa sổ chồng-lấn THẬT giữa hai việc (không phải suy luận từ thời gian tường trình, vốn cũng đúng cho hai lần chạy tuần tự trông giống song song).
- Quyền-sở-hữu-gốc dưới hai chủ tranh cùng một gốc: chủ thứ hai luôn bị từ chối nhận, không có cửa sổ nào cả hai cùng nhận được cùng lúc — chứng minh bằng kịch bản đối đầu 2 tác nhân trước khi cell dựng thật, giữ nguyên khi dựng thật.
- Nhập xung đột thật ở tầng con→nhánh-của-gốc VÀ ở tầng gốc→cây chính: cả hai hủy sạch bằng đúng một cơ chế đã chứng minh cho việc-độc-lập trước đây — nhánh/cây nguyên vẹn sau khi hủy, không có tầng nào cần cơ chế riêng.
- Đồng bộ-lại thành công thật (đích đổi không đụng cùng chỗ với việc): việc chuyển thẳng từ đỗ về sẵn sàng nộp lại mà không đi qua "đang làm" — chứng minh bằng kịch bản thật, không rút gọn.
- Đồng bộ-lại gặp xung đột thật (đích đổi đụng đúng chỗ với việc): hủy sạch, việc giữ nguyên đỗ, nhánh của việc không đổi tip — chứng minh bằng kịch bản xung đột thật (không phải một xung đột dựng tắt), cùng cơ chế chứng minh cho cả tầng con→gốc lẫn tầng gốc→cây chính.
- Một câu trả lời làm-rõ của người (`answer`) hoặc một reject/park mang `reason` của người reset ngân sách cổng chống-lặp của chính việc đó — việc dispatch lại thay vì bị đỗ dù đã chạm trần trước đó; một resume trần (không `reason`), một `take` của người (không `answer`/`reason`), và mọi park của chính runner (kể cả mang `reason`) KHÔNG reset — chứng minh bằng test thật per-item cho từng hình, cộng một kịch bản tích hợp `runOnce` thật (RUL29 (cổng chống-lặp reset theo can thiệp người cuối cùng của chính việc)).
- Một vòng chỉ-máy-lỗi (không sự kiện người nào) vẫn chết đúng ở trần 3 — reset chỉ xảy ra khi CÓ can thiệp người, không phải mặc định (regression giữ nguyên cùng lúc RUL29 (cổng chống-lặp reset theo can thiệp người cuối cùng của chính việc) được thêm).
- Vòng đủ của một đề xuất nguồn-nhánh từng bị đỗ (chạm trần chống-lặp): người `take` (ghi `branchHeadAtTake`) → commit thêm lên nhánh → `return` đo sạch trên worktree tạm detached tại tip nhánh → `awaiting-approval` mang `branchHeadAtReturn` (không `headAtReturn`) → `review`/`approve` (nguồn đọc là `runner`) → `done` — chứng minh bằng e2e qua binary + git thật (RUL30 (cửa người-hoàn-tất một đề xuất nguồn-nhánh bị đỗ — mở rộng take/return, không verb mới)).
- `return` nguồn-nhánh với nhánh KHÔNG có commit mới kể từ `branchHeadAtTake`: từ chối rõ lý do, việc giữ nguyên `doing`, không đổi tip nhánh — chứng minh bằng test thật.
- `return` nguồn-nhánh trong khi người đang đứng trên chính nhánh `fgw/<id>` đó ở một worktree khác: worktree tạm detached không đụng worktree của người (snapshot trước/sau byte-identical) — chứng minh bằng kịch bản hai-worktree thật, không phải suy luận.

- Đề xuất nguồn runner mở PR qua GitHub (`review --github`) rồi được merge sạch qua `approve --github --pr <n>`: item `done` mang role `human`, cùng khuôn với merge cục bộ — chứng minh bằng test thật qua một `gh` giả tiêm vào tiến trình con thật của CLI (không mock).
- `approve --github` gãy vì lời gọi GitHub thất bại (mọi lý do — xác thực, mạng, giới hạn tần suất, hay chưa rõ): item `blocked` mang lý do cụ thể cộng một bản ghi friction, cùng khuôn `merge-conflict`/`verify-fail-post-merge` — chứng minh bằng test thật.
- `review`/`approve --github` gọi trên một đề xuất KHÔNG phải nguồn runner (pull-door/legacy): từ chối `validation` ngay, không gọi GitHub, đề xuất giữ nguyên trạng thái — chứng minh bằng test thật cho cả hai verb.
- `approve --github` trên một cây làm việc chính đang bẩn (file KHÔNG liên quan đến GitHub còn thay đổi chưa commit): KHÔNG bị chặn bởi phép kiểm cây-sạch của đường cục bộ — phép kiểm đó chỉ áp cho merge cục bộ, không áp cho merge qua GitHub — chứng minh bằng test thật.
- `review --github --pr <n>` trên một PR đã bị đóng KHÔNG merge: nêu đúng số PR, hướng dẫn `fgos reject`, không đổi trạng thái item, không ghi friction — và trả lời trong đúng MỘT lời gọi GitHub dù trường sẵn-sàng-merge của PR đó đọc "chưa rõ" (không chờ-lặp cho phép hỏi thăm này, khác `viewGitHubPRStatus`'s hành vi mặc định) — chứng minh bằng test thật đo số lần gọi GitHub VÀ thời gian chạy.
- `review --github --pr <n>` trên một PR đã merge (kể cả merge thẳng trên GitHub, bỏ qua `approve --github`): chỉ báo tin, không tự đổi trạng thái item cục bộ — chứng minh bằng test thật.
- Một lượt dispatch hỏng vì lý do KHÔNG liên quan tới trợ lý (lỗi worktree, không có output/tier/model) vẫn ghi được một khối vào bản ghi cục bộ, chỉ mang loại lỗi + thông điệp — không throw vì thiếu trường — chứng minh bằng test thật.
- Một việc bị thử lại nhiều lần: mỗi lần thử nối thêm một khối MỚI vào CÙNG bản ghi cục bộ của việc đó, lần thử trước không bị mất — chứng minh bằng test thật.

- Vòng đủ tự-cải-thiện (self-improve loop STR13): một bản ghi friction chưa ngã-ngũ mang từ khóa rủi ro nặng → `evolve` (liệt kê, candidate hiện đủ trường) → `evolve --pick` (đọc-thuần, byte-compare nhật ký trước/sau xác nhận không sự kiện nào bị thêm) → `evolve --submit` (đúng một việc mới, mô tả mang từ khóa) → runner dispatch việc mới đó tới `awaiting-approval` → `review` (source: runner) → `approve` KHÔNG `--acknowledge-iron-law` (item không cha nên target là trunk, và `ironLaw.level` mặc định `ask` — từ chối cứng, nêu tên từ khóa khớp, HEAD không đổi, nhánh còn sống) → `approve --acknowledge-iron-law` (merge, verify xanh, `awaiting-approval → done`, settlement role human, nhánh/worktree dọn sạch) — chứng minh bằng e2e qua binary + git thật, mọi bước tự chạy trong CÙNG file, không dựa vào tham chiếu chéo sang test của cell khác. Hai điều kiện trong ngoặc là điều `0032` làm thành tường minh: cùng diff ấy trên một leaf land vào `fgw/<root>`, hoặc ở `ironLaw.level = "warn"`, không dừng ở bước từ chối.
- `fgos discover <id>` gọi trên một thư mục dự án MỚI, chưa từng có cấu hình runner: không còn chết vì không đọc được cấu hình — cấu hình mặc định được tự viết tại đường mặc định, item đi tiếp vào phán làm-rõ thật (đậu `awaiting-human` khi phán không chắc, đúng fail-safe hiện có, KHÔNG phải một kết quả "thành công" trần trụi) — chứng minh bằng test thật qua binary, PATH của tiến trình phán bị thu hẹp có chủ đích để không gọi trợ lý thật nào trong lúc test. Một `--config` tường minh trỏ đường vắng mặt vẫn báo lỗi ngay như trước, không bao giờ được tự sinh thay (RUL48 (cấu hình runner tự sinh tại đường mặc định khi vắng mặt — không bao giờ đòi người tạo tay trước)).
```

### Full diff

```diff
No text difference.
```

## claim_3332d3ab8fadd91605a8a92da08091b7

Source digest: 968a9e65860acfe7d1f346e7b8de178845f40688a634e6cbef5c7e3d2c2841a2

Target digest: 968a9e65860acfe7d1f346e7b8de178845f40688a634e6cbef5c7e3d2c2841a2

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-95",
  "sourceLines": [
    1125,
    1161
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Edge Cases Settled"
  ],
  "targetPath": "docs/platform/runner/subcomponents/h-37aced3896a8/spec.md",
  "targetAnchor": "unheaded-block-3",
  "targetAncestry": [
    "Added in candidate: Runner Edge Cases Settled",
    "Edge Cases Settled"
  ],
  "nativeTargetClaimId": "claim_91466aa7d6552d15ecf0a4cd52930432",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; document exact share below one half",
  "section": "edge-cases-settled",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_3332d3ab8fadd91605a8a92da08091b7",
    "sourceUnitDigest": "968a9e65860acfe7d1f346e7b8de178845f40688a634e6cbef5c7e3d2c2841a2",
    "targetOwner": "docs/platform/runner/subcomponents/h-37aced3896a8/spec.md",
    "targetAnchor": "unheaded-block-3",
    "claimKind": "contract",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. Whole unheaded-block docs/specs/runner.md#unheaded-block-95 (lines 1125–1161) carried at docs/platform/runner/subcomponents/h-37aced3896a8/spec.md#unheaded-block-3. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "968a9e65860acfe7d1f346e7b8de178845f40688a634e6cbef5c7e3d2c2841a2",
    "targetAncestry": [
      "Added in candidate: Runner Edge Cases Settled",
      "Edge Cases Settled"
    ]
  }
}
```

### Full source unit

```text
- Worker `cli-spawn` chạy trong sandbox (bwrap) chỉ ghi được dưới `runs/<n>/worker-output/outbox`: effective contract và prompt gọi tên claim/report ở đó (không phải thư mục run phẳng, vốn read-only → `EROFS`); collector, reconcile run chết và lần chọn thao tác sau đều tìm claim/report qua cùng một lookup (`worker-output/outbox`, rồi `worker-output`, rồi `outbox`, rồi tên phẳng). herdr-spawn giữ outbox riêng của brief.
- Runner bị giết giữa việc: lần chạy sau gặt lại đúng trạng thái (proof đạt → awaiting-approval, không → blocked), nhánh có ĐÚNG MỘT commit worker — test giết thật.
- Nhánh bị worktree mồ côi giữ (path còn hoặc đã mất) đều đòi lại được — bug thật do e2e bắt sau khi code ship, vá bằng cell fix-first (phase-2-routing-10).
- Đề xuất bị người duyệt trả (`awaiting-approval→todo` kèm lý do): việc vào lại frontier, chống-lặp đếm và chặn lặp vô hạn.
- Kho chưa init / frontier trống: vòng kết thúc sạch, không nghi thức.
- Hai lần chạy chồng lấp: lần hai thoát «bận» — 0 ghi trạng thái, 0 thao tác worktree, khoá của lần một còn nguyên vẹn. Khoá mồ côi (chủ đã chết, hoặc nội dung rác) → lượt gặp nó dọn đi rồi vẫn lui ra «bận»; lượt kế tiếp chiếm khoá sạch và chạy bình thường (sau crash: hai lượt là phục hồi xong).
- Cách ly vị trí của worker có by construction: worktree nằm trong thư mục tạm hệ thống — đường walk-up từ cwd của worker không bao giờ gặp xưởng/harness phát triển.
- `fgos-runner` khởi động trên một repo git 0 commit: dừng ngay ở `validation`, nêu rõ nguyên nhân (HEAD không resolve) + cách sửa (`git commit` trước) — không claim item nào, không chạm bảng phục hồi/retry per-item, cùng phạm trù lỗi với nhánh không-phải-repo-git đã có.
- `fgos-runner` khởi động trên một repo git có ≥1 commit: hành vi không đổi một byte so với trước quyết định này — `resolveRepoRoot` vẫn trả về đúng chuỗi repo root như cũ.
- Việc bị đỗ-lại hoặc bị dừng cũng để lại bản ghi thực tế (outcome) — vòng học nhìn thấy thất bại, không chỉ thành công; đọc lại được qua `fgos metrics outcomes` — chứng minh bằng một lần dispatch thật (không chỉ fixture).
- Quét nghiên-cứu gặp worker sập giữa chừng, hoặc chạy xong mà không để lại commit nào: không crash vòng chạy — item nằm nguyên `discovery`/`todo` cho lượt quét sau thử lại, không bao giờ bị đẩy tiếp âm thầm; lượt chạy vẫn tiếp tục xử các item khác — chứng minh bằng e2e fail-safe qua binary thật.
- Item vừa được quét nghiên-cứu đẩy sang `planning` trong CÙNG lượt chạy: quét chia-việc ngay bên dưới đọc view tươi nên nhặt được nó trong chính lượt đó, không đợi lượt kế tiếp. Nó chỉ đi tiếp tới dispatch trong cùng lượt khi bản kế hoạch của chính nó đã khai là việc một-mảnh; còn lại nó dừng ở `planning` chờ một phiên sống phán tay — chứng minh bằng e2e một lượt `--once` đưa item từ `discovery` tới `planning` với status vẫn `todo` (không bị claim, không bị đề xuất).
- Ngã-ngũ tự động của runner trong một lượt dispatch thật (quét nghiên-cứu, nhận việc, đề xuất, đỗ) đều mang đúng `role` = `runner`; ngã-ngũ đóng tay qua CLI mang `role` = `human` — chứng minh bằng benchmark F4 chạy qua binary thật (không chỉ fixture), round 2: 6/6 tiêu chí đạt.
- `check` chạy hai lần liên tiếp trên cùng kho: lần hai luôn in phần chênh lệch entropy thật so lần một, kể cả khi điểm không đổi (in "+0 so lần trước", không im lặng) — chứng minh bằng benchmark thật.
- Một kênh seal-digest có số đếm khác 0 nhưng chênh lệch bằng 0 (không có gì mới kể từ lần trước) vẫn in ra — chỉ kênh trống tuyệt đối (số đếm 0 VÀ chênh lệch 0) mới im lặng hoàn toàn (bài học rút ra từ một lần khai sai kỳ vọng ở benchmark F4 vòng 1, sửa lại đúng ở vòng 2).
- Item đơn giản đi qua quét nghiên-cứu rồi quét chia-việc trong CÙNG một lượt chạy `--once`: chuỗi `discovery → planning → executing` hoàn tất và item tới `awaiting-approval` trước khi lượt chạy đó kết thúc — với điều kiện bản kế hoạch của nó khai một-mảnh; nếu không, nó dừng ở `planning` chờ người, và đó cũng là kết cục ĐÚNG — chứng minh bằng e2e một lượt duy nhất qua binary thật.
- Một phiên đi qua lớp hướng dẫn giai đoạn (P50) hỏi một item rõ ràng: skill làm-rõ sàng lọc câu hỏi ứng viên không đạt (chỉ ảnh hưởng người-triển-khai) và không tạo cổng chờ-người — item đi thẳng, không hỏi oan (chứng minh bằng case-study 2026-07-20).
- Engine tự phán "chưa đủ rõ" NGAY CẢ với một item khách quan rõ ràng, khi lời gọi phán-đoán bên dưới thất bại vì lý do hạ tầng (không phải vì item mơ hồ) — cổng chờ-người thật vẫn nổi lên đúng theo thiết kế fail-safe (không bao giờ coi phán đoán không chắc là pass); lớp hướng dẫn không tự trả lời thay, escalate đúng luật (chứng minh bằng case-study 2026-07-20, xem Open Gaps).
- Item phức tạp sinh ≥2 con qua một phán quyết chia-việc: gốc bị bộ lọc frontier chặn (lineage qua `parent`, không qua `deps`) cho tới khi cả hai con tới `done`; con cuối đóng xong, gốc tự lọt frontier ở lượt kế tiếp và runner tự chạy verify CỦA CHÍNH GỐC (mang từ lúc rời vòng làm-rõ) làm goal-check — chứng minh bằng e2e qua binary thật, không chỉ fixture.
- Item mơ hồ ở chia-việc (verdict cần người quyết, hoặc gốc mang risk `heavy`): đậu `awaiting-human` mang đề xuất chia làm câu hỏi; người trả lời xong, lượt phán sau phán lại từ đầu (không giữ đề xuất cũ) — chứng minh bằng e2e round-trip qua binary thật, cùng khuôn parity với vòng nghiên-cứu.
- Quét chia-việc không bao giờ tự gọi model, nên không có đường "model trả rác" ở bước này; còn một phán quyết chia tay mà có con thiếu verify thì bị từ chối — gốc ở nguyên trạng thái/stage hiện tại, không con nào được ghi, lượt chạy vẫn tiếp tục xử các item khác.
- Gặt-lại lúc khởi động SKIP một item `doing` mang `claimRole` người/phiên (cửa pull), dù item đó không mang commit/proof nào — nhưng vẫn gặt bình thường một claim mồ côi của chính runner ở cùng lượt gặt (chọn lọc, không phải tắt hẳn gặt-lại) — chứng minh bằng test thật cả hai nhánh trong cùng một pass.
- Một `fgos-runner --once` chạy song song trong khi một người đang cầm item qua cửa pull `take`: gặt-lại của lượt runner đó không đụng vào claim người, và runner cũng không dispatch lại item đã `doing` — chứng minh bằng e2e qua binary thật (submit → pass-through 2 stage → `take` người → `fgos-runner --once` song song → `return` xanh của người, không lượt nào giẫm lượt nào).
- Vòng đủ của một item runner qua cổng duyệt: submit/add → runner dispatch → `awaiting-approval` → `review` → `approve` → merge → `done`, mang settlement role human, bài học câu-6, và dọn nhánh/worktree đều được assert — chứng minh bằng e2e qua binary + git thật.
- Merge conflict thật trên một main đã rẽ nhánh: sau `approve` bị hủy, cây làm việc NGUYÊN VẸN byte-for-byte (HEAD không đổi, tracked tree sạch, nội dung file không đổi) — chứng minh bằng e2e thật, không chỉ spike.
- Vòng đủ của một item pull-door qua cổng duyệt: `take` → commit → `return` → `review` → `approve` (không bước merge) → `done` — chứng minh bằng e2e qua binary thật.
- `reject` một item pull-door: commit của nó vẫn là lịch sử THẬT trên main sau reject (no-auto-revert) — chứng minh bằng e2e thật.
- Hai việc độc lập (không chung gốc, không phụ thuộc nhau) dispatch trong CÙNG một mẻ đều tới đề xuất, và nhật ký sự kiện sau đó dựng lại đúng nguyên vẹn — chứng minh bằng một cửa sổ chồng-lấn THẬT giữa hai việc (không phải suy luận từ thời gian tường trình, vốn cũng đúng cho hai lần chạy tuần tự trông giống song song).
- Quyền-sở-hữu-gốc dưới hai chủ tranh cùng một gốc: chủ thứ hai luôn bị từ chối nhận, không có cửa sổ nào cả hai cùng nhận được cùng lúc — chứng minh bằng kịch bản đối đầu 2 tác nhân trước khi cell dựng thật, giữ nguyên khi dựng thật.
- Nhập xung đột thật ở tầng con→nhánh-của-gốc VÀ ở tầng gốc→cây chính: cả hai hủy sạch bằng đúng một cơ chế đã chứng minh cho việc-độc-lập trước đây — nhánh/cây nguyên vẹn sau khi hủy, không có tầng nào cần cơ chế riêng.
- Đồng bộ-lại thành công thật (đích đổi không đụng cùng chỗ với việc): việc chuyển thẳng từ đỗ về sẵn sàng nộp lại mà không đi qua "đang làm" — chứng minh bằng kịch bản thật, không rút gọn.
- Đồng bộ-lại gặp xung đột thật (đích đổi đụng đúng chỗ với việc): hủy sạch, việc giữ nguyên đỗ, nhánh của việc không đổi tip — chứng minh bằng kịch bản xung đột thật (không phải một xung đột dựng tắt), cùng cơ chế chứng minh cho cả tầng con→gốc lẫn tầng gốc→cây chính.
- Một câu trả lời làm-rõ của người (`answer`) hoặc một reject/park mang `reason` của người reset ngân sách cổng chống-lặp của chính việc đó — việc dispatch lại thay vì bị đỗ dù đã chạm trần trước đó; một resume trần (không `reason`), một `take` của người (không `answer`/`reason`), và mọi park của chính runner (kể cả mang `reason`) KHÔNG reset — chứng minh bằng test thật per-item cho từng hình, cộng một kịch bản tích hợp `runOnce` thật (RUL29 (cổng chống-lặp reset theo can thiệp người cuối cùng của chính việc)).
- Một vòng chỉ-máy-lỗi (không sự kiện người nào) vẫn chết đúng ở trần 3 — reset chỉ xảy ra khi CÓ can thiệp người, không phải mặc định (regression giữ nguyên cùng lúc RUL29 (cổng chống-lặp reset theo can thiệp người cuối cùng của chính việc) được thêm).
- Vòng đủ của một đề xuất nguồn-nhánh từng bị đỗ (chạm trần chống-lặp): người `take` (ghi `branchHeadAtTake`) → commit thêm lên nhánh → `return` đo sạch trên worktree tạm detached tại tip nhánh → `awaiting-approval` mang `branchHeadAtReturn` (không `headAtReturn`) → `review`/`approve` (nguồn đọc là `runner`) → `done` — chứng minh bằng e2e qua binary + git thật (RUL30 (cửa người-hoàn-tất một đề xuất nguồn-nhánh bị đỗ — mở rộng take/return, không verb mới)).
- `return` nguồn-nhánh với nhánh KHÔNG có commit mới kể từ `branchHeadAtTake`: từ chối rõ lý do, việc giữ nguyên `doing`, không đổi tip nhánh — chứng minh bằng test thật.
- `return` nguồn-nhánh trong khi người đang đứng trên chính nhánh `fgw/<id>` đó ở một worktree khác: worktree tạm detached không đụng worktree của người (snapshot trước/sau byte-identical) — chứng minh bằng kịch bản hai-worktree thật, không phải suy luận.
```

### Full target unit

```text
- Worker `cli-spawn` chạy trong sandbox (bwrap) chỉ ghi được dưới `runs/<n>/worker-output/outbox`: effective contract và prompt gọi tên claim/report ở đó (không phải thư mục run phẳng, vốn read-only → `EROFS`); collector, reconcile run chết và lần chọn thao tác sau đều tìm claim/report qua cùng một lookup (`worker-output/outbox`, rồi `worker-output`, rồi `outbox`, rồi tên phẳng). herdr-spawn giữ outbox riêng của brief.
- Runner bị giết giữa việc: lần chạy sau gặt lại đúng trạng thái (proof đạt → awaiting-approval, không → blocked), nhánh có ĐÚNG MỘT commit worker — test giết thật.
- Nhánh bị worktree mồ côi giữ (path còn hoặc đã mất) đều đòi lại được — bug thật do e2e bắt sau khi code ship, vá bằng cell fix-first (phase-2-routing-10).
- Đề xuất bị người duyệt trả (`awaiting-approval→todo` kèm lý do): việc vào lại frontier, chống-lặp đếm và chặn lặp vô hạn.
- Kho chưa init / frontier trống: vòng kết thúc sạch, không nghi thức.
- Hai lần chạy chồng lấp: lần hai thoát «bận» — 0 ghi trạng thái, 0 thao tác worktree, khoá của lần một còn nguyên vẹn. Khoá mồ côi (chủ đã chết, hoặc nội dung rác) → lượt gặp nó dọn đi rồi vẫn lui ra «bận»; lượt kế tiếp chiếm khoá sạch và chạy bình thường (sau crash: hai lượt là phục hồi xong).
- Cách ly vị trí của worker có by construction: worktree nằm trong thư mục tạm hệ thống — đường walk-up từ cwd của worker không bao giờ gặp xưởng/harness phát triển.
- `fgos-runner` khởi động trên một repo git 0 commit: dừng ngay ở `validation`, nêu rõ nguyên nhân (HEAD không resolve) + cách sửa (`git commit` trước) — không claim item nào, không chạm bảng phục hồi/retry per-item, cùng phạm trù lỗi với nhánh không-phải-repo-git đã có.
- `fgos-runner` khởi động trên một repo git có ≥1 commit: hành vi không đổi một byte so với trước quyết định này — `resolveRepoRoot` vẫn trả về đúng chuỗi repo root như cũ.
- Việc bị đỗ-lại hoặc bị dừng cũng để lại bản ghi thực tế (outcome) — vòng học nhìn thấy thất bại, không chỉ thành công; đọc lại được qua `fgos metrics outcomes` — chứng minh bằng một lần dispatch thật (không chỉ fixture).
- Quét nghiên-cứu gặp worker sập giữa chừng, hoặc chạy xong mà không để lại commit nào: không crash vòng chạy — item nằm nguyên `discovery`/`todo` cho lượt quét sau thử lại, không bao giờ bị đẩy tiếp âm thầm; lượt chạy vẫn tiếp tục xử các item khác — chứng minh bằng e2e fail-safe qua binary thật.
- Item vừa được quét nghiên-cứu đẩy sang `planning` trong CÙNG lượt chạy: quét chia-việc ngay bên dưới đọc view tươi nên nhặt được nó trong chính lượt đó, không đợi lượt kế tiếp. Nó chỉ đi tiếp tới dispatch trong cùng lượt khi bản kế hoạch của chính nó đã khai là việc một-mảnh; còn lại nó dừng ở `planning` chờ một phiên sống phán tay — chứng minh bằng e2e một lượt `--once` đưa item từ `discovery` tới `planning` với status vẫn `todo` (không bị claim, không bị đề xuất).
- Ngã-ngũ tự động của runner trong một lượt dispatch thật (quét nghiên-cứu, nhận việc, đề xuất, đỗ) đều mang đúng `role` = `runner`; ngã-ngũ đóng tay qua CLI mang `role` = `human` — chứng minh bằng benchmark F4 chạy qua binary thật (không chỉ fixture), round 2: 6/6 tiêu chí đạt.
- `check` chạy hai lần liên tiếp trên cùng kho: lần hai luôn in phần chênh lệch entropy thật so lần một, kể cả khi điểm không đổi (in "+0 so lần trước", không im lặng) — chứng minh bằng benchmark thật.
- Một kênh seal-digest có số đếm khác 0 nhưng chênh lệch bằng 0 (không có gì mới kể từ lần trước) vẫn in ra — chỉ kênh trống tuyệt đối (số đếm 0 VÀ chênh lệch 0) mới im lặng hoàn toàn (bài học rút ra từ một lần khai sai kỳ vọng ở benchmark F4 vòng 1, sửa lại đúng ở vòng 2).
- Item đơn giản đi qua quét nghiên-cứu rồi quét chia-việc trong CÙNG một lượt chạy `--once`: chuỗi `discovery → planning → executing` hoàn tất và item tới `awaiting-approval` trước khi lượt chạy đó kết thúc — với điều kiện bản kế hoạch của nó khai một-mảnh; nếu không, nó dừng ở `planning` chờ người, và đó cũng là kết cục ĐÚNG — chứng minh bằng e2e một lượt duy nhất qua binary thật.
- Một phiên đi qua lớp hướng dẫn giai đoạn (P50) hỏi một item rõ ràng: skill làm-rõ sàng lọc câu hỏi ứng viên không đạt (chỉ ảnh hưởng người-triển-khai) và không tạo cổng chờ-người — item đi thẳng, không hỏi oan (chứng minh bằng case-study 2026-07-20).
- Engine tự phán "chưa đủ rõ" NGAY CẢ với một item khách quan rõ ràng, khi lời gọi phán-đoán bên dưới thất bại vì lý do hạ tầng (không phải vì item mơ hồ) — cổng chờ-người thật vẫn nổi lên đúng theo thiết kế fail-safe (không bao giờ coi phán đoán không chắc là pass); lớp hướng dẫn không tự trả lời thay, escalate đúng luật (chứng minh bằng case-study 2026-07-20, xem Open Gaps).
- Item phức tạp sinh ≥2 con qua một phán quyết chia-việc: gốc bị bộ lọc frontier chặn (lineage qua `parent`, không qua `deps`) cho tới khi cả hai con tới `done`; con cuối đóng xong, gốc tự lọt frontier ở lượt kế tiếp và runner tự chạy verify CỦA CHÍNH GỐC (mang từ lúc rời vòng làm-rõ) làm goal-check — chứng minh bằng e2e qua binary thật, không chỉ fixture.
- Item mơ hồ ở chia-việc (verdict cần người quyết, hoặc gốc mang risk `heavy`): đậu `awaiting-human` mang đề xuất chia làm câu hỏi; người trả lời xong, lượt phán sau phán lại từ đầu (không giữ đề xuất cũ) — chứng minh bằng e2e round-trip qua binary thật, cùng khuôn parity với vòng nghiên-cứu.
- Quét chia-việc không bao giờ tự gọi model, nên không có đường "model trả rác" ở bước này; còn một phán quyết chia tay mà có con thiếu verify thì bị từ chối — gốc ở nguyên trạng thái/stage hiện tại, không con nào được ghi, lượt chạy vẫn tiếp tục xử các item khác.
- Gặt-lại lúc khởi động SKIP một item `doing` mang `claimRole` người/phiên (cửa pull), dù item đó không mang commit/proof nào — nhưng vẫn gặt bình thường một claim mồ côi của chính runner ở cùng lượt gặt (chọn lọc, không phải tắt hẳn gặt-lại) — chứng minh bằng test thật cả hai nhánh trong cùng một pass.
- Một `fgos-runner --once` chạy song song trong khi một người đang cầm item qua cửa pull `take`: gặt-lại của lượt runner đó không đụng vào claim người, và runner cũng không dispatch lại item đã `doing` — chứng minh bằng e2e qua binary thật (submit → pass-through 2 stage → `take` người → `fgos-runner --once` song song → `return` xanh của người, không lượt nào giẫm lượt nào).
- Vòng đủ của một item runner qua cổng duyệt: submit/add → runner dispatch → `awaiting-approval` → `review` → `approve` → merge → `done`, mang settlement role human, bài học câu-6, và dọn nhánh/worktree đều được assert — chứng minh bằng e2e qua binary + git thật.
- Merge conflict thật trên một main đã rẽ nhánh: sau `approve` bị hủy, cây làm việc NGUYÊN VẸN byte-for-byte (HEAD không đổi, tracked tree sạch, nội dung file không đổi) — chứng minh bằng e2e thật, không chỉ spike.
- Vòng đủ của một item pull-door qua cổng duyệt: `take` → commit → `return` → `review` → `approve` (không bước merge) → `done` — chứng minh bằng e2e qua binary thật.
- `reject` một item pull-door: commit của nó vẫn là lịch sử THẬT trên main sau reject (no-auto-revert) — chứng minh bằng e2e thật.
- Hai việc độc lập (không chung gốc, không phụ thuộc nhau) dispatch trong CÙNG một mẻ đều tới đề xuất, và nhật ký sự kiện sau đó dựng lại đúng nguyên vẹn — chứng minh bằng một cửa sổ chồng-lấn THẬT giữa hai việc (không phải suy luận từ thời gian tường trình, vốn cũng đúng cho hai lần chạy tuần tự trông giống song song).
- Quyền-sở-hữu-gốc dưới hai chủ tranh cùng một gốc: chủ thứ hai luôn bị từ chối nhận, không có cửa sổ nào cả hai cùng nhận được cùng lúc — chứng minh bằng kịch bản đối đầu 2 tác nhân trước khi cell dựng thật, giữ nguyên khi dựng thật.
- Nhập xung đột thật ở tầng con→nhánh-của-gốc VÀ ở tầng gốc→cây chính: cả hai hủy sạch bằng đúng một cơ chế đã chứng minh cho việc-độc-lập trước đây — nhánh/cây nguyên vẹn sau khi hủy, không có tầng nào cần cơ chế riêng.
- Đồng bộ-lại thành công thật (đích đổi không đụng cùng chỗ với việc): việc chuyển thẳng từ đỗ về sẵn sàng nộp lại mà không đi qua "đang làm" — chứng minh bằng kịch bản thật, không rút gọn.
- Đồng bộ-lại gặp xung đột thật (đích đổi đụng đúng chỗ với việc): hủy sạch, việc giữ nguyên đỗ, nhánh của việc không đổi tip — chứng minh bằng kịch bản xung đột thật (không phải một xung đột dựng tắt), cùng cơ chế chứng minh cho cả tầng con→gốc lẫn tầng gốc→cây chính.
- Một câu trả lời làm-rõ của người (`answer`) hoặc một reject/park mang `reason` của người reset ngân sách cổng chống-lặp của chính việc đó — việc dispatch lại thay vì bị đỗ dù đã chạm trần trước đó; một resume trần (không `reason`), một `take` của người (không `answer`/`reason`), và mọi park của chính runner (kể cả mang `reason`) KHÔNG reset — chứng minh bằng test thật per-item cho từng hình, cộng một kịch bản tích hợp `runOnce` thật (RUL29 (cổng chống-lặp reset theo can thiệp người cuối cùng của chính việc)).
- Một vòng chỉ-máy-lỗi (không sự kiện người nào) vẫn chết đúng ở trần 3 — reset chỉ xảy ra khi CÓ can thiệp người, không phải mặc định (regression giữ nguyên cùng lúc RUL29 (cổng chống-lặp reset theo can thiệp người cuối cùng của chính việc) được thêm).
- Vòng đủ của một đề xuất nguồn-nhánh từng bị đỗ (chạm trần chống-lặp): người `take` (ghi `branchHeadAtTake`) → commit thêm lên nhánh → `return` đo sạch trên worktree tạm detached tại tip nhánh → `awaiting-approval` mang `branchHeadAtReturn` (không `headAtReturn`) → `review`/`approve` (nguồn đọc là `runner`) → `done` — chứng minh bằng e2e qua binary + git thật (RUL30 (cửa người-hoàn-tất một đề xuất nguồn-nhánh bị đỗ — mở rộng take/return, không verb mới)).
- `return` nguồn-nhánh với nhánh KHÔNG có commit mới kể từ `branchHeadAtTake`: từ chối rõ lý do, việc giữ nguyên `doing`, không đổi tip nhánh — chứng minh bằng test thật.
- `return` nguồn-nhánh trong khi người đang đứng trên chính nhánh `fgw/<id>` đó ở một worktree khác: worktree tạm detached không đụng worktree của người (snapshot trước/sau byte-identical) — chứng minh bằng kịch bản hai-worktree thật, không phải suy luận.
```

### Full diff

```diff
No text difference.
```

## claim_e3bd4567b6cb5b3e9da820c7a01da19a

Source digest: 798124b276040909ca49f18983810c338f880ce2a7c22cd3f347736ec9582710

Target digest: 798124b276040909ca49f18983810c338f880ce2a7c22cd3f347736ec9582710

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-96",
  "sourceLines": [
    1163,
    1170
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Edge Cases Settled"
  ],
  "targetPath": "docs/platform/runner/subcomponents/h-37aced3896a8/spec.md",
  "targetAnchor": "unheaded-block-4",
  "targetAncestry": [
    "Added in candidate: Runner Edge Cases Settled",
    "Edge Cases Settled"
  ],
  "nativeTargetClaimId": "claim_1847d471879277d5bda2b68e417d651d",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; document exact share below one half",
  "section": "edge-cases-settled",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_e3bd4567b6cb5b3e9da820c7a01da19a",
    "sourceUnitDigest": "798124b276040909ca49f18983810c338f880ce2a7c22cd3f347736ec9582710",
    "targetOwner": "docs/platform/runner/subcomponents/h-37aced3896a8/spec.md",
    "targetAnchor": "unheaded-block-4",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. Whole unheaded-block docs/specs/runner.md#unheaded-block-96 (lines 1163–1170) carried at docs/platform/runner/subcomponents/h-37aced3896a8/spec.md#unheaded-block-4. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "798124b276040909ca49f18983810c338f880ce2a7c22cd3f347736ec9582710",
    "targetAncestry": [
      "Added in candidate: Runner Edge Cases Settled",
      "Edge Cases Settled"
    ]
  }
}
```

### Full source unit

```text
- Đề xuất nguồn runner mở PR qua GitHub (`review --github`) rồi được merge sạch qua `approve --github --pr <n>`: item `done` mang role `human`, cùng khuôn với merge cục bộ — chứng minh bằng test thật qua một `gh` giả tiêm vào tiến trình con thật của CLI (không mock).
- `approve --github` gãy vì lời gọi GitHub thất bại (mọi lý do — xác thực, mạng, giới hạn tần suất, hay chưa rõ): item `blocked` mang lý do cụ thể cộng một bản ghi friction, cùng khuôn `merge-conflict`/`verify-fail-post-merge` — chứng minh bằng test thật.
- `review`/`approve --github` gọi trên một đề xuất KHÔNG phải nguồn runner (pull-door/legacy): từ chối `validation` ngay, không gọi GitHub, đề xuất giữ nguyên trạng thái — chứng minh bằng test thật cho cả hai verb.
- `approve --github` trên một cây làm việc chính đang bẩn (file KHÔNG liên quan đến GitHub còn thay đổi chưa commit): KHÔNG bị chặn bởi phép kiểm cây-sạch của đường cục bộ — phép kiểm đó chỉ áp cho merge cục bộ, không áp cho merge qua GitHub — chứng minh bằng test thật.
- `review --github --pr <n>` trên một PR đã bị đóng KHÔNG merge: nêu đúng số PR, hướng dẫn `fgos reject`, không đổi trạng thái item, không ghi friction — và trả lời trong đúng MỘT lời gọi GitHub dù trường sẵn-sàng-merge của PR đó đọc "chưa rõ" (không chờ-lặp cho phép hỏi thăm này, khác `viewGitHubPRStatus`'s hành vi mặc định) — chứng minh bằng test thật đo số lần gọi GitHub VÀ thời gian chạy.
- `review --github --pr <n>` trên một PR đã merge (kể cả merge thẳng trên GitHub, bỏ qua `approve --github`): chỉ báo tin, không tự đổi trạng thái item cục bộ — chứng minh bằng test thật.
- Một lượt dispatch hỏng vì lý do KHÔNG liên quan tới trợ lý (lỗi worktree, không có output/tier/model) vẫn ghi được một khối vào bản ghi cục bộ, chỉ mang loại lỗi + thông điệp — không throw vì thiếu trường — chứng minh bằng test thật.
- Một việc bị thử lại nhiều lần: mỗi lần thử nối thêm một khối MỚI vào CÙNG bản ghi cục bộ của việc đó, lần thử trước không bị mất — chứng minh bằng test thật.
```

### Full target unit

```text
- Đề xuất nguồn runner mở PR qua GitHub (`review --github`) rồi được merge sạch qua `approve --github --pr <n>`: item `done` mang role `human`, cùng khuôn với merge cục bộ — chứng minh bằng test thật qua một `gh` giả tiêm vào tiến trình con thật của CLI (không mock).
- `approve --github` gãy vì lời gọi GitHub thất bại (mọi lý do — xác thực, mạng, giới hạn tần suất, hay chưa rõ): item `blocked` mang lý do cụ thể cộng một bản ghi friction, cùng khuôn `merge-conflict`/`verify-fail-post-merge` — chứng minh bằng test thật.
- `review`/`approve --github` gọi trên một đề xuất KHÔNG phải nguồn runner (pull-door/legacy): từ chối `validation` ngay, không gọi GitHub, đề xuất giữ nguyên trạng thái — chứng minh bằng test thật cho cả hai verb.
- `approve --github` trên một cây làm việc chính đang bẩn (file KHÔNG liên quan đến GitHub còn thay đổi chưa commit): KHÔNG bị chặn bởi phép kiểm cây-sạch của đường cục bộ — phép kiểm đó chỉ áp cho merge cục bộ, không áp cho merge qua GitHub — chứng minh bằng test thật.
- `review --github --pr <n>` trên một PR đã bị đóng KHÔNG merge: nêu đúng số PR, hướng dẫn `fgos reject`, không đổi trạng thái item, không ghi friction — và trả lời trong đúng MỘT lời gọi GitHub dù trường sẵn-sàng-merge của PR đó đọc "chưa rõ" (không chờ-lặp cho phép hỏi thăm này, khác `viewGitHubPRStatus`'s hành vi mặc định) — chứng minh bằng test thật đo số lần gọi GitHub VÀ thời gian chạy.
- `review --github --pr <n>` trên một PR đã merge (kể cả merge thẳng trên GitHub, bỏ qua `approve --github`): chỉ báo tin, không tự đổi trạng thái item cục bộ — chứng minh bằng test thật.
- Một lượt dispatch hỏng vì lý do KHÔNG liên quan tới trợ lý (lỗi worktree, không có output/tier/model) vẫn ghi được một khối vào bản ghi cục bộ, chỉ mang loại lỗi + thông điệp — không throw vì thiếu trường — chứng minh bằng test thật.
- Một việc bị thử lại nhiều lần: mỗi lần thử nối thêm một khối MỚI vào CÙNG bản ghi cục bộ của việc đó, lần thử trước không bị mất — chứng minh bằng test thật.
```

### Full diff

```diff
No text difference.
```

## claim_36f4a3c4ae623f3a348faadd747dcba7

Source digest: 153dc43f02108c3b79c7f21ae6c9814edbf96f84e14c4988eb6c802a90f6e073

Target digest: 153dc43f02108c3b79c7f21ae6c9814edbf96f84e14c4988eb6c802a90f6e073

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-97",
  "sourceLines": [
    1172,
    1173
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Edge Cases Settled"
  ],
  "targetPath": "docs/platform/runner/subcomponents/h-37aced3896a8/spec.md",
  "targetAnchor": "unheaded-block-5",
  "targetAncestry": [
    "Added in candidate: Runner Edge Cases Settled",
    "Edge Cases Settled"
  ],
  "nativeTargetClaimId": "claim_dd5b888c742b9db163a7bb19d2fe31ef",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; document exact share below one half",
  "section": "edge-cases-settled",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_36f4a3c4ae623f3a348faadd747dcba7",
    "sourceUnitDigest": "153dc43f02108c3b79c7f21ae6c9814edbf96f84e14c4988eb6c802a90f6e073",
    "targetOwner": "docs/platform/runner/subcomponents/h-37aced3896a8/spec.md",
    "targetAnchor": "unheaded-block-5",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. Whole unheaded-block docs/specs/runner.md#unheaded-block-97 (lines 1172–1173) carried at docs/platform/runner/subcomponents/h-37aced3896a8/spec.md#unheaded-block-5. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "153dc43f02108c3b79c7f21ae6c9814edbf96f84e14c4988eb6c802a90f6e073",
    "targetAncestry": [
      "Added in candidate: Runner Edge Cases Settled",
      "Edge Cases Settled"
    ]
  }
}
```

### Full source unit

```text
- Vòng đủ tự-cải-thiện (self-improve loop STR13): một bản ghi friction chưa ngã-ngũ mang từ khóa rủi ro nặng → `evolve` (liệt kê, candidate hiện đủ trường) → `evolve --pick` (đọc-thuần, byte-compare nhật ký trước/sau xác nhận không sự kiện nào bị thêm) → `evolve --submit` (đúng một việc mới, mô tả mang từ khóa) → runner dispatch việc mới đó tới `awaiting-approval` → `review` (source: runner) → `approve` KHÔNG `--acknowledge-iron-law` (item không cha nên target là trunk, và `ironLaw.level` mặc định `ask` — từ chối cứng, nêu tên từ khóa khớp, HEAD không đổi, nhánh còn sống) → `approve --acknowledge-iron-law` (merge, verify xanh, `awaiting-approval → done`, settlement role human, nhánh/worktree dọn sạch) — chứng minh bằng e2e qua binary + git thật, mọi bước tự chạy trong CÙNG file, không dựa vào tham chiếu chéo sang test của cell khác. Hai điều kiện trong ngoặc là điều `0032` làm thành tường minh: cùng diff ấy trên một leaf land vào `fgw/<root>`, hoặc ở `ironLaw.level = "warn"`, không dừng ở bước từ chối.
- `fgos discover <id>` gọi trên một thư mục dự án MỚI, chưa từng có cấu hình runner: không còn chết vì không đọc được cấu hình — cấu hình mặc định được tự viết tại đường mặc định, item đi tiếp vào phán làm-rõ thật (đậu `awaiting-human` khi phán không chắc, đúng fail-safe hiện có, KHÔNG phải một kết quả "thành công" trần trụi) — chứng minh bằng test thật qua binary, PATH của tiến trình phán bị thu hẹp có chủ đích để không gọi trợ lý thật nào trong lúc test. Một `--config` tường minh trỏ đường vắng mặt vẫn báo lỗi ngay như trước, không bao giờ được tự sinh thay (RUL48 (cấu hình runner tự sinh tại đường mặc định khi vắng mặt — không bao giờ đòi người tạo tay trước)).
```

### Full target unit

```text
- Vòng đủ tự-cải-thiện (self-improve loop STR13): một bản ghi friction chưa ngã-ngũ mang từ khóa rủi ro nặng → `evolve` (liệt kê, candidate hiện đủ trường) → `evolve --pick` (đọc-thuần, byte-compare nhật ký trước/sau xác nhận không sự kiện nào bị thêm) → `evolve --submit` (đúng một việc mới, mô tả mang từ khóa) → runner dispatch việc mới đó tới `awaiting-approval` → `review` (source: runner) → `approve` KHÔNG `--acknowledge-iron-law` (item không cha nên target là trunk, và `ironLaw.level` mặc định `ask` — từ chối cứng, nêu tên từ khóa khớp, HEAD không đổi, nhánh còn sống) → `approve --acknowledge-iron-law` (merge, verify xanh, `awaiting-approval → done`, settlement role human, nhánh/worktree dọn sạch) — chứng minh bằng e2e qua binary + git thật, mọi bước tự chạy trong CÙNG file, không dựa vào tham chiếu chéo sang test của cell khác. Hai điều kiện trong ngoặc là điều `0032` làm thành tường minh: cùng diff ấy trên một leaf land vào `fgw/<root>`, hoặc ở `ironLaw.level = "warn"`, không dừng ở bước từ chối.
- `fgos discover <id>` gọi trên một thư mục dự án MỚI, chưa từng có cấu hình runner: không còn chết vì không đọc được cấu hình — cấu hình mặc định được tự viết tại đường mặc định, item đi tiếp vào phán làm-rõ thật (đậu `awaiting-human` khi phán không chắc, đúng fail-safe hiện có, KHÔNG phải một kết quả "thành công" trần trụi) — chứng minh bằng test thật qua binary, PATH của tiến trình phán bị thu hẹp có chủ đích để không gọi trợ lý thật nào trong lúc test. Một `--config` tường minh trỏ đường vắng mặt vẫn báo lỗi ngay như trước, không bao giờ được tự sinh thay (RUL48 (cấu hình runner tự sinh tại đường mặc định khi vắng mặt — không bao giờ đòi người tạo tay trước)).
```

### Full diff

```diff
No text difference.
```
