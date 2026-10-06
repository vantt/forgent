---
phase: F6
title: "Work source, baseline, runbook"
status: completed
priority: P1
effort: "1d"
dependencies: [F4, F5]
---

# Phase F6: Work source cộng baseline cộng runbook (mốc M4)

## Overview
Work (lớp ý định) cung cấp source tuỳ chọn cho #1/#2. Re-stage lên shim (đã stage lần đầu ở F3), chụp baseline lịch sử, viết runbook.

## Requirements
- **Work source** trong `packages/work-state/rust` (Work sở hữu), source id `work`:
  - Đọc `.fgos/events.jsonl` và `.fgos/events/*.jsonl` (streaming, merge theo `ts`) **chỉ cho các event thời gian** (`added`/`moved`/`asked`/`answered`/`gate-approved`). Mọi phần cần kết quả fold (status, outcomes, settlements, discovery) lấy từ projection `.fgos/cache/state.json` kèm kiểm revision. Không viết lại fold 1.017 dòng của `replay.mjs` trong Rust. <!-- Red Team 2026-09-29 -->
  - Observation, subject `work:<id>`:
    - `work.added`;
    - `work.moved` (attrs `from`, `to`);
    - `work.asked` (`to=awaiting-human` kèm `payload.ask`);
    - `work.answered` (rời `awaiting-human` kèm `payload.answer`);
    - `work.gate-approved`.
  - Scorecard mục `work`:
    - #1: `add → delivered` và `doing → awaiting-approval`, p50/p90 (giờ); chọn item có `→ delivered` trong khung, hoặc item trong `case --items`.
    - #2: số `asked` + `answered` + `gate-approved` mỗi item (mean/p90).
  - <!-- Updated: Validation Session 5 - Work ngừng đọc friction --> `friction list/show` **không** join status của Work: Observe không biết về state của Work.
- **Re-stage** qua đúng quy trình của F3 (một đường duy nhất để cài).
- **Baseline lịch sử**: `fgos metrics harness --since 2026-08-01 --until 2026-09-29`, lưu vào `plans/260929-1501-metrics-friction-rust-native/reports/baseline-2026-09.json`, kèm tóm tắt 10 dòng.
- **Runbook** `docs/how-to/measure-a-real-case.md`:
  - các bước: open → làm việc → đếm can thiệp tay → close → xem scorecard;
  - quy tắc bake-off: cùng loại việc, kích cỡ tương đương, mỗi project một case tại một thời điểm, cài cook-plan theo README của nó;
  - cách đọc từng field.

## Related Code Files
- Create: `docs/how-to/measure-a-real-case.md`, `plans/…/reports/baseline-2026-09.json`
- Create: `packages/work-state/rust/src/work_source.rs` <!-- Session 4: file theo làn -->
- Modify: `packages/work-state/rust/src/lib.rs` (chỉ khai báo `mod`), `apps/fgos/src/wiring/metrics_sources.rs` (nối Work source), `CHANGELOG.md`, `docs/enduser-docs-index.json` (regenerate)

## Implementation Steps
1. Viết Work source cộng test fixture; so #1 với một phép tính JS độc lập tới `delivered` và ghi vào `f4-parity.md`.
2. Re-stage (quy trình F3), rồi kiểm `fgctl status`.
3. Chụp baseline và viết runbook.
4. Chạy `detect_changes()` (sau khi kiểm posture impact-analysis) trước commit; chạy `npm test` và `cargo test --workspace`.

## Success Criteria
- [x] `fgos metrics harness --since 2026-09-01` có mục `work` (#1/#2).
- [x] Có baseline JSON và runbook; có dòng CHANGELOG; test xanh.

## Risk Assessment
- **Số #1 lệch với phép tính JS độc lập.** Dấu hiệu: p50 lệch hơn 5%. Cách xử lý: đối chiếu cách merge shard và dedupe `(src, seq)` trước khi kết luận.
