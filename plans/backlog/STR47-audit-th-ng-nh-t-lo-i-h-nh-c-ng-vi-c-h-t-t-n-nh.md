---
id: STR47
title: Audit thống nhất **loại-hình công việc** + **hệ đặt tên/đánh mã** đang chạy song song trong hệ thống
status: done
priority: P2
area: general
created: 2026-11-21
---

# Why

Audit thống nhất **loại-hình công việc** + **hệ đặt tên/đánh mã** đang chạy song song trong hệ thống — chưa có review nào gộp chung: (a) `kind` work-item (`classify.mjs`: bug/feature/chore/docs, mặc định `task`) — đủ chưa, thiếu loại nào (vd spike, review); (b) nhiều hệ mã số tách biệt cùng sống mà chưa giải thích ranh giới ở một chỗ: P# tuần tự (docs/backlog.md, PBI sản phẩm), D-hex (decision record, per-feature CONTEXT.md + `.bee/decisions.jsonl`), R# (rule trong docs/platform/runner/subcomponents/h-6979005beaf7/spec.md#business-rules), C1-C9 (contract trong architecture-map.md), cell-id `<feature>-N` (bee); (c) tên feature kebab-case tự đặt tay, không qua cửa sinh id nào — dễ trùng/lệch nghĩa khi hai việc đặt tên gần nhau

# Done when

...

# Notes

Migrated from the done/declined section of the legacy backlog. Original status: done.
