---
id: STR67
title: "Goal-directed planning: người dùng khai MVP/milestone, fgOS tự sắp xếp việc hướng tới nó nhanh nhất"
status: done
priority: P2
area: general
created: 2026-07-20
---

# Why

(nêu ra + escalate 2026-07-20, trong lúc bàn P50 và soạn câu MVP nháp cho chính fgOS) — KHÔNG phải thói quen roadmap nội bộ của team fgOS, mà là **tính năng sản phẩm cấp cho người dùng cuối**: một người dùng fgOS xây agent app của họ tự khai mục tiêu (MVP/milestone) của dự án HỌ, và fgOS tự sắp xếp/ưu tiên backlog hướng tới mục tiêu đó nhanh nhất — câu MVP nháp của chính fgOS (`docs/history/p50-workflow-induct/reports/...` artifact 2026-07-20) trở thành ca dogfood ĐẦU TIÊN của chính tính năng này, không phải một quyết định nội bộ rời rạc. **Đã có building block liên quan** trong `work-graph-intelligence` (`src/state/graph-metrics.mjs`): `criticalPath(view)` (chuỗi phụ thuộc dài nhất, số bước tối thiểu) và `greedyTopUnblock(view, k)` (greedy xếp hạng việc chưa xong theo mức mở-khoá, thuật toán submodular-cover) — cả hai hiện tính trên TOÀN BỘ graph ("mở khoá mọi thứ"); tính năng mới cần biến thể SCOPED THEO GOAL (chỉ xếp hạng việc nằm trên đường tới một target đã khai, không phải mọi thứ). Cần bee-exploring riêng trước khi shape — còn gray-area thật: "goal" là work-item hay entity mới? liên hệ thế nào với dep-graph/parent hiện có?

# Done when

...

# Notes

Migrated from the done/declined section of the legacy backlog. Original status: done.
