# Phase 04: dọn attempt `running` kẹt

Wave 1. Nhánh `controller-death/p04-stuck-cleanup`, worktree `.claude/worktrees/cd-p04`. Phụ thuộc: P00; nghiệm thu cần P03 (hành động `abandon-legacy`).

## Đọc trước

plan.md D3; T8 §4.1 (unit run và pid của 6 attempt kẹt), §8 câu 5; 6.2 D10 (`legacy-run`), check `run-attempts-stuck` (6.2 P11); [`recover.mjs`](../../src/verbs/dispatch/recover.mjs) (door CAS settle); 4.2 P01 `judge`.

## Yêu cầu

1. **Attempt mới (v3):** kẹt nghĩa là chưa `closed` mà lock trống → đã có `run-attempts-stuck` + fix `sweepAttempts` (6.2). Ở đây chỉ thêm: một attempt `closed` mà `unit.json` của unit vẫn ghi `running` cho attempt đó → cập nhật hiển thị (không đổi kết quả) khi `inspect`/`resume` đọc; không ghi `unit.json` ngoài đường runner.
2. **Attempt cũ (`legacy-run`):** `src/run-supervisor/legacy-sweep.mjs` `findLegacyStuck({assignmentsRoot})`: run có `run.json` `status: running` không có `attempt.lock`. Thu mọi pid ghi trong run (controller trong `run.json`/`launch-envelope`, supervisor Node cũ trong `supervisor-binding`, worker binding, marker home bản 1 trỏ tới run). `settleLegacy(runDir)`: chỉ khi mọi tuple `judge == dead` **và** không còn home bản 1 trỏ tới run → settle `abandoned-legacy` qua hành động `abandon-legacy` của cửa recover (P03 thêm; P04 merge sau P03). Có tuple `alive`/`unknown` → giữ, trả lý do.
3. Không xoá thư mục run nào; chỉ settle.

## File sở hữu

| Hành động | File |
|---|---|
| tạo | `src/run-supervisor/legacy-sweep.mjs`, `test/run-supervisor/legacy-sweep.test.mjs`, fixture `test/fixtures/run-layout/legacy-stuck/**` (dựng theo cấu trúc T8 §4.4) |

## Test

1. Fixture run cũ, mọi pid chết (pid không tồn tại) → settle `abandoned-legacy`; chạy lần hai → không đổi.
2. Một pid còn sống (process thật) → giữ, lý do `pid-alive`.
3. Record thiếu startTime → `unknown` → giữ.
4. Còn home bản 1 trỏ tới run → giữ.

Lệnh: `node --test test/run-supervisor/legacy-sweep.test.mjs`.

## Tiêu chí nghiệm thu / rollback

Bốn ca xanh. Rollback: revert (chỉ settle, không xoá).
