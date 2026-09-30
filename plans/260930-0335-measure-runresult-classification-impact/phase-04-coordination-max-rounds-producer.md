---
phase: 4
title: "Producer P3' — coordination chạm maxRounds"
status: blocked-by-phase-02
priority: P1
effort: stub
dependencies: [2]
---

# Phase 4: Producer P3' — coordination chạm maxRounds

## Overview
P3' (bảng producer trong [plan.md](plan.md)): Coordination ghi friction khi session chạm trần round.
- **Subject:** `session:<id>`
- **Khi nào ghi:** Session bị chặn vì vượt `aggregateBounds.maxRounds`
- **Ai resolve, khi nào:** Coordination, khi session về trạng thái kết thúc
- **Căn cứ lúc thu hẹp (2026-09-29):** Memory: `maxRounds:10` là trần cứng của cả session, và khi chạm trần phải thoát bằng tay. P3' dùng luôn giá trị `maxRounds` có sẵn nên không cần ngưỡng mới.

Phase này **blocked-by-phase-02**: không viết chi tiết, không implement, cho đến khi [phase 2](phase-02-decide-friction-producers.md) giữ P3'.

## Ràng buộc
- Cửa ghi dùng chung: `fgos friction record/resolve` (Node) hoặc lib `fgos_observe::friction` (Rust). Không có writer riêng.
- Producer đặt trong **component owner** (coordination). Observe không tự suy ra friction từ dữ liệu của người khác.
- Ghi friction là kênh phụ **best-effort**: lỗi ghi thành `friction-write-failed` trong invocation-faults, không làm hỏng thao tác chính.
- **Work không đọc friction**; Observe không join state của Work. Producer chỉ ghi và resolve.
- Store Observe shard theo writer (`.fgos/observe/friction/<writerId>.jsonl`).
- Không lọc trùng lúc ghi: mỗi lần chạm cap là một record.

Chi tiết file/test/steps viết ở phase 2 nếu producer được giữ.
