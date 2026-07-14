# Approach: Phase 2 Routing

## Recommended path

Ba epic xếp theo nền-trước-máy-sau, mỗi epic một slice, chỉ slice hiện tại có cells: (1) **Substrate** — mở rộng state layer theo D5/D6/D7 (trạng thái `proposed` + cạnh từ chối, trường `tier`, event version + replay backward-compat có test); (2) **Cửa đọc** — lệnh frontier derive (R5/A2) + request-class (đọc không nghi thức); (3) **Runner** — vòng lặp tuần tự (A1): frontier → claim → worktree cô lập → dispatch agent headless theo tier→model → goal-check bằng verify của item → ghi `proposed`/recovery qua một cửa (D2/D3/D4), kèm recovery matrix + anti-loop + chain-handoff contract. Mọi ghi tiếp tục qua store facade; frontier/counters đều derive từ log (R3).

## Rejected alternatives

- Làm runner trước, substrate sau — runner sẽ chạy trên FSM thiếu `proposed`: đúng lỗ ghép nối fresh-eyes đã bắt.
- Gộp cả ba epic một slice — vi phạm cells-current-slice-only; slice 1 tự đứng được (schema mới có test, chưa cần runner).
- SQLite cho frontier query — L3 ngưỡng chưa chạm; fold in-memory đủ cho quy mô hiện tại.

## Risk map

| Component | Risk | Reason | Proof needed |
|---|---|---|---|
| Backward-compat replay (D7b) | MEDIUM | log Phase 1 đã commit phải replay nguyên vẹn dưới schema mới | test fixture = chính events.jsonl shape Phase 1; validating kiểm bằng fixture thật |
| FSM mở rộng trên 82 test hiện hành | LOW | done vẫn terminal, cạnh cũ giữ nguyên | suite hiện hành pass nguyên vẹn |
| Dispatch `claude -p` (slice 3) | HIGH | phụ thuộc máy user, format output, quyền ghi worktree | probe thật ở validating slice 3 — chạy 1 lệnh headless tối thiểu; KHÔNG giả định |
| Worktree cô lập + nhánh (slice 3) | MEDIUM | git worktree lifecycle, dọn rác | spike nhỏ ở validating slice 3 |
| Anti-loop counters derive từ log | LOW | đếm event re-dispatch theo item | unit test fold |

## Files and order (slice 1)

`src/state/work.mjs` (STATUSES + tier + version defaults) → `src/state/fsm.mjs` (cạnh mới) → `src/state/events.mjs` (event version) → `src/state/replay.mjs` (backward-compat defaults) → `src/state/store.mjs`/`bin/fgos.mjs` (verbs move mở rộng cho proposed) → tests (gồm fixture log Phase 1 nguyên bản).

## Relevant learnings

- 20260714-phase-1-state-layer: verify chạy nguyên văn lệnh literal; quote glob; ranh giới ghi khai per-cell ngay trong plan.
- 20260714-phase-1-review-fixes: remediation rẻ khi findings có probe — áp ngược: slice 3 phải probe dispatch thật trước khi tin.
- bee dogfood (tham chiếu hành vi): goal-check độc lập, rescue ladder, external executor qua prompt-file.

## Questions for validating

- Fixture log Phase 1: lấy log thật sinh từ binary Phase 1 (checkout commit 31c1300 chạy tạo log mẫu) hay viết tay theo spec? (khuyến nghị: sinh từ binary thật một lần, commit làm fixture)
- Slice 3 (khi tới lượt): lệnh headless cụ thể trên máy này — `claude -p` khả dụng? flags? output format bắt được?
