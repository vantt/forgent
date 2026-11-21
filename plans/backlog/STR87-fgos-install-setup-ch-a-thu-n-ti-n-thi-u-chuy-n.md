---
id: STR87
title: fgOS install/setup chưa thuận tiện & thiếu chuyên nghiệp
status: done
priority: P2
area: general
created: 2026-07-23
---

# Why

(đề xuất người dùng 2026-07-23, ghi nhận từ proposal `.bee/backlog.jsonl` ts `2026-07-23T13:56:59.000Z`, layer `install`) — hiện chưa có install script tập trung xử lý tốt custom settings đa dạng, merge default settings mới vào settings hiện có của user, hay tự chẩn đoán môi trường (`doctor`). **Cần quyết định trước khi shape:** có nên viết lại install script bằng Rust hoặc Go để có UX tốt hơn và dễ handle nhiều platform/shell (bash/zsh) hơn shell script thuần — gray-area thật, ngôn ngữ cuối CHƯA chốt, cần cân nhắc ở bee-exploring/bee-planning. **First slice (không chờ quyết Rust/Go):** cập nhật phần bash để TỰ TÍNH ra path của fgos bin bằng đúng logic `git rev-parse --path-format=absolute --git-common-dir` (bee.mjs đã dùng logic này) để chạy đúng dù đứng ở đâu trong repo, kể cả trong worktree; ví dụ tham chiếu (zsh function) người dùng đưa ra: `bee() { local common_dir; if ! common_dir=$(git rev-parse --path-format=absolute --git-common-dir 2>/dev/null); then return 1; fi; node "$(dirname "$common_dir")/.bee/bin/bee.mjs" "$@"; }`.

# Done when

...

# Notes

Migrated from the done/declined section of the legacy backlog. Original status: done.
