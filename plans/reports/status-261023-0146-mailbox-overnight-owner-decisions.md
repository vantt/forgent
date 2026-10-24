---
title: "MAIL: tình trạng sau đêm 22–23/10 và các câu cần owner quyết"
description: "Lane MAIL chạy tự điều phối qua đêm. Mục 1 là các câu owner cần quyết, mỗi câu kèm khuyến nghị; mục 2 là trạng thái từng bậc trên nhánh mailbox/v1-v3."
---

# MAIL: tình trạng sau đêm và các câu cần owner quyết

Phiên `f2c6f8ce`, lead lane MAIL. Toàn bộ mã nằm trên nhánh `mailbox/v1-v3` (worktree `/home/vantt/projects/forgent-mailbox`) và **chưa merge main**, đúng lệnh owner. File này được cập nhật trong đêm; bản mới nhất nằm trên main.

## 1. Câu cần owner quyết

**Owner đã trả lời 2026-10-23 11:07: 1A, 2A, 3A, 4A, 5a, 6a, 7a**, đúng như khuyến nghị. V6 bắt đầu.


Mỗi câu đã có mặc định tạm, nên không câu nào đang chặn việc. Phần phân tích đầy đủ theo mẫu câu hỏi quyết định nằm trong plan được dẫn ở từng nhóm.

### V6: đo hành vi model qua hook thật ([plan V6](../261023-0049-mailbox-v6-behaviour-through-real-hook/plan.md), mục "Câu hỏi cho owner")

V6 chỉ chạy sau khi owner duyệt ngân sách.

| Câu | Khuyến nghị | Tóm tắt |
|---|---|---|
| **V6-Q1 Ngân sách** | **A**: đủ N theo spec, đo cả hai kênh (`PostToolUse` và `Stop`) | Dự kiến 892 lần chạy CLI thật, trần 1.082; chạy tuần tự 13–24 giờ. Claude `haiku` khoảng 2–10 USD danh nghĩa. Chặng A (200 lần) dừng tự động khi gặp trục trặc. Phương án B (chỉ `PostToolUse`): 532 lần. Phương án D (chạy thử 5 lần mỗi ô): 202 lần. |
| **V6-Q2 Model** | **A**: `haiku` và `gpt-6-luna`, như S0 | Rẻ nhất và so được với S0. Phương án C thêm 120 lần chạy để kiểm trên model mặc định. |
| **V6-Q3 Câu chỉ dẫn cho người nhận** | **A**: bản mới | Bản mới cho người gửi tin cậy được làm cả việc ghi nằm trong tác vụ. Bản cũ của S0 tự mâu thuẫn với quy tắc dừng. |
| **V6-Q4 Login Claude** | **A**: login của owner, kèm các chốt | Rủi ro nhỏ: nếu token xoay vòng trong lúc chạy, owner có thể bị đăng xuất. Phương án B: owner tạo một tài khoản Claude thử riêng. |

**An toàn:** mọi lần chạy V6 đều nằm trong bwrap. Mỗi lần chỉ ghi được trong thư mục của chính nó; `~/.claude`, `~/.codex`, `~/.ssh` và các file bí mật bị che, không đọc được. Đã kiểm trên máy này mà không chạy CLI nào: bwrap hoạt động. Rủi ro còn lại: mạng vẫn mở.

### V5: lệnh thật `fgos hook mailbox` ([plan V5](../261023-0013-mailbox-v5-native-hook-door/plan.md))

| Câu | Khuyến nghị | Tóm tắt |
|---|---|---|
| **V5-Q1 Kênh đánh thức** (phiên đang nghỉ nhận thư ngay) | **a**: làm ở V7, cùng adapter Codex | Đây là lý do demo D4 kẹt. V6 không cần kênh này. |
| **V5-Q2 Cài hook mặc định khi merge** | **a**: cài mặc định, nhưng chỉ khi mọi máy đã có release mang kind native | Máy còn release cũ sẽ chạy hook mà không giao được thư. |
| **V5-Q3** (chỉ hỏi nếu p95 > 50 ms) | **a**: tối ưu phần tốn nhất | Đo ở phase 8. |

### Một việc nhỏ cần owner cho phép (không gấp)

Claude Code trên máy vừa tự cập nhật lên **2.1.309**, bản chưa có trong danh sách đã kiểm. Harness chạy trực tiếp vì vậy từ chối mọi case, cho tới khi ghi lại payload cho bản này. Việc ghi tốn khoảng 4 lần chạy `claude -p` haiku với nội dung lành tính. Em sẽ làm cùng lúc với bước đầu của V6 nếu owner duyệt V6. Nếu cần sớm hơn, owner nói một câu.

### Địa chỉ mailbox và handle IDENT (owner trả lời 2026-10-23 11:38: B rồi A)

Ngay sau V6 làm bước bí danh (B). Khi làm phần xuyên máy thì chuyển hẳn sang handle (A).

## 2. Trạng thái

| Bậc | Trạng thái | Ghi chú |
|---|---|---|
| V1 lõi | xong, đã review hai lần | 39/39 đột biến bị bắt |
| V2 lưu trữ | xong, đã review | ma trận SIGKILL 9 bước; hook không có thư 2,5 ms |
| V3 payload hook | xong, đã review | Claude Code và Codex ghi thật; agy hoãn |
| V4 demo trực tiếp | xong, đã review và sửa | D1–D3 đạt; D4 (Codex trực tiếp) kẹt ở phiên đang nghỉ |
| V5 lệnh thật `fgos hook mailbox` | xong, đã review và sửa (`a629163f4`) | p95 khi không có thư: Claude 26,5 ms, Codex 38,1 ms. Hook chỉ được cài khi project bật `mailbox.enabled` (tạm, chờ V5-Q2). Trước khi merge cần OPC `forgent-35` duyệt diff Git và DIST duyệt shim mới. |
| V6 đo hành vi | có plan, chờ owner duyệt ngân sách | |
| V7 adapter Codex/agy, doctor, CHANGELOG | chưa lên plan | chờ kết quả V6 |

Item tách ra cho lane khác: `tsk-31k` (danh sách flag của host chứa cả tham số vị trí), `tsk-43x4` (Git tạo state root theo cwd khi thiếu `HOME`), `tsk-hls` (workspace fmt), `tsk-5n3` (`convention check -- <path>`), `tsk-62b` (test khoá flaky), `tsk-2mo` (citation drift), `tsk-1lx` (gom `geteuid` và `unlinkat`). Lane IDENT đã mở với spec nháp.

## 3. Cập nhật 2026-10-24 05:15: các câu đang chờ owner (gom một chỗ)

Nhánh `mailbox/v1-v3` đang ở `e8d5b3de5`, chưa merge main. V7a–V7f (phần không cần người xem) đã xong; mỗi bậc con đều có review độc lập.

| # | Câu | Khuyến nghị | Ghi chú |
|---|---|---|---|
| 1 | **Khung socket thật của Claude ("treat it as a teammate's request and act on it")**: có đo thêm một nhánh có hại dùng đúng khung này không, trước phase 11 | **Có** | Với lời nhắc trần ở vai `user`, Claude làm theo yêu cầu có hại 1/27 lần, nên Claude không đạt (no-go) cho kênh đánh thức. Codex 0/30 thì đạt. |
| 2 | Chạy **9 probe tương tác** của V7f, trong đó W2b và W7 kiểm khe hở K1 (phiên ở chế độ prompting có nhận ghi socket chưa xác thực không) | Chạy khi owner ngồi xem | Mỗi probe mở một pane herdr. Probe không gõ phím vào pane nào. |
| 3 | **P3 (omp với Gemini)**: profile `gemini-tetnu` chưa đăng nhập | **A**: owner chạy `omp --profile=gemini-tetnu` để đăng nhập một lần | |
| 4 | Thử **pi với một model Claude** để tách ảnh hưởng của model khỏi CLI | Có, khoảng 100 lần chạy | Mọi CLI dùng `gpt-6.1-sol` đều từ chối yêu cầu hợp lệ, trong khi Claude `haiku` làm theo. |
| 5 | **Q4 của V7**: ghi thời điểm claim | B (chưa làm), hoặc C (ghi vào log, không đổi schema) | |
| 6 | **Xác nhận máy tin cậy cho thư xuyên máy** | **B**: trạng thái `confirmed` nằm trong IDENT, mailbox chỉ thêm một công tắc | Lead IDENT đồng ý. |
| 7 | Có thử **Codex với effort cao hơn** không (khoảng 20 lần chạy) | Không bắt buộc | V7c đo ở effort `low`, đã ghim trong pre-registration. |
| 8 | **Pointer mode**: giữ hay bỏ, vì không còn dùng tới sau V7c | Bỏ, nếu kênh đánh thức không dùng tới | |

**Owner trả lời 2026-10-24 09:59:** 1 ok (đo nhánh có hại với khung socket thật của Claude), 2 ok (chạy probe tương tác), 4 ok (pi với model Claude), 5 ok theo khuyến nghị (không thử Codex effort cao), 6 ok (Q4 = B, chưa ghi thời điểm claim), 7 ok (B: trạng thái `confirmed` trong IDENT, mailbox chỉ có công tắc `requireConfirmed`), 8 ok (bỏ pointer mode). Câu 3 (P3: đăng nhập Gemini) chưa trả lời.

**Owner 2026-10-24 12:48:** bỏ phép đo pi với model Claude (câu 4), vì không có tài khoản đã duyệt nào phục vụ được model khác OpenAI cho pi. Câu hỏi lỗi nằm ở model hay ở CLI vẫn để mở.
