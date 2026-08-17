---
item: tsk-225
---

# DISCUSSION.md — tsk-225: capacity/capacities naming

## 1. Trạng thái hiện tại

Round 1: vừa scout xong phạm vi thật, chưa hỏi câu nào. Bối cảnh: tsk-34n
(đã `delivered` trên `main`) vừa làm rõ model capability=purpose vs
capacity=concrete backend, và vừa retire xong `capacities.<id>.capability`
back-compat field. User đề xuất tiếp: đổi tên `capacity`/`capacities`
thành `backend`/`executor` (hoặc tên khác) vì giờ mọi thứ đã rõ ràng hơn.
Scout tìm thấy một collision thật với `runner.executor` đã tồn tại sẵn —
xem §3.

## 2. Mục tiêu & đề bài

Sau khi tsk-34n xong, `capacity`/`capacities` là thuật ngữ chỉ "một
backend cụ thể có thể thực thi công việc" (vd. `agy`, `gitnexus`), phân
biệt với `capability`/`capabilities` — "một purpose/công việc trừu tượng"
(vd. `fgos-coding-implement`, `impact-analysis`). User đặt câu hỏi: giờ
ranh giới capability/capacity đã rõ, liệu cái TÊN "capacity" còn đúng bản
chất không, hay nên đổi thành thứ gì đó gần với ngôn ngữ ngành hơn (như
`backend`/`executor`) — và nếu đổi, đổi thành gì để không đụng khái niệm
`executor` đã có sẵn (`runner.executor`, global default command/args
template, một khái niệm HOÀN TOÀN khác — không phải danh sách các
backend, mà là cấu hình mặc định khi không backend nào được chọn).

## 3. Vấn đề rõ / chưa rõ

| # | Vấn đề | Trạng thái |
|---|---|---|
| 1 | Phạm vi thật trong `src/`: 466 lần xuất hiện `capacit*` trải trên 7 file (`src/state/worker-slots.mjs`, `src/state/tool-registry.mjs`, `src/state/replay.mjs`, `src/setup/registrations.mjs`, `src/runner/loop.mjs`, `src/runner/dispatch.mjs`, `src/cli/command-registry.mjs`) | **Rõ** — đo trực tiếp bằng grep, không suy đoán |
| 2 | Phạm vi thật trong `test/`: 500 lần xuất hiện `capacit*` trải trên 8 file | **Rõ** |
| 3 | Phạm vi thật trong `docs/decisions/`: 7 decision record đã LOCKED dùng "capacity" làm thuật ngữ chính thức — 0026 (khai sinh khái niệm), 0028, 0029, 0030, 0031, 0033, 0000-index | **Rõ** |
| 4 | Phạm vi thật trong skill prose: 17 file dưới `.claude/skills`/`.agents/skills`/`plugins` nhắc "capacity" | **Rõ** |
| 5 | Collision thật với `executor`: `runner.executor` đã là một field tồn tại sẵn, ý nghĩa hoàn toàn khác — cấu hình mặc định TOÀN CỤC (`command`/`args` template dùng khi capacity không tự khai riêng), không phải danh sách backend. `resolveExecutorConfig`, `SUPPORTED_EXECUTOR_TEMPLATES`, `buildAgentTypeExecutor`, biến `executor` cục bộ trong nhiều hàm — tất cả đang dùng đúng chữ "executor" cho khái niệm NÀY. Đổi `capacities` → `executors` (số nhiều) sẽ đụng trực tiếp, gây lẫn giữa "danh sách backend" và "cấu hình executor mặc định" — đúng như user đã lường trước | **Rõ — "executor" số nhiều bị loại vì collision thật, không phải giả định** |
| 6 | "backend" có bị collision không? | **Rõ — không.** Grep thấy "backend" đã xuất hiện 3 chỗ nhưng CHỈ ở dạng văn xuôi mô tả (comment/spec prose gọi capacity là "backend" một cách không chính thức), chưa bao giờ là tên field/key thật. Không có xung đột kỹ thuật nếu chọn `backend`/`backends` |
| 7 | Effort thật để đổi tên toàn bộ (966 lần xuất hiện code+test, cộng 7 decision record, cộng 17 skill file) so với lợi ích (rõ nghĩa hơn cho người đọc mới) | **Chưa rõ — cần thảo luận: đáng làm không, và nếu làm thì làm toàn bộ hay chỉ phần lộ diện (config field + doc mới, giữ tên hàm nội bộ)?** |
| 8 | 7 decision record đã LOCKED xử lý sao nếu đổi tên — có cần "superseded" formal, hay chỉ cần một dòng chú thích "capacity nay gọi là X" mà không mở lại quyết định? | **Chưa rõ — cần thảo luận** |

## 4. Quyết định đã chốt

(chưa có D-ID nào ở vòng này — chưa điểm nào giữ ổn định qua hơn 1 vòng)

## 5. Q&A log

**[Round 1, scout]** — Scan `docs/decisions/` cho "capacit": 7 file khớp
(`0000-index.md`, `0026-vision-orchestrator-roottask-capacity-native-vs-
cli-spawn.md`, `0028-doi-ten-orchestrator-thanh-launcher.md`, `0029-...`,
`0030-...`, `0031-...`, `0033-cli-spawn-shaped-capacity-thang-
hasLiveTaskAccess.md`). Grep phạm vi `src/`/`test/`: 466 + 500 lần xuất
hiện `capacit*`. Grep `runner.executor`/`cfg.executor` trong
`src/runner/dispatch.mjs`: 9 chỗ, xác nhận đây là một field/khái niệm khác
hẳn (global default), không phải danh sách backend — collision thật nếu
đổi `capacities` → `executors`. Grep "backend" (word boundary) trong
`src/`+`docs/decisions/`+`docs/specs/`: chỉ 3 chỗ, toàn văn xuôi mô tả,
không phải tên field — không collision.

## 6. Thiết kế đã chốt {#design}

(chưa có gì để tổng hợp — chưa quyết định nào chốt)

## 7. Danh mục hạng mục / task {#tasks}

(chưa chốt shape — chưa mở task nào)

