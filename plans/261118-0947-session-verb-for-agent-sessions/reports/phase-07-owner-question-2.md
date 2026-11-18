# Câu hỏi cho owner: Miu ghi `docs/backlog.md` — chấp nhận một lỗ nhỏ trong `docs/` hay làm cửa ghi riêng

1. **Chuyện gì đang xảy ra.** Phase 7 đã xong và xanh (ghi backlog/discussions, mailbox gửi+nhận, Identity nhận Miu là head).
   Review tìm thấy: để Miu sửa được `docs/backlog.md` theo kiểu ghi file tạm rồi đổi tên (cách Claude Code Edit ghi), thư mục
   `docs/` phải được bind ghi được, các file khác trong `docs/` bind lại chỉ-đọc. Khi `git pull` trên máy thật ghi đè một file
   khác trong `docs/` (vd `docs/reading-map.md`), Linux gỡ bind chỉ-đọc của file đó trong sandbox, nên **từ đó tới lần Miu khởi
   động lại, Miu sửa được file docs đã bị pull ghi đè**. File mới xuất hiện trong `docs/` cũng ghi được.
2. **Nguyên nhân** (đã kiểm): hành vi kernel từ Linux 3.18 (unlink/rename trên host gỡ mount ở namespace khác). Cách cũ (bind
   riêng từng file) thì mất dữ liệu: pull thay backlog.md xong, Miu ghi vào inode đã xoá, mất lặng lẽ. Không có cửa `fgos backlog`.
3. **Các lựa chọn.**
   - A. Land như hiện tại, ghi rõ lỗ này trong spec. Lợi: Miu chạy được ngay khi OPC ra release. Hại: sau mỗi pull, các docs
     bị ghi đè trở thành ghi được với Miu (mọi sửa đều hiện trong `git status` của main checkout; skill cấm Miu sửa docs).
     Chi phí: 0.
   - B. A ngay, rồi thêm phase nhỏ: cửa ghi phía host `head write <path>` (Rust, ~200-300 dòng, nửa ngày): Miu gửi nội dung
     mới qua head-request socket, supervisor kiểm path nằm trong grant rồi ghi atomic; `docs/` trở lại chỉ-đọc hoàn toàn.
     Hại: Miu không dùng Edit trực tiếp cho backlog mà gọi verb.
   - C. Không land tới khi có B. Miu tiếp tục kẹt nửa ngày.
4. **Khuyến nghị:** B — Miu được mở ngay, lỗ chỉ sống tới khi cửa ghi land, và lỗ chỉ là docs đã track (sửa nào cũng thấy).
5. **Phạm vi câu trả lời.** "B" cho phép: land phase 7 với lỗ đã ghi trong spec; thêm phase 7c (cửa ghi phía host cho grant
   file, đóng lỗ) chạy sau 7b. Không đổi quyền nào khác.

## Trả lời của owner (2026-11-18, qua supervisor)

**B.** Land phase 7 ngay (b4876f495) với lỗ `docs/` ghi trong spec confinement; thêm phase 7c: cửa ghi phía host
`head write <path>` (Rust, kiểm path theo grant, ghi atomic) để `docs/` chỉ-đọc hoàn toàn trở lại; chạy sau 7b. Không đổi
quyền nào khác.
