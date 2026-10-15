# Added in candidate: Runner Entry Points & Triggers


```txt
Document type: Specification
Audience: Documentation migration reviewer, maintainer, agent
Purpose: Preserve frozen-map runner content for independent conservation review
Design status: Candidate
Implementation: Carriage only; implementation truth not certified
Provenance: docs/specs/runner.md at 63fa6f15266f45c881f610235e0be8d61ff07120; blob ddfa78cc7183cf1f7db8ee64d2339653a0aa0023
Writer type: Agent draft writer
Canonical: No
Canonical for: None; candidate only
Use this when: Reviewing runner carriage, placement and conservation
Do not use this for: Canonical behavior, source retirement or current truth proof
Last reviewed: Not independently reviewed; authored 2026-10-15
Related:
- docs/specs/runner.md
Supersedes: None; legacy authority retained
Superseded by: None
```

> Added in candidate: Metadata and map-based placement scaffolding. Original source heading levels, ids and direct sections are retained. Placement in decisions does not declare the subject retired. Known stale carried sentences; full truth check owed at promotion. A19 carriage and explicit Lead A35 note preserve deleted-module, retired-corpus, moved-plan and runner.md:<line> text verbatim.

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
