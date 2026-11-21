---
id: STR82
title: Auto-detect CLI trợ lý có sẵn trên máy làm executor mặc định cho `.fgos-runner.json` tự sinh, thay vì luôn giả định `claude`
status: done
priority: P2
area: general
created: 2026-07-22
---

# Why

(nêu ra 2026-07-22, deferred idea của str76-runner-bootstrap) — str76-runner-bootstrap's own decision khoá `claude` làm executor mặc định vì thiếu bằng chứng thật về người dùng không-Claude; ý tưởng auto-detect (`command -v claude`/`command -v codex`/... rồi điền template tương ứng, rơi về placeholder báo-lỗi-rõ nếu không tìm thấy CLI nào) đã bị loại ở vòng explore đầu vì thêm logic detect cần bảo trì danh sách CLI biết trước, và MVP giả định đối tượng dùng đã có sẵn Claude Code. Chỉ đáng làm khi có bằng chứng dogfood thật cho thấy người dùng thật đang chạy trên CLI khác `claude` và chạm lỗi "command not found" ở bước dispatch

# Done when

...

# Notes

Migrated from the done/declined section of the legacy backlog. Original status: done.
