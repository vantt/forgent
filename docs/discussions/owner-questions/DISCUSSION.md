discussion: open

# Câu hỏi cho chủ dự án (owner questions)

Shaper: tab "shaper: owner-questions", nhánh `shape/owner-questions`. Phạm vi do chủ dự án đặt 2026-11-18 (OM-D14).
Dừng ở `discussion: settled`; secretary (lead:HARDEN) mở planner.

## 1. Trạng thái hiện tại

2026-11-18. Vòng 2. OQ-D1 đã chốt: kho câu hỏi vận hành, nơi phát sinh giữ bản lâu dài. Điểm 2, 3, 4 có đề xuất ở
§6 (shaper quyết, chưa mint D-ID vì mới một vòng). Điểm 5 (đánh thức) chờ phối hợp với planner supervisor về ranh
giới watcher. Còn mở: chỗ đặt kho (component riêng hay trong Observe), ai ghi câu trả lời về nơi phát sinh khi người
hỏi đã chết. Không có câu hỏi nào đang chờ chủ dự án.

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
| 1 | Nguồn sự thật của câu hỏi | chốt OQ-D1 | Hiện bốn nơi lưu, bốn kiểu khoá: `fgos ask` (work id), `QUESTIONS.md#Qn`, mục câu hỏi của plan, `workflow:<run>#<step>`. |
| 2 | Ghi gì về người hỏi | đề xuất ở §6 | Identity tự cho session id + handle (in-process ~0,1 ms), role nếu đã đăng ký. Khoá pane nằm ở terminal-control/Session Host, không ở Identity. Plan/phase chưa nơi nào có. |
| 3 | Một chỗ chung để xem và trả lời | đề xuất ở §6 | `fgos questions --open` gộp discussion, plan, gate nhưng thiếu `fgos ask`; dashboard S04 chỉ thấy `fgos ask`. |
| 4 | Session hỏi nhận ra câu trả lời của mình | đề xuất ở §6 | Chưa có khoá chung. Ý nháp: id trả về lúc hỏi; `fgos questions wait <id>` hoặc hook `Stop`/`UserPromptSubmit` báo khi có trả lời. |
| 5 | Đánh thức session khi có trả lời | đề xuất ở §6; phối hợp planner supervisor (`plan-supervisor-b9`) | Ý nháp: watcher coi `fgos.question.answered` là một loại row; asker còn sống thì terminal-control `send`, đã chết thì đánh thức supervisor. Ranh giới watcher/supervisor thuộc shaper supervisor. |
| 7 | Kho câu hỏi là gì | chốt OQ-D1 | Hàng đợi + nhật ký cho câu đang mở; câu hỏi và câu trả lời lâu dài ghi ở nơi phát sinh. Mở: ai ghi lại khi người hỏi đã chết; bản ghi đã trả lời giữ bao lâu (ops-metrics cần thời gian chờ). |
| 6 | Socket `head answered` có dùng được cho câu trả lời không | rõ: không | Đó là bước bắt tay của session kế nhiệm khi xoay (`src/session-rotation/rotate.mjs:115-133`), không mang câu trả lời của chủ dự án. |

## 4. Quyết định đã chốt

| D-ID | Quyết định | Nguồn |
|------|-----------|-------|
| OQ-D1 | Câu hỏi đang mở nằm trong một kho vận hành (hàng đợi + nhật ký): `fgos questions ask` mint id, tự ghi người hỏi, `askedAt` và năm phần; `answer` ghi câu trả lời; danh sách mở là phép gộp bản ghi. Nơi phát sinh (`QUESTIONS.md`, mục câu hỏi của plan, gate) giữ bản lâu dài, thêm id, và nhận lại câu trả lời + quyết định. Gate Workflow giữ nguyên, được đọc như nguồn thứ hai tới khi tầng Work mở lại. Loại bỏ: giữ bốn nơi lưu với cột điền tay (không kiểm được người hỏi, không đánh thức được). | Q1, 2026-11-18 (hai vòng; chủ dự án làm rõ, shaper quyết theo ưu tiên #2) |
| OM-D13 (kế thừa) | Verb Rust `fgos questions ask|answer` ghi thời điểm hỏi/trả lời và phát `fgos.question.asked|answered` qua cửa ghi Observe; một parser; Node chỉ là lớp gọi mỏng. Supervisor không nói chuyện với chủ dự án; câu hỏi của nó vào `fgos questions --open` và Miu gom thành bộ. | `docs/discussions/ops-metrics/DISCUSSION.md` §4 (nhánh `shape/ops-metrics`) |

## 5. Q&A log

- 2026-11-18 11:41 — Mở discussion. Kiểm tra scout trên main `9b462207d`: bốn nơi lưu và các khoảng trống còn
  nguyên; plan secretary ghi việc gộp câu hỏi về một chỗ là nợ SM-D9 (`plans/261117-1856-secretary-session-spine/plan.md:246`).
  Hỏi Q1.
- 2026-11-18 — Chủ dự án hỏi: kho câu hỏi chỉ là bản tạm cho vận hành/UX? Trả lời xong có ghi lại đúng chỗ phát
  sinh, hay không còn chỗ nào liệt kê câu hỏi? Shaper: đúng là kho vận hành (L1: log, không phải state); nơi phát
  sinh vẫn giữ bản lâu dài và nhận câu trả lời ghi lại. Sửa lựa chọn (a) trong Q1 theo hướng đó (bản trước nói
  "markdown chỉ còn id", bỏ).
- 2026-11-18 — Chủ dự án: "suy nghĩ kỹ xem tại sao vẫn còn hỏi a hay b". Đúng: phân tích đã chọn rõ (a), (b) không
  đáp được điểm 4 và 5; theo AGENTS.md ưu tiên #2 shaper phải quyết và báo cáo. Quyết (a) → OQ-D1. Từ đây shaper
  tự quyết điểm nào phân tích chọn rõ; chỉ hỏi khi phương án ngang nhau hoặc phụ thuộc ý định chủ dự án.

## 6. Thiết kế đã chốt {#design}

Bản nháp vòng 2; chỉ OQ-D1 đã chốt, phần còn lại là đề xuất của shaper.

- **Kho (OQ-D1).** Mỗi câu hỏi là một bản ghi append-only: id (mint qua cửa identity), người hỏi, `askedAt`, stage
  (discussion | plan | execution), ref nơi phát sinh, năm phần; câu trả lời `{text, by, answeredAt}` là bản ghi thứ
  hai cùng id. Danh sách mở = gộp. `ask`/`answer` phát `fgos.question.asked|answered` (OM-D13).
- **Người hỏi (đề xuất).** Verb tự điền, không nhận từ tay người gọi: session id + handle từ Identity (in-process),
  role nếu session đã đăng ký; khoá pane/tab lấy từ placement của Session Host/terminal-control nếu có, bỏ trống nếu
  không. Plan/phase hoặc discussion là `--ref` do người gọi đưa (chỉ người gọi biết), kiểm tra tồn tại.
- **Một chỗ xem và trả lời (đề xuất).** `fgos questions` (list mở, `answer <id>`) và màn S04 dashboard gateway mở
  rộng đọc/ghi qua cùng cửa. Gate Workflow hiện cạnh đó, trả lời qua cửa gate của nó. `fgos ask` (work item) gọi
  qua cửa mới hoặc nghỉ: planner quyết theo L10.
- **Người hỏi nhận câu trả lời (đề xuất).** Bằng id nhận lúc hỏi. Hook `UserPromptSubmit`/`Stop` của session tra
  câu đã trả lời mà người hỏi là session này và báo một dòng; session đó ghi câu trả lời + quyết định về nơi phát
  sinh rồi đánh dấu đã ghi nhận.
- **Đánh thức (đề xuất, chờ phối hợp).** Không thuộc verb câu hỏi: watcher của supervisor coi
  `fgos.question.answered` là một loại row; người hỏi còn sống và có khoá pane → terminal-control `send`; đã chết →
  supervisor mở session nối tiếp, session đó ghi câu trả lời về nơi phát sinh. Mailbox vẫn hoãn.

## 7. Danh mục hạng mục / task {#tasks}

Chưa có; điền khi hình dạng đã rõ.
