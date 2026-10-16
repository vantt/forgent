# Phase 14: probe 6.0.1 trên Windows và driver Windows — track riêng, bàn giao sang 4.4

Không nằm trên đường găng của 4.2. Ghi để lõi 4.2 không đóng đường đa nền tảng (r6 §6.0, §6.1.2, §11 X1/X2; quyết định A2 của anh).

## Lõi 4.2 đã bảo đảm gì

- `LockDriver` (P02) và `ProcessPlatform` (P01) không có kiểu chỉ-POSIX trong API công khai; `cargo check` cho `x86_64-pc-windows-msvc` và `aarch64-apple-darwin` nằm trong tiêu chí xong.
- Facade Node (P03) không rẽ theo `process.platform`; hỏi driver `--guarantee`. Windows: `unsupported`, không lùi về v1.
- macOS: driver `flock` bật ngay (X2 đã đo); `fgctl` chặn activate khi vector mượn hoặc probe ngữ nghĩa đỏ (P05).
- Luật 6.0.1 r6 đã nằm trong lõi cổng (P02): luật nhả (bước 0), kết thúc miền còn sót ngay, chờ có hạn `lock.predecessorKillWaitMs`. Driver Windows chỉ cần cài `domain_is_empty`/`domain_kill_all` cho `windows-job` và gọi `declare_domain` khi `run_borrowed` tạo job.

## Việc

| Việc | Nội dung | Ra gì |
|---|---|---|
| X2 macOS | **Đã chạy** (r6 §12.10, `tools/platform-probe`, commit `6449c06a3`): `flock` loại trừ và mượn qua description đúng; chứa process `best-effort` | macOS mức `kernel` cho lock từ 4.2 |
| Probe 6.0.1 (Windows thật) | Ba probe (`git-borrow-blocking-hook-predecessor-check`, `predecessor-record-stale`, `predecessor-drain-timeout`) **đã xanh trên cả ba nền** ở lần đo hai với job do supervisor giữ (r6 §12.11). Còn thiếu `predecessor-all-owners-dead`: holder và người giữ job cùng bị giết khi git bị chặn trong hook; contender mở job thất bại, chạy dự phòng Toolhelp; 50 lần, 0 lần đi tiếp khi còn process chưa signaled | **Chặn driver Windows** tới khi xanh |
| X1 Windows (máy thật của anh) | **Đã chạy phần chính** (r6 §12.10: helper thoát cùng cha 2,9 ms, lock trống 3,0 ms, Toolhelp đủ; lộ khe lock nhả trước khi job giết xong → luật 6.0.1). Thiết kế driver đã đo: Process giữ lock `LockFileEx` cho Node (`fgos internal lock-hold`, sống suốt đời lock, chờ handle cha + stdin); acquire đồng bộ từ Node không addon (helper ghi file `ready` sau khi lock, Node chờ bằng `Atomics.wait`); `run_borrowed` git for Windows trong job `KILL_ON_JOB_CLOSE` của helper; hook nhận token một lần + tổ tiên (Toolhelp); chi phí một process mỗi lock | Số đo và mức thật (`job-scoped`); trạng thái herdr trên Windows |
| Driver Windows `lockfileex` (4.4) | Cài trong `fgos-holder-lock`, facade dùng handle là process helper (release = đóng stdin helper); `scan` Windows (Toolhelp) cho kiểm dừng | Windows bỏ `unsupported`; doctor báo `job-scoped` |

## Hiệu chỉnh Windows từ r6 (cho 4.4, không đổi gì ở 4.2)

1. **Job cần người giữ handle thứ hai, ngoài process giữ lock**, sống qua cái chết của holder: ở attempt là supervisor/gate (5.3); ở `run_borrowed` gọi từ Node là một **process giữ job** (helper Rust nhỏ, ngoài job) do facade bật cạnh process giữ lock. Lý do đã đo: holder là người giữ handle duy nhất thì tên job biến mất ngay khi holder chết trong lúc `KILL_ON_JOB_CLOSE` còn đang giết member; `OpenJobObject` thất bại và luật cũ "mở không được = rỗng" cho đi tiếp sai (27/50 vi phạm ở lần đo đầu).
2. **"Rỗng"** = `ActiveProcesses == 0` **và** mọi process member (lấy lại `JobObjectBasicProcessIdList` mỗi lần hỏi, mở handle `SYNCHRONIZE`) đã signaled. Đếm thôi chưa đủ: `ActiveProcesses` về 0 trước khi process object signaled. Sau `TerminateJobObject` cũng chờ đúng điều kiện này.
3. **Không mở được job** (mọi người giữ handle đã chết, ví dụ cả process Node chết) → dự phòng Toolhelp: chờ tới khi không còn process nào có chuỗi cha (pid + thời điểm tạo) dẫn tới holder ghi trong record, và các process đó đã signaled. Dự phòng này **chưa đo**; probe `predecessor-all-owners-dead` ở bảng trên chặn driver Windows tới khi xanh.
4. Facade Node trên Windows vì vậy cần thêm process giữ job cho mỗi `runBorrowed` (chi phí ghi ở r6 §6.0.1); giao diện facade 4.2 không đổi.

