# Phase 14: probe 6.0.1 trên Windows và driver Windows — track riêng, bàn giao sang 4.4

Không nằm trên đường găng của 4.2. Ghi để lõi 4.2 không đóng đường đa nền tảng (r5 §6.0, §6.1.2, §11 X1/X2; quyết định A2 của anh).

## Lõi 4.2 đã bảo đảm gì

- `LockDriver` (P02) và `ProcessPlatform` (P01) không có kiểu chỉ-POSIX trong API công khai; `cargo check` cho `x86_64-pc-windows-msvc` và `aarch64-apple-darwin` nằm trong tiêu chí xong.
- Facade Node (P03) không rẽ theo `process.platform`; hỏi driver `--guarantee`. Windows: `unsupported`, không lùi về v1.
- macOS: driver `flock` bật ngay (X2 đã đo); `fgctl` chặn activate khi vector mượn hoặc probe ngữ nghĩa đỏ (P05).
- Luật 6.0.1 đã nằm trong lõi cổng (P02): driver Windows chỉ cần cài `domain_is_empty`/`domain_kill_all` cho `windows-job` (`OpenJobObject` theo tên, `ActiveProcesses == 0`, `TerminateJobObject`) và gọi `declare_domain` khi `run_borrowed` tạo job.

## Việc

| Việc | Nội dung | Ra gì |
|---|---|---|
| X2 macOS | **Đã chạy** (r5 §12.10, `tools/platform-probe`, commit `6449c06a3`): `flock` loại trừ và mượn qua description đúng; chứa process `best-effort` | macOS mức `kernel` cho lock từ 4.2 |
| Ba probe 6.0.1 (Windows thật, máy anh) | `git-borrow-blocking-hook-predecessor-check` (50 lần, 0 vi phạm), `predecessor-record-stale`, `predecessor-drain-timeout`, thêm vào `tools/platform-probe` | Điều kiện để viết driver Windows (r5 §11) |
| X1 Windows (máy thật của anh) | **Đã chạy phần chính** (r5 §12.10: helper thoát cùng cha 2,9 ms, lock trống 3,0 ms, Toolhelp đủ; lộ khe lock nhả trước khi job giết xong → luật 6.0.1). Thiết kế driver đã đo: Process giữ lock `LockFileEx` cho Node (`fgos internal lock-hold`, sống suốt đời lock, chờ handle cha + stdin); acquire đồng bộ từ Node không addon (helper ghi file `ready` sau khi lock, Node chờ bằng `Atomics.wait`); `run_borrowed` git for Windows trong job `KILL_ON_JOB_CLOSE` của helper; hook nhận token một lần + tổ tiên (Toolhelp); chi phí một process mỗi lock | Số đo và mức thật (`job-scoped`); trạng thái herdr trên Windows |
| Driver Windows `lockfileex` (4.4) | Cài trong `fgos-holder-lock`, facade dùng handle là process helper (release = đóng stdin helper); `scan` Windows (Toolhelp) cho kiểm dừng | Windows bỏ `unsupported`; doctor báo `job-scoped` |
