# Technical Journal: Cập nhật stale contract tests và native subcommand help exit code

- **Date:** 2026-10-01
- **Author:** omp
- **Task:** Cập nhật test cũ theo contract hiện hành (RunResult v3, Observe friction, Rust host help exit code, hermetic test environment)

## Bối cảnh & Mục tiêu

Sau khi quan sát báo cáo baseline test suite đỏ `plans/reports/test-baseline-261001-1543-main-red-suite.md`, 5 test files đỏ do contract drift giữa code implementation đã xong (F5 Observe friction, F7 Observe outcomes, RunResult v3 dropped legacy status/confidence) và test cũ. Ngoài ra cần sửa Rust host parser cho các lệnh native có subcommand (`metrics`, `friction`) để thoát mã 0 khi nhận `--help`/`-h`, và dọn dẹp hai chỗ test tạm thời (xoá test `evolve` đã retire, làm hermetic test `host-bin`).

## Các thay đổi chính

1. **Section A (Test contract alignment):**
   - `test/e2e/runner-loop.test.mjs`:
     - Line 804: Đổi từ lệnh `fgos check` đã bị gỡ bỏ sang đọc trực tiếp `stateView(repoRoot).outcomes.item1` (predicted & actual).
     - Line 868: Bỏ `work.friction` khỏi assertion `events.jsonl`; thêm assertion đọc và kiểm tra bản ghi friction trong thư mục `.fgos/observe/friction/*.jsonl`.
   - `test/runner/assignment-dispatch.test.mjs`:
     - RunResult v3 đã gỡ bỏ `status` và `confidence` ở root của RunResult.
     - Thay thế assertion `parsed.status === 'done'` bằng `parsed.classification.outcome.category === 'ok'`.
     - Thay thế assertion `result.status === 'failed'` bằng `result.classification.outcome.category === 'policy'`.
     - Cập nhật assertion `runnerNote` kỳ vọng `{ summary: ... }` thay vì `{ status: 'failed', summary: ... }`.
     - Cập nhật assertion contract version kỳ vọng 3 thay vì 2 (`assignment-run-result` v3).
   - `test/runner/dispatch-operability-production-door.test.mjs`:
     - Cập nhật assertion `result.classification.outcome.category === 'ok'`.
     - Cập nhật `provenance` kỳ vọng `'native-v3'` thay vì `'native-v2'`.
     - Cập nhật `contract.version` kỳ vọng 3.

2. **Section B (Rust host native help exit code):**
   - `apps/fgos/src/main.rs`: Kiểm tra cờ `--help` / `-h` tại mức root command khi `route.subcommands == Some(true)`. Nếu có cờ help và không có subcommand, in trợ giúp usage và danh sách subcommand, thoát mã 0.
   - `packages/observe/rust/src/metrics_cli/mod.rs` & `packages/observe/rust/src/friction_cli.rs`: Bổ sung nhánh xử lý `"--help" | "-h" | "help"` trong hàm `dispatch()` trả về JSON `{ ok: true, command: ..., available_subcommands: ... }`.
   - Biên dịch lại `cargo build --release`, xác nhận `test/rust-host/release-tree.test.mjs` pass 3/3 và `cargo test` của crate observe pass 24/24.

3. **Section C (Dọn dẹp xử lý tạm):**
   - `test/cli/fgos-stage.test.mjs`: Xoá test `evolve` đã skip vì lệnh đã retire hoàn toàn ở commit `120af6b3d` và không cần duy trì tương thích ngược.
   - `src/util/host-bin.mjs`: Bổ sung tham số `options.packageRoot` và biến môi trường `FGOS_PACKAGE_ROOT` để cho phép chỉ định root/packageRoot dự phòng trong kiểm thử hermetic, tránh fallback sang active workspace installation trên máy dev.
   - `test/util/host-bin.test.mjs`: Bỏ các `t.skip()`, sử dụng `packageRoot` và `FGOS_PACKAGE_ROOT` để kiểm thử fallback `null` và `host-unavailable` hoàn toàn hermetic.

4. **Tích hợp:**
   - Tạo worktree riêng `../forgentX-stale-contract-tests` trên nhánh `fix/stale-contract-tests`.
   - Commit từng phần A → B → C bằng conventional commits.
   - Chạy kiểm thử xác nhận.
   - Merge `--no-ff` vào nhánh `main` qua commit `6b4171b05`.
