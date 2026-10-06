---
phase: 3
title: "Producer P1 — dispatch run fail hạ tầng"
status: blocked-by-phase-02
priority: P1
effort: stub
dependencies: [2]
---

# Phase 3: Producer P1 — dispatch run fail hạ tầng

## Overview
P1 (bảng producer trong [plan.md](plan.md)): Dispatch ghi friction khi run fail do hạ tầng.
- **Subject:** `run:<runId>`
- **Khi nào ghi:** `classification.outcome.category === 'infra'` (plan RunResult, D2-A)
- **Ai resolve, khi nào:** Dispatch, khi assignment đó có run sau với `category === 'ok'`
- **Căn cứ lúc thu hẹp (2026-09-29):** 330/1.028 run `failed`, 74 `no-evidence` (chưa tách được hạ tầng với verdict)

Phase này **blocked-by-phase-02**: không viết chi tiết, không implement, cho đến khi [phase 2](phase-02-decide-friction-producers.md) giữ P1.

## Ràng buộc
- Cửa ghi dùng chung: `fgos friction record/resolve` (Node) hoặc lib `fgos_observe::friction` (Rust). Không có writer riêng.
- Producer đặt trong **component owner** (dispatch). Observe không tự suy ra friction từ dữ liệu của người khác.
- Ghi friction là kênh phụ **best-effort**: lỗi ghi thành `friction-write-failed` trong invocation-faults, không làm hỏng thao tác chính.
- **Work không đọc friction**; Observe không join state của Work. Producer chỉ ghi và resolve.
- Store Observe shard theo writer (`.fgos/observe/friction/<writerId>.jsonl`).
- Không lọc trùng lúc ghi: mỗi lần `infra` là một record (trừ khi phase 2 chốt ngưỡng khác).

Chi tiết file/test/steps viết ở phase 2 nếu producer được giữ.
