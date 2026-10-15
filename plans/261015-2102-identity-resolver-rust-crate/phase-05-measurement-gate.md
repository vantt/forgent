# Phase 05: đo cổng S6 trên lời gọi thật

Thiết kế: [S6 §7 điều kiện 4](../reports/spike-s6-261015-1638-rust-identity-call-latency-pre-commit-hook.md).

## Yêu cầu

Hook thêm **≤5 ms p95 warm** và **≤10 ms cold lần đầu** (anh quyết 2026-10-15: nới từ 6 ms; cold chỉ xảy ra một lần sau khi OS đẩy binary khỏi cache, warm đã đạt, riêng exec `fgos identity` cold 4,45 ms median / 5,08 ms p95; giảm thời gian nạp binary hoặc số module Node là việc riêng nếu cần) so với baseline Node, đo bằng lời gọi thật (binary release-mode của nhánh, `fgos identity`), không dùng proxy `version`.

## Cách đo

1. Build release `cargo build --release -p fgos`.
2. Dùng lại harness S6 (`scratchpad/s6/hook-bench.mjs`, `spawn-bench.mjs`): repo nháp chứa hook + `src/` của **main** (baseline) và của **nhánh** (mới), cùng máy, xen kẽ, N ≥ 25 mỗi bên, warm sau 3 lần warmup; cold bằng `posix_fadvise(DONTNEED)` trên binary trước mỗi lần.
3. Đo riêng: `execFileSync(bin, ['identity', '--pid', …])` warm/cold; một process Node mới chạy `addWork` (một exec trước lock).
4. Ghi min/median/p95, tải máy, commit đo vào report.

## Không đạt thì

Dừng, không land phase 03. Hướng xử lý cân nhắc: bỏ bước `--fgos-dir` khỏi lời gọi trong hook (hook chỉ dùng `id`), hoặc giảm chi phí khởi động provider (không dựng tokio cho route identity). Báo anh nếu phải đổi quyết định đã duyệt.
