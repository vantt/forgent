discussion: open

# Câu hỏi cho chủ dự án (owner questions)

Shaper: tab "shaper: owner-questions", nhánh `shape/owner-questions`. Phạm vi do chủ dự án đặt 2026-11-18 (OM-D14).
Dừng ở `discussion: settled`; secretary (lead:HARDEN) mở planner.

## 1. Trạng thái hiện tại

2026-11-18 11:41. Vòng 1. Scout (`plans/reports/scout-261118-1125-owner-question-routing.md` trên
`origin/shape/ops-metrics`) đã được kiểm tra lại trên main `9b462207d` và vẫn đúng. Đã chốt từ trước: OM-D13
(verb Rust `fgos questions ask|answer`, sự kiện `fgos.question.asked|answered`). Đang mở: Q1, nguồn sự thật của
câu hỏi. Bốn điểm còn lại (người hỏi, chỗ xem, nhận câu trả lời, đánh thức) chờ Q1 vì cả bốn phụ thuộc vào nó.

## 2. Mục tiêu & đề bài

Khi một session (shaper, lead, supervisor, planner, một bước Workflow) cần chủ dự án quyết định, câu hỏi phải được
ghi một lần với đủ năm phần, biết ai hỏi (session Identity, role, plan/phase, pane/tab) và hỏi lúc nào; chủ dự án
thấy và trả lời mọi câu ở một chỗ chung; session đã hỏi nhận ra câu trả lời của chính nó bằng một khoá có được lúc
hỏi; và session đó được đánh thức khi câu trả lời tới (session còn sống thì gõ vào pane, đã chết thì supervisor nối
tiếp). Mailbox vẫn hoãn. Tầng Work đang tạm dừng: gate Workflow chỉ được đọc hoặc tham chiếu, không thiết kế lại.
Code mới viết bằng Rust khi làm được mà không gây xáo trộn.

## 3. Vấn đề rõ / chưa rõ

| # | Điểm | Trạng thái | Ghi chú |
|---|------|-----------|---------|
| 1 | Nguồn sự thật của câu hỏi | mở (Q1) | Hiện bốn nơi lưu, bốn kiểu khoá: `fgos ask` (work id), `QUESTIONS.md#Qn`, mục câu hỏi của plan, `workflow:<run>#<step>`. |
| 2 | Ghi gì về người hỏi | chờ Q1 | Identity tự cho session id + handle (in-process ~0,1 ms), role nếu đã đăng ký. Khoá pane nằm ở terminal-control/Session Host, không ở Identity. Plan/phase chưa nơi nào có. |
| 3 | Một chỗ chung để xem và trả lời | chờ Q1 | `fgos questions --open` gộp discussion, plan, gate nhưng thiếu `fgos ask`; dashboard S04 chỉ thấy `fgos ask`. |
| 4 | Session hỏi nhận ra câu trả lời của mình | chờ Q1 | Chưa có khoá chung. Ý nháp: id trả về lúc hỏi; `fgos questions wait <id>` hoặc hook `Stop`/`UserPromptSubmit` báo khi có trả lời. |
| 5 | Đánh thức session khi có trả lời | chờ Q1; phối hợp shaper supervisor | Ý nháp: watcher coi `fgos.question.answered` là một loại row; asker còn sống thì terminal-control `send`, đã chết thì đánh thức supervisor. Ranh giới watcher/supervisor thuộc shaper supervisor. |
| 7 | Kho câu hỏi là gì | nghiêng: kho vận hành | Hàng đợi + nhật ký cho câu đang mở; câu hỏi và câu trả lời lâu dài ghi ở nơi phát sinh. Mở: ai ghi lại khi người hỏi đã chết; bản ghi đã trả lời giữ bao lâu (ops-metrics cần thời gian chờ). |
| 6 | Socket `head answered` có dùng được cho câu trả lời không | rõ: không | Đó là bước bắt tay của session kế nhiệm khi xoay (`src/session-rotation/rotate.mjs:115-133`), không mang câu trả lời của chủ dự án. |

## 4. Quyết định đã chốt

| D-ID | Quyết định | Nguồn |
|------|-----------|-------|
| OM-D13 (kế thừa) | Verb Rust `fgos questions ask|answer` ghi thời điểm hỏi/trả lời và phát `fgos.question.asked|answered` qua cửa ghi Observe; một parser; Node chỉ là lớp gọi mỏng. Supervisor không nói chuyện với chủ dự án; câu hỏi của nó vào `fgos questions --open` và Miu gom thành bộ. | `docs/discussions/ops-metrics/DISCUSSION.md` §4 (nhánh `shape/ops-metrics`) |

## 5. Q&A log

- 2026-11-18 11:41 — Mở discussion. Kiểm tra scout trên main `9b462207d`: bốn nơi lưu và các khoảng trống còn
  nguyên; plan secretary ghi việc gộp câu hỏi về một chỗ là nợ SM-D9 (`plans/261117-1856-secretary-session-spine/plan.md:246`).
  Hỏi Q1.
- 2026-11-18 — Chủ dự án hỏi: kho câu hỏi chỉ là bản tạm cho vận hành/UX? Trả lời xong có ghi lại đúng chỗ phát
  sinh, hay không còn chỗ nào liệt kê câu hỏi? Shaper: đúng là kho vận hành (L1: log, không phải state); nơi phát
  sinh vẫn giữ bản lâu dài và nhận câu trả lời ghi lại. Sửa lựa chọn (a) trong Q1 theo hướng đó (bản trước nói
  "markdown chỉ còn id", bỏ).

## 6. Thiết kế đã chốt {#design}

Chưa có; chờ Q1.

## 7. Danh mục hạng mục / task {#tasks}

Chưa có; điền khi hình dạng đã rõ.
