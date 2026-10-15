# Independent bounded runner source review

Content commit: 81d0ed0747014e976c0d29222439fd6e3592b468

Author session: codex-session:unit-run-1792057868388-68b4a62c@2026-10-15

Entries: **2**. Target: `docs/platform/runner/subcomponents/h-ce5b9771a26a/spec.md`; part 1/1. Shard: `plans/260925-documentation-authority-unification/ledger/decisions/s9-runner-01.json`; SHA256 `de26feeaa57cfde916a78fdb423735da6335dbc35138e4ef545293c3bb50222b`. Sidecar SHA256 `1a7056c7cc3152dc3610c6f3a54d0121b7c7edcd772577b210c0b9d87bf61314`.

Read review-brief.md, owner-answers.md A19/A22/A28/A34/A36 and the frozen runner map. Ordinary conservation review only; no truth, promotion or retirement approval. Mechanically verify every digest, anchor, ancestry, native identity, one owner and shard/pack equality. Reviewer independently selects and records seeds and IDs, reads both directions with the full diff, and labels every own note deep or mechanical. More than 3% deep rework requires full-pack deep reading. Return Reviewer, Author session(s), Review mode: ordinary, content/request/shard pins and one five-column Claim | Verdict | Note | Source digest | Target digest row per entry; full 64-hex digests, literal none for absent target, ok/rework/hold. No producer verdict, draw or seed is supplied. Consolidate source packs by the original shard before ordinary application.

A36: reviewer-drawn minimum **2/2** Weak-exact/Judgment entries for this pack, plus every unequal-digest pair. Complete batch: 494 Weak-exact and 1 Judgment; at least 75 Weak-exact plus the sole Judgment overall (per-pack minima can require more). No Unit-exact population exists. Full direct-section text is shown for headings; large single sections may span consecutive block packs, without truncating any unit. Map additions and both rebound anchors are explicitly marked on every affected section row.

```json
{
  "classes": {
    "Unit-exact": [],
    "Weak-exact": [
      "claim_38036fa49508cc4b76e5e20fdb797a77",
      "claim_9e761df1b2c15fd9a0e722d1f0324a4a"
    ],
    "Judgment": []
  },
  "unequalDigestPairs": [],
  "mapAmendmentIDs": [],
  "reboundAnchorIDs": []
}
```

## claim_38036fa49508cc4b76e5e20fdb797a77

Source digest: 72526beea6ee0dab3fb182c1754440a8b37f4be2a7c4ffe734e7ef583c833b68

Target digest: 72526beea6ee0dab3fb182c1754440a8b37f4be2a7c4ffe734e7ef583c833b68

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "entry-points-triggers",
  "sourceLines": [
    56,
    56
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)"
  ],
  "targetPath": "docs/platform/runner/subcomponents/h-ce5b9771a26a/spec.md",
  "targetAnchor": "entry-points-triggers",
  "targetAncestry": [
    "Added in candidate: Runner Entry Points & Triggers"
  ],
  "nativeTargetClaimId": "claim_3e72772a308db3f59e773c5f282f77ba",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; source unit shorter than 40 characters; document exact share below one half",
  "section": "entry-points-triggers",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_38036fa49508cc4b76e5e20fdb797a77",
    "sourceUnitDigest": "72526beea6ee0dab3fb182c1754440a8b37f4be2a7c4ffe734e7ef583c833b68",
    "targetOwner": "docs/platform/runner/subcomponents/h-ce5b9771a26a/spec.md",
    "targetAnchor": "entry-points-triggers",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; source unit shorter than 40 characters; document exact share below one half. Whole heading docs/specs/runner.md#entry-points-triggers (lines 56–56) carried at docs/platform/runner/subcomponents/h-ce5b9771a26a/spec.md#entry-points-triggers. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "72526beea6ee0dab3fb182c1754440a8b37f4be2a7c4ffe734e7ef583c833b68",
    "targetAncestry": [
      "Added in candidate: Runner Entry Points & Triggers"
    ]
  }
}
```

### Full source unit

```text
## Entry Points & Triggers

- `fgos-runner --once` → chạy đúng một vòng: gặt-lại → tìm việc → giao việc theo MẺ (nhiều việc cùng lúc, giới hạn hai tầng) → chấm từng việc → ghi, rồi nạp lại mẻ kế tiếp — lặp tới khi không còn việc đang chạy VÀ không còn việc sẵn-sàng (xem "Giao việc theo mẻ, song song có giới hạn" dưới)
- `fgos-runner --dry-run` → in kế hoạch (việc nào sẽ chạy, model nào) mà không làm gì
- `fgos-runner --watch [--poll-ms <n>]` → chạy BỀN, không tự thoát khi frontier rỗng; lặp lại vòng đời `--once` mỗi lượt, phản ứng gần-tức-thời khi lượt vừa xong có ghi gì đó, nghỉ `--poll-ms` (mặc định 5000) khi lượt đó không ghi gì; dừng CHỈ qua SIGINT/SIGTERM tường minh — xem "Vòng cầm-giao bền (--watch)" dưới
- Khởi động MỌI vòng đều bắt đầu bằng bước **gặt-lại** (reap): giải quyết các claim runtime (hoặc item mang trạng thái bền `doing` di sản) từ lần chạy trước bị crash trước khi tìm việc mới — xem "Gặt-lại lúc khởi động" dưới
- Ngay sau gặt-lại, TRƯỚC khi tìm việc thi công: **quét nghiên-cứu** — giao worker thật cho mọi item ở stage `discovery`; xem "Quét nghiên-cứu trước dispatch" dưới
- Ngay sau quét nghiên-cứu, CÙNG TRƯỚC khi tìm việc thi công: **quét chia-việc** — mọi item ở stage `planning`, cộng tên stage di sản `decompose`; xem "Quét chia-việc trước dispatch" dưới
- `fgos take`/`fgos return` (cửa pull, ngoài vòng runner — xem spec Work-State "Cửa pull giao–nhận việc") claim/trả việc qua bản ghi runtime claim (mọi claim mới KHÔNG BAO GIỜ ghi bền giá trị `doing` — *new claims do not durably write into doing*) + CAS + goal-check runner tự dùng; gặt-lại lúc khởi động BỎ QUA claim đến từ cửa pull — xem "Gặt-lại lúc khởi động" dưới
- `fgos review <id>` / `fgos approve <id> [--timeout <ms>] [--acknowledge-iron-law]` / `fgos reject <id> --reason "..."` (ngoài vòng runner, gọi bởi người vận hành) — cổng duyệt PR nội bộ cho một đề xuất `awaiting-approval` đã sẵn, MỘT cổng cho cả nguồn runner lẫn pull-door; `approve` nguồn runner còn chạy phán Iron Law trước khi merge, nhưng CHỈ khi lần merge đó land lên trunk (self-improve loop STR13 Slice 3, ranh giới trunk per `0032`) — xem "Cổng duyệt PR nội bộ" dưới
- `fgos review <id> --github [--pr <n>]` / `fgos approve <id> --github --pr <n>` (ngoài vòng runner, gọi bởi người vận hành, tuỳ chọn — github-adapter) — vận chuyển thay thế của CÙNG cổng duyệt trên, đưa việc duyệt sang GitHub thay vì diff/merge cục bộ, chỉ áp dụng cho đề xuất nguồn runner; `review --github` kèm `--pr` là phép hỏi thăm trạng thái sống của một PR đã mở, không mở PR mới (github-adapter, phát hiện đóng-không-merge) — xem "Cổng duyệt qua GitHub" dưới
- `fgos catchup <id>` (ngoài vòng runner, gọi bởi người vận hành) — đồng bộ lại một việc đang đỗ (`blocked`) vì gãy nhập (xung đột, verify đỏ sau nhập, hoặc trôi tích hợp): kéo trạng thái mới nhất của đích vào nhánh riêng của việc rồi thử lại — xem "Đồng bộ lại một việc đỗ (catch-up)" dưới
- `fgos evolve` / `fgos evolve --pick <id>` / `fgos evolve --submit <id>` (ngoài vòng runner, gọi bởi người vận hành, on-demand — self-improve loop STR13) — Gate A của vòng tự cải thiện: xếp hạng candidate từ friction chưa ngã-ngũ, người chọn một hoặc dừng (đọc-thuần tuyệt đối), hoặc bắc cầu candidate đã chọn sang một việc thật (`--submit`, hành động ghi duy nhất của bề mặt evolve) — xem "Gate A — xếp hạng candidate, bắc cầu sang việc thật (evolve)" dưới
- `fgos session start [--item <id>]` / `fgos session end <session-id> [--force]` / `fgos session list` / `fgos session gc` (ngoài vòng runner, gọi bởi người vận hành/một tác nhân) — vòng đời phiên checkout đa-phiên tùy chọn: một worktree detached-HEAD mỗi phiên cho cây nguồn, dùng chung MỘT kho `.fgos/` qua symlink; `end` từ chối một phiên đã rời commit khởi tạo trừ khi `--force`; `gc` dọn các mục sổ mồ côi (worktree đã mất khỏi git, hoặc pid của lệnh `start` một-lần đã chết), tha các phiên còn commit lửng hoặc còn thay đổi chưa commit — xem "Phiên checkout đa-phiên" dưới
```

### Full target unit

```text
## Entry Points & Triggers

- `fgos-runner --once` → chạy đúng một vòng: gặt-lại → tìm việc → giao việc theo MẺ (nhiều việc cùng lúc, giới hạn hai tầng) → chấm từng việc → ghi, rồi nạp lại mẻ kế tiếp — lặp tới khi không còn việc đang chạy VÀ không còn việc sẵn-sàng (xem "Giao việc theo mẻ, song song có giới hạn" dưới)
- `fgos-runner --dry-run` → in kế hoạch (việc nào sẽ chạy, model nào) mà không làm gì
- `fgos-runner --watch [--poll-ms <n>]` → chạy BỀN, không tự thoát khi frontier rỗng; lặp lại vòng đời `--once` mỗi lượt, phản ứng gần-tức-thời khi lượt vừa xong có ghi gì đó, nghỉ `--poll-ms` (mặc định 5000) khi lượt đó không ghi gì; dừng CHỈ qua SIGINT/SIGTERM tường minh — xem "Vòng cầm-giao bền (--watch)" dưới
- Khởi động MỌI vòng đều bắt đầu bằng bước **gặt-lại** (reap): giải quyết các claim runtime (hoặc item mang trạng thái bền `doing` di sản) từ lần chạy trước bị crash trước khi tìm việc mới — xem "Gặt-lại lúc khởi động" dưới
- Ngay sau gặt-lại, TRƯỚC khi tìm việc thi công: **quét nghiên-cứu** — giao worker thật cho mọi item ở stage `discovery`; xem "Quét nghiên-cứu trước dispatch" dưới
- Ngay sau quét nghiên-cứu, CÙNG TRƯỚC khi tìm việc thi công: **quét chia-việc** — mọi item ở stage `planning`, cộng tên stage di sản `decompose`; xem "Quét chia-việc trước dispatch" dưới
- `fgos take`/`fgos return` (cửa pull, ngoài vòng runner — xem spec Work-State "Cửa pull giao–nhận việc") claim/trả việc qua bản ghi runtime claim (mọi claim mới KHÔNG BAO GIỜ ghi bền giá trị `doing` — *new claims do not durably write into doing*) + CAS + goal-check runner tự dùng; gặt-lại lúc khởi động BỎ QUA claim đến từ cửa pull — xem "Gặt-lại lúc khởi động" dưới
- `fgos review <id>` / `fgos approve <id> [--timeout <ms>] [--acknowledge-iron-law]` / `fgos reject <id> --reason "..."` (ngoài vòng runner, gọi bởi người vận hành) — cổng duyệt PR nội bộ cho một đề xuất `awaiting-approval` đã sẵn, MỘT cổng cho cả nguồn runner lẫn pull-door; `approve` nguồn runner còn chạy phán Iron Law trước khi merge, nhưng CHỈ khi lần merge đó land lên trunk (self-improve loop STR13 Slice 3, ranh giới trunk per `0032`) — xem "Cổng duyệt PR nội bộ" dưới
- `fgos review <id> --github [--pr <n>]` / `fgos approve <id> --github --pr <n>` (ngoài vòng runner, gọi bởi người vận hành, tuỳ chọn — github-adapter) — vận chuyển thay thế của CÙNG cổng duyệt trên, đưa việc duyệt sang GitHub thay vì diff/merge cục bộ, chỉ áp dụng cho đề xuất nguồn runner; `review --github` kèm `--pr` là phép hỏi thăm trạng thái sống của một PR đã mở, không mở PR mới (github-adapter, phát hiện đóng-không-merge) — xem "Cổng duyệt qua GitHub" dưới
- `fgos catchup <id>` (ngoài vòng runner, gọi bởi người vận hành) — đồng bộ lại một việc đang đỗ (`blocked`) vì gãy nhập (xung đột, verify đỏ sau nhập, hoặc trôi tích hợp): kéo trạng thái mới nhất của đích vào nhánh riêng của việc rồi thử lại — xem "Đồng bộ lại một việc đỗ (catch-up)" dưới
- `fgos evolve` / `fgos evolve --pick <id>` / `fgos evolve --submit <id>` (ngoài vòng runner, gọi bởi người vận hành, on-demand — self-improve loop STR13) — Gate A của vòng tự cải thiện: xếp hạng candidate từ friction chưa ngã-ngũ, người chọn một hoặc dừng (đọc-thuần tuyệt đối), hoặc bắc cầu candidate đã chọn sang một việc thật (`--submit`, hành động ghi duy nhất của bề mặt evolve) — xem "Gate A — xếp hạng candidate, bắc cầu sang việc thật (evolve)" dưới
- `fgos session start [--item <id>]` / `fgos session end <session-id> [--force]` / `fgos session list` / `fgos session gc` (ngoài vòng runner, gọi bởi người vận hành/một tác nhân) — vòng đời phiên checkout đa-phiên tùy chọn: một worktree detached-HEAD mỗi phiên cho cây nguồn, dùng chung MỘT kho `.fgos/` qua symlink; `end` từ chối một phiên đã rời commit khởi tạo trừ khi `--force`; `gc` dọn các mục sổ mồ côi (worktree đã mất khỏi git, hoặc pid của lệnh `start` một-lần đã chết), tha các phiên còn commit lửng hoặc còn thay đổi chưa commit — xem "Phiên checkout đa-phiên" dưới
```

### Full diff

```diff
No text difference.
```

## claim_9e761df1b2c15fd9a0e722d1f0324a4a

Source digest: 66c396e78df6e72f66e4870a5c211b0deff5387b6985d9362a528e94cbfcd8a6

Target digest: 66c396e78df6e72f66e4870a5c211b0deff5387b6985d9362a528e94cbfcd8a6

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-8",
  "sourceLines": [
    58,
    69
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Entry Points & Triggers"
  ],
  "targetPath": "docs/platform/runner/subcomponents/h-ce5b9771a26a/spec.md",
  "targetAnchor": "unheaded-block-3",
  "targetAncestry": [
    "Added in candidate: Runner Entry Points & Triggers",
    "Entry Points & Triggers"
  ],
  "nativeTargetClaimId": "claim_5d4b80231ce688adf82fde78796fbdd3",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; document exact share below one half",
  "section": "entry-points-triggers",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_9e761df1b2c15fd9a0e722d1f0324a4a",
    "sourceUnitDigest": "66c396e78df6e72f66e4870a5c211b0deff5387b6985d9362a528e94cbfcd8a6",
    "targetOwner": "docs/platform/runner/subcomponents/h-ce5b9771a26a/spec.md",
    "targetAnchor": "unheaded-block-3",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. Whole unheaded-block docs/specs/runner.md#unheaded-block-8 (lines 58–69) carried at docs/platform/runner/subcomponents/h-ce5b9771a26a/spec.md#unheaded-block-3. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "66c396e78df6e72f66e4870a5c211b0deff5387b6985d9362a528e94cbfcd8a6",
    "targetAncestry": [
      "Added in candidate: Runner Entry Points & Triggers",
      "Entry Points & Triggers"
    ]
  }
}
```

### Full source unit

```text
- `fgos-runner --once` → chạy đúng một vòng: gặt-lại → tìm việc → giao việc theo MẺ (nhiều việc cùng lúc, giới hạn hai tầng) → chấm từng việc → ghi, rồi nạp lại mẻ kế tiếp — lặp tới khi không còn việc đang chạy VÀ không còn việc sẵn-sàng (xem "Giao việc theo mẻ, song song có giới hạn" dưới)
- `fgos-runner --dry-run` → in kế hoạch (việc nào sẽ chạy, model nào) mà không làm gì
- `fgos-runner --watch [--poll-ms <n>]` → chạy BỀN, không tự thoát khi frontier rỗng; lặp lại vòng đời `--once` mỗi lượt, phản ứng gần-tức-thời khi lượt vừa xong có ghi gì đó, nghỉ `--poll-ms` (mặc định 5000) khi lượt đó không ghi gì; dừng CHỈ qua SIGINT/SIGTERM tường minh — xem "Vòng cầm-giao bền (--watch)" dưới
- Khởi động MỌI vòng đều bắt đầu bằng bước **gặt-lại** (reap): giải quyết các claim runtime (hoặc item mang trạng thái bền `doing` di sản) từ lần chạy trước bị crash trước khi tìm việc mới — xem "Gặt-lại lúc khởi động" dưới
- Ngay sau gặt-lại, TRƯỚC khi tìm việc thi công: **quét nghiên-cứu** — giao worker thật cho mọi item ở stage `discovery`; xem "Quét nghiên-cứu trước dispatch" dưới
- Ngay sau quét nghiên-cứu, CÙNG TRƯỚC khi tìm việc thi công: **quét chia-việc** — mọi item ở stage `planning`, cộng tên stage di sản `decompose`; xem "Quét chia-việc trước dispatch" dưới
- `fgos take`/`fgos return` (cửa pull, ngoài vòng runner — xem spec Work-State "Cửa pull giao–nhận việc") claim/trả việc qua bản ghi runtime claim (mọi claim mới KHÔNG BAO GIỜ ghi bền giá trị `doing` — *new claims do not durably write into doing*) + CAS + goal-check runner tự dùng; gặt-lại lúc khởi động BỎ QUA claim đến từ cửa pull — xem "Gặt-lại lúc khởi động" dưới
- `fgos review <id>` / `fgos approve <id> [--timeout <ms>] [--acknowledge-iron-law]` / `fgos reject <id> --reason "..."` (ngoài vòng runner, gọi bởi người vận hành) — cổng duyệt PR nội bộ cho một đề xuất `awaiting-approval` đã sẵn, MỘT cổng cho cả nguồn runner lẫn pull-door; `approve` nguồn runner còn chạy phán Iron Law trước khi merge, nhưng CHỈ khi lần merge đó land lên trunk (self-improve loop STR13 Slice 3, ranh giới trunk per `0032`) — xem "Cổng duyệt PR nội bộ" dưới
- `fgos review <id> --github [--pr <n>]` / `fgos approve <id> --github --pr <n>` (ngoài vòng runner, gọi bởi người vận hành, tuỳ chọn — github-adapter) — vận chuyển thay thế của CÙNG cổng duyệt trên, đưa việc duyệt sang GitHub thay vì diff/merge cục bộ, chỉ áp dụng cho đề xuất nguồn runner; `review --github` kèm `--pr` là phép hỏi thăm trạng thái sống của một PR đã mở, không mở PR mới (github-adapter, phát hiện đóng-không-merge) — xem "Cổng duyệt qua GitHub" dưới
- `fgos catchup <id>` (ngoài vòng runner, gọi bởi người vận hành) — đồng bộ lại một việc đang đỗ (`blocked`) vì gãy nhập (xung đột, verify đỏ sau nhập, hoặc trôi tích hợp): kéo trạng thái mới nhất của đích vào nhánh riêng của việc rồi thử lại — xem "Đồng bộ lại một việc đỗ (catch-up)" dưới
- `fgos evolve` / `fgos evolve --pick <id>` / `fgos evolve --submit <id>` (ngoài vòng runner, gọi bởi người vận hành, on-demand — self-improve loop STR13) — Gate A của vòng tự cải thiện: xếp hạng candidate từ friction chưa ngã-ngũ, người chọn một hoặc dừng (đọc-thuần tuyệt đối), hoặc bắc cầu candidate đã chọn sang một việc thật (`--submit`, hành động ghi duy nhất của bề mặt evolve) — xem "Gate A — xếp hạng candidate, bắc cầu sang việc thật (evolve)" dưới
- `fgos session start [--item <id>]` / `fgos session end <session-id> [--force]` / `fgos session list` / `fgos session gc` (ngoài vòng runner, gọi bởi người vận hành/một tác nhân) — vòng đời phiên checkout đa-phiên tùy chọn: một worktree detached-HEAD mỗi phiên cho cây nguồn, dùng chung MỘT kho `.fgos/` qua symlink; `end` từ chối một phiên đã rời commit khởi tạo trừ khi `--force`; `gc` dọn các mục sổ mồ côi (worktree đã mất khỏi git, hoặc pid của lệnh `start` một-lần đã chết), tha các phiên còn commit lửng hoặc còn thay đổi chưa commit — xem "Phiên checkout đa-phiên" dưới
```

### Full target unit

```text
- `fgos-runner --once` → chạy đúng một vòng: gặt-lại → tìm việc → giao việc theo MẺ (nhiều việc cùng lúc, giới hạn hai tầng) → chấm từng việc → ghi, rồi nạp lại mẻ kế tiếp — lặp tới khi không còn việc đang chạy VÀ không còn việc sẵn-sàng (xem "Giao việc theo mẻ, song song có giới hạn" dưới)
- `fgos-runner --dry-run` → in kế hoạch (việc nào sẽ chạy, model nào) mà không làm gì
- `fgos-runner --watch [--poll-ms <n>]` → chạy BỀN, không tự thoát khi frontier rỗng; lặp lại vòng đời `--once` mỗi lượt, phản ứng gần-tức-thời khi lượt vừa xong có ghi gì đó, nghỉ `--poll-ms` (mặc định 5000) khi lượt đó không ghi gì; dừng CHỈ qua SIGINT/SIGTERM tường minh — xem "Vòng cầm-giao bền (--watch)" dưới
- Khởi động MỌI vòng đều bắt đầu bằng bước **gặt-lại** (reap): giải quyết các claim runtime (hoặc item mang trạng thái bền `doing` di sản) từ lần chạy trước bị crash trước khi tìm việc mới — xem "Gặt-lại lúc khởi động" dưới
- Ngay sau gặt-lại, TRƯỚC khi tìm việc thi công: **quét nghiên-cứu** — giao worker thật cho mọi item ở stage `discovery`; xem "Quét nghiên-cứu trước dispatch" dưới
- Ngay sau quét nghiên-cứu, CÙNG TRƯỚC khi tìm việc thi công: **quét chia-việc** — mọi item ở stage `planning`, cộng tên stage di sản `decompose`; xem "Quét chia-việc trước dispatch" dưới
- `fgos take`/`fgos return` (cửa pull, ngoài vòng runner — xem spec Work-State "Cửa pull giao–nhận việc") claim/trả việc qua bản ghi runtime claim (mọi claim mới KHÔNG BAO GIỜ ghi bền giá trị `doing` — *new claims do not durably write into doing*) + CAS + goal-check runner tự dùng; gặt-lại lúc khởi động BỎ QUA claim đến từ cửa pull — xem "Gặt-lại lúc khởi động" dưới
- `fgos review <id>` / `fgos approve <id> [--timeout <ms>] [--acknowledge-iron-law]` / `fgos reject <id> --reason "..."` (ngoài vòng runner, gọi bởi người vận hành) — cổng duyệt PR nội bộ cho một đề xuất `awaiting-approval` đã sẵn, MỘT cổng cho cả nguồn runner lẫn pull-door; `approve` nguồn runner còn chạy phán Iron Law trước khi merge, nhưng CHỈ khi lần merge đó land lên trunk (self-improve loop STR13 Slice 3, ranh giới trunk per `0032`) — xem "Cổng duyệt PR nội bộ" dưới
- `fgos review <id> --github [--pr <n>]` / `fgos approve <id> --github --pr <n>` (ngoài vòng runner, gọi bởi người vận hành, tuỳ chọn — github-adapter) — vận chuyển thay thế của CÙNG cổng duyệt trên, đưa việc duyệt sang GitHub thay vì diff/merge cục bộ, chỉ áp dụng cho đề xuất nguồn runner; `review --github` kèm `--pr` là phép hỏi thăm trạng thái sống của một PR đã mở, không mở PR mới (github-adapter, phát hiện đóng-không-merge) — xem "Cổng duyệt qua GitHub" dưới
- `fgos catchup <id>` (ngoài vòng runner, gọi bởi người vận hành) — đồng bộ lại một việc đang đỗ (`blocked`) vì gãy nhập (xung đột, verify đỏ sau nhập, hoặc trôi tích hợp): kéo trạng thái mới nhất của đích vào nhánh riêng của việc rồi thử lại — xem "Đồng bộ lại một việc đỗ (catch-up)" dưới
- `fgos evolve` / `fgos evolve --pick <id>` / `fgos evolve --submit <id>` (ngoài vòng runner, gọi bởi người vận hành, on-demand — self-improve loop STR13) — Gate A của vòng tự cải thiện: xếp hạng candidate từ friction chưa ngã-ngũ, người chọn một hoặc dừng (đọc-thuần tuyệt đối), hoặc bắc cầu candidate đã chọn sang một việc thật (`--submit`, hành động ghi duy nhất của bề mặt evolve) — xem "Gate A — xếp hạng candidate, bắc cầu sang việc thật (evolve)" dưới
- `fgos session start [--item <id>]` / `fgos session end <session-id> [--force]` / `fgos session list` / `fgos session gc` (ngoài vòng runner, gọi bởi người vận hành/một tác nhân) — vòng đời phiên checkout đa-phiên tùy chọn: một worktree detached-HEAD mỗi phiên cho cây nguồn, dùng chung MỘT kho `.fgos/` qua symlink; `end` từ chối một phiên đã rời commit khởi tạo trừ khi `--force`; `gc` dọn các mục sổ mồ côi (worktree đã mất khỏi git, hoặc pid của lệnh `start` một-lần đã chết), tha các phiên còn commit lửng hoặc còn thay đổi chưa commit — xem "Phiên checkout đa-phiên" dưới
```

### Full diff

```diff
No text difference.
```
