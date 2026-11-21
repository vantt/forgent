---
id: STR66
title: Rename `src/state/domains.mjs` → `workflow-stage-graphs.mjs`
status: done
priority: P2
area: general
created: 2026-07-20
---

# Why

(nêu ra 2026-07-20, lúc bạn đọc thấy naming "domain" dễ nhầm với domain nghiệp vụ) — file thực chất là registry stage+transition-graph theo loại việc (`coding`/`synthetic`), không phải "domain" theo nghĩa DDD. Đã cân nhắc `workflow-shapes.mjs` vs `workflow-stage-graphs.mjs`, chọn vế sau vì cạnh chuyển-trạng-thái (transitions) là phần chính, không chỉ danh sách stage — tên phải nói rõ có "graph". Việc rename thật đụng mọi nơi import (`work.mjs`, `frontier.mjs`, `loop.mjs`, `stage.mjs`) — refactor thật, chưa làm, chỉ ghi nhận

# Done when

...

# Notes

Migrated from the done/declined section of the legacy backlog. Original status: done.
