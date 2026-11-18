# Câu hỏi cho anh — các mục HARDEN còn treo (2026-11-18)

Soát lại 5 mục được nêu: **chỉ còn 1 câu thật sự cần anh**. Bốn mục kia đã quyết hoặc đã xong.

## Đã quyết, không hỏi lại

- **T6 phase 17 (settle thắng):** đã xong, commit `6b45c34c5` (board log `plans/261017-1313-fgos-platform-program-board/log.md:485`). Mặt trước của phase file `plans/261108-0934-harden-t6-workflow/phase-17-settle-wins.md:4` vẫn ghi `pending`, nhưng ghi vậy là cũ.
- **T6 chưa đạt mục tiêu kích thước (Node +10, tests +610; khi đóng là +44 / +695):** anh đã chấp nhận phần thiếu này trong quyết định 73 (log.md:483; `plans/261108-0934-harden-t6-workflow/plan.md:231`).
- **AU-21 (định nghĩa workflow nào được ưu tiên):** anh chọn (a) lúc 2026-11-09 18:17, quyết định 83: project đè được id có sẵn, payload đứng sau (`plans/261017-1313-fgos-platform-program-board/plan.md:268`; `docs/platform/workflow/spec.md:709`). Đã làm xong ở `75978e0fa`.
- **AU-22 (danh mục domain, chỉ một gốc):** anh chọn (a) lúc 2026-11-09 18:38, quyết định 85 Q2 (`plans/261017-1313-fgos-platform-program-board/plan.md:266`). Đã làm xong ở `86647c9b9`.

## Câu 1 — Có xoá các run `fgos run` thường không?

**Chuyện gì đang xảy ra:** Mỗi lần chạy `fgos run` không gắn với case nào là để lại một thư mục trong `.fgos/assignments`, và không có gì xoá chúng. Lệnh prune chỉ xoá run của các case đã đóng (`phase-20-plain-run-retention.md:15,19`).

**Nguyên nhân:** Prune lần theo sổ ghi của case. Run thường không có sổ nên không ai biết lúc nào xoá được. Báo cáo của mỗi run chỉ nằm trên đĩa, nên xoá là mất luôn. Hiện máy nào cũng chưa có số đo: lệnh đo (đã nằm trong guide từ `e12b0f419`) chưa ai chạy trên máy anh hay trên fg-server (log.md:489; backlog `docs/backlog.md:116`). Để tham khảo thôi: fg-server2 hôm nay có 234 thư mục, tổng 196 MB.

**Các lựa chọn:**
- A. Chưa làm gì: ghi lại số đo rồi đóng mục backlog. Tốn 0 dòng. Đĩa vẫn tiếp tục đầy dần.
- B. Lệnh xoá do anh tự chạy: `prune --plain --older-than N`, mặc định chỉ chạy thử (dry run). Khoảng +40 dòng Node, +40 dòng test, một phase mới. Anh phải nhớ tự chạy.
- C. Như B nhưng tự xoá khi đóng case (mặc định 14 ngày). Thêm vài dòng so với B. Báo cáo của run tự biến mất mà anh không hỏi.
- F. Thêm số liệu run thường vào output của `prune --json` để khỏi phải chạy lệnh đo. Khoảng +15 Node, +20 test. Ghép được với A hoặc B.

**Khuyến nghị:** Anh chạy lệnh đo trong guide `plans/reports/guide-261108-1230-owner-machine-harden-t6-workflow.md` (mục P20) trên máy anh, rồi dán kết quả vào. Nếu run thường chiếm ít dung lượng thì chọn A. Nếu chiếm phần lớn thì chọn B, và chỉ tính tới C sau khi anh đã xem một lần dry run thật.

**Phạm vi của câu trả lời:** Câu trả lời chỉ quyết định phase tiếp theo (có ước lượng và danh sách file riêng). Nó không đổi gì đã xong. Chọn A thì đóng phần này của backlog `p-tslryr3buq`.
