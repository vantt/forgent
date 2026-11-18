# Câu hỏi cho owner: Miu nhắn trực tiếp peer (SendMessage) từ sandbox

1. **Chuyện gì đang xảy ra.** Phase 7 đang mở quyền cho Miu: ghi `docs/backlog.md`/`docs/discussions`, gửi mail (mailbox),
   Identity nhận Miu là `head:secretary-miu`. Phần "nhắn trực tiếp peer qua SendMessage" thì mở socket thôi chưa đủ.
2. **Nguyên nhân** (đã chứng minh bằng bwrap repro, `reports/phase-07.md` §3). Peer nghe ở `/run/user/1000/cc-socks/<pid>.sock`
   và đăng ký ở `~/.claude/sessions/<pid>.json` + `<pid>.<hash>.key`. Head chạy trong pid namespace riêng (`--unshare-pid`):
   trong đó pid của peer đọc ra 0, nên Claude Code không xác minh được peer (liveness unknown) và socket của Miu bị đặt
   theo pid trong namespace (2), dễ trùng. `--unshare-pid` là bất biến "namespace rỗng ⇒ cây tiến trình đã chết" mà gate dùng
   để dọn.
3. **Các lựa chọn.**
   - A. Head bỏ `--unshare-pid` và được ro-bind `cc-socks` + `~/.claude/sessions` (lộ file `.key` của peer cho Miu, chỉ đọc).
     Lợi: SendMessage chạy như session thường. Hại: mất bất biến dọn cây, phải thay bằng cgroup/pidfd cho head (~150-300
     dòng Rust ở run-supervisor gate, 0.5-1 ngày); Miu đọc được khoá peer.
   - B. Miu không SendMessage; mọi trao đổi với peer đi qua mailbox (đang mở trong phase 7) — peer nhận qua hook mailbox.
     Lợi: không đụng bất biến, không lộ khoá, 0 code thêm. Hại: chậm hơn một nhịp (mail đến ở lượt sau của peer), không thấy
     ListAgents liveness.
   - C. B ngay bây giờ, A làm sau thành item riêng nếu thực tế mailbox không đủ.
4. **Khuyến nghị:** C. Miu hết bị kẹt ngay khi phase 7 land (ghi file + mailbox + identity), không mở rộng sandbox khi chưa
   chứng minh cần.
5. **Phạm vi câu trả lời.** "C" cho phép: phase 7 land không có SendMessage; skill fgos-secretary ghi rõ "nhắn peer qua
   `fgos mailbox send`"; một backlog row cho A. Không cho phép bỏ `--unshare-pid` hay lộ `.key` trong plan này.

## Trả lời của owner (2026-11-18, qua supervisor)

- 21:4x: **C** — phase 7 land không có SendMessage; skill fgos-secretary ghi "nhắn peer qua `fgos mailbox send`"; không bỏ
  `--unshare-pid`, không lộ `.key` trong phase 7.
- 21:5x (sửa): làm C ngay, rồi **A ngay sau, trong plan này**: thành phase 7b (không phải backlog item sau).
