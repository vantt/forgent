---
id: p-3c7681b8
title: Test rò rỉ fixture directory phiên coordination thật vào `.fgos/coordination/sessions/` sống của rep
status: done
priority: P2
area: dispatch-engine-liveness-hardening
created: 2026-09-29
---

# Why

Test rò rỉ fixture directory phiên coordination thật vào `.fgos/coordination/sessions/` sống của repo thay vì một tmp dir cô lập (quan sát 2026-09-29 lúc điều tra doctor check `coordination-sessions-closed`: 506 phiên "active" quá 7 ngày, một phần lớn là rác test). Một số trace về code đã fix từ 2026-09-05; một phiên khác trace về code CHƯA TỪNG commit vào git (chạy tay/WIP) — root cause tản mát, không phải một bug đơn sửa được một lần. Đã thảo luận mục tiêu với user (2026-09-29) nhưng CHƯA chốt: ưu tiên (1) chặn rò rỉ tương lai bằng test-isolation guard hay (2) dọn rác lịch sử trước — câu hỏi còn treo, chưa trả lời. Closed 2026-11-09: no code under `src/` writes `.fgos/coordination/sessions/` (only `src/runner/dispatch/runtime-inspection.mjs` reads it; the `coordination-sessions-closed` doctor row was retired in `fd4336b11`), the directory does not exist in the main checkout, and every run-tests run snapshots the whole `.fgos` before and after and fails on any added or modified file.

# Done when

Quyết định scope (guard / dọn / cả hai) + phần đã chọn được làm: fixture phiên coordination mới của test không bao giờ đụng `.fgos/coordination/sessions/` thật, và/hoặc rác phiên lịch sử được dọn an toàn

# Notes

Migrated from the legacy backlog table. Original status: done.
