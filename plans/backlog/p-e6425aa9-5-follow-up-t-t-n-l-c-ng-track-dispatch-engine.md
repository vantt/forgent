---
id: p-e6425aa9
title: 5 follow-up đặt tên lúc đóng track `dispatch-engine-liveness-hardening` (2026-09-29, plan.md's "Expl
status: proposed
priority: P2
area: dispatch-engine-liveness-hardening
created: 2026-09-29
---

# Why

5 follow-up đặt tên lúc đóng track `dispatch-engine-liveness-hardening` (2026-09-29, plan.md's "Explicitly deferred" list, mục 2-6 — mục 1/shadow-binders đã xong, xem `tsk-p7-shadow-binders` ở mục Done): (a) `--force-new-attempt` chưa từng được wire vào một CLI flag thật; (b) chưa có test SIGKILL-probe riêng cho `isHerdrSpawnRunStillWorking` (bộ test herdr hiện có chỉ chứng minh không regression, không tái hiện đúng lớp bug đó); (c) `providerCapacityIsRunWorkerAlive` (lease reclaim) có cùng điểm mù cli-spawn-only cho herdr-spawn mà M1 từng có trước Phase 8a — cùng lớp gap, chỗ gọi khác, chưa sửa; (d) một race có sẵn, không liên quan, trong cơ chế tự-heal "assignment-created event has no assignmentRefs entry" của `replay.mjs`, phát hiện lúc stress-test Phase 5 (tái hiện y hệt trên main trước Phase 5, xác nhận không phải regression của track này); (e) tài liệu/CLI-help còn trỏ tới action `clear-assignment-claim` đã bị retire (Phase 5), chưa quét sạch.

# Done when

Mỗi mục trong 5 mục có quyết định sửa thật hoặc ghi rõ won't-fix: `--force-new-attempt` có CLI flag thật; có test SIGKILL-probe cho `isHerdrSpawnRunStillWorking`; điểm mù herdr-spawn của `providerCapacityIsRunWorkerAlive` được đóng (hoặc ghi rõ vì sao ngoài scope); race của `replay.mjs` được sửa hoặc tách file riêng; hết tham chiếu `clear-assignment-claim` còn sót

# Notes

Migrated from the legacy backlog table. Original status: proposed.
