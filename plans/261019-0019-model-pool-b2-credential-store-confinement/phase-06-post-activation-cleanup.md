# Phase 06: dọn field cũ trong config forgentX sau khi release B2 active

**Cổng:** chỉ chạy khi release chứa B2 đã active ở forgentX (`fgos doctor` check
`active-release-matches-checkout` xanh trên main có B2). Activation do big lead xếp theo bảng chương trình
(trên máy owner đang gộp với đợt land GIT). Không chạy được trước đó: release cũ cần `resourceBindings`.

## Bước

1. Xoá `resourceBindings` và `env[<homeEnv>]` khỏi mọi invocation đã khai `credentialStore` trong
   `.fgos/config.json`. Giữ biến env khác (`PI_CONFIG_DIR`, …).
2. Test mới (hoặc mở rộng test phase 04): config đã commit không có invocation nào vừa có `credentialStore` vừa
   có `resourceBindings` hay `env[homeEnv]`.
3. `fgos doctor` và một round thật (`fgos run`, release đã active) với một invocation pi và một codex.
4. Cập nhật dòng MP-B2 trên bảng chương trình; ghi cho MP-C: còn `~/.fgos/config.json` (13 `resourceBindings`),
   mdview, mcp-skill-hub (mỗi cái 24) và nhánh suy trong `credentialStoreOf`.

## File

`.fgos/config.json`, một test config đã commit, dòng bảng chương trình.

## Rủi ro / rollback

Chạy trước activation sẽ làm release cũ khởi động private home không gắn env (pane read-only, chưa đăng nhập).
Cổng ở trên chặn việc này. Revert = khôi phục hai field.
