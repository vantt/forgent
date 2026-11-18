# Câu hỏi cho owner: peer nhắn được cho Miu (SendMessage chiều vào)

1. **Chuyện gì đang xảy ra.** Miu gen 6 gửi SendMessage tới peer được, gửi mailbox được. Nhưng Miu không hiện trong
   `ListAgents` của session khác, nên peer không SendMessage ngược cho Miu được.
2. **Nguyên nhân** (đo trực tiếp, [báo cáo](miu-comms-gaps.md)): Claude Code ghi đăng ký của chính nó vào
   `<configDir>/sessions/<pid>.json` + `.key` và socket vào `/run/user/1000/cc-socks/<pid>.sock`. Phase 7b (owner chọn
   "read-only") mount hai thư mục host đó chỉ-đọc, nên Claude Code của Miu không ghi được, lặng lẽ, không có đăng ký nào.
   (Lỗi người gửi mailbox "unregistered" cũng từ đây; cái đó em sửa không cần đổi quyền, đang làm.)
3. **Các lựa chọn.**
   - A. Cho Miu ghi hai thư mục đó (rw). Lợi: peer thấy và nhắn được Miu ngay; không code mới (~nửa ngày gồm test).
     Hại: Miu xoá/sửa được đăng ký, khoá, socket của session khác (chuyển hướng tin, làm session khác "offline").
     Đọc thì Miu đã đọc được hết khoá rồi (7b), nên A thêm khả năng phá, không thêm khả năng đọc.
   - B. Supervisor (Rust) sao đăng ký/socket của Miu ra thư mục host và sao đăng ký peer vào thư mục riêng của Miu.
     Lợi: Miu không đụng file của ai. Hại: 2-4 ngày, dựa vào layout file không tài liệu của Claude Code, dễ gãy khi
     Claude Code đổi phiên bản; còn chưa chắc socket qua symlink chạy (cần test 30 phút).
   - C. Giữ như hiện tại: peer nhắn Miu qua `fgos mailbox send` (sau bản sửa của em thì mailbox hai chiều chạy).
     Lợi: 0 công, không nới quyền. Hại: chậm một nhịp, peer phải dùng mailbox thay SendMessage.
4. **Khuyến nghị:** C ngay (mailbox hai chiều sau bản sửa), A nếu anh muốn SendMessage chiều vào: rủi ro A là phá
   trong cùng user, và Miu là secretary của chính anh.
5. **Phạm vi câu trả lời.** "A" cho phép: đổi hai mount peer-sessions của head có `peers` sang rw, ghi rủi ro vào spec
   confinement, cập nhật backlog `p-oqs75qwyco`; không đổi quyền nào khác. "C" cho phép: không đổi gì thêm. "B": mở một
   phase mới trong plan này với test spike 30 phút trước.

## Trả lời của owner (2026-11-19, qua supervisor)

**C ngay, rồi A.** C (mailbox hai chiều) đã chạy thật. A thành phase 7d (sau phase 4): hai mount peer-sessions
(`<configDir>/sessions` và `/run/user/<uid>/cc-socks`) chuyển sang đọc-ghi chỉ cho head có `peers`; ghi rủi ro vào spec
confinement (Miu xoá/sửa được đăng ký và socket của session khác); cập nhật backlog `p-oqs75qwyco`. Không đổi quyền nào khác.
