# Phase 06: bàn giao 4.4b — driver Windows và chứa process macOS

Không nằm trên đường găng. Ghi để 4.4a không đóng đường đa nền tảng và để plan 4.4b bắt đầu từ đúng chỗ. Kế thừa [phase 14 của 4.2](../261016-1104-holder-lock-kernel-lock-foundation/phase-14-cross-platform-drivers-handoff.md); chỗ nào phase 14 ghi "chưa đo" thì nay **đã đo** (r6 §12.12).

## 4.4a đã bảo đảm gì

- Ba caller Rust chỉ thấy `acquire/probe/release` của crate; không caller nào giữ fd, không rẽ theo OS. Đổi driver không chạm `init.rs`, `store.rs`, `store_lock.rs`.
- Windows hôm nay: `Unavailable` → lỗi có tên `lock-driver-unavailable` (D5). macOS: driver `flock` của 4.2 (X2 đo, macOS 26.6 arm64).
- `cargo check` hai target ngoài Linux nằm trong tiêu chí xong.

## Bằng chứng có sẵn cho 4.4b

| Câu hỏi | Kết quả | Nguồn |
|---|---|---|
| `LockFileEx` nhả khi process giữ chết | 0,1 ms sau `TerminateProcess`; con giữ handle kế thừa **không** giữ lock | r6 §12.10 |
| Process giữ lock (helper) thoát cùng cha | 2,9 ms; lock trống 3,0 ms | r6 §12.10 |
| Job `KILL_ON_JOB_CLOSE` giết con/cháu/detached; breakaway | 4,0 ms; breakaway bị từ chối | r6 §12.10 |
| Luật 6.0.1 với người giữ job thứ hai | 50/50 kết thúc ngay, 0 vi phạm, chờ thêm p95 6,9 ms | r6 §12.12 |
| Dự phòng Toolhelp khi mọi người giữ job chết (`predecessor-all-owners-dead`) | 0/50 vi phạm, chờ thêm p95 8,7 ms | r6 §12.12, [JSON Windows](../reports/evidence-261016-1247-platform-probe-all-owners-dead-report-windows.json) |
| macOS mượn qua kế thừa (`flock`, hook chặn, `gc.auto=1`) | Không lúc nào lock trống khi git/con còn sống | r6 §12.10 |
| macOS chứa process | `killpg` + quét cây đủ; `setsid` + fork đôi thoát (best-effort) | r6 §12.10 |

## Việc của 4.4b (plan riêng)

| Việc | Nội dung |
|---|---|
| Driver Windows `lockfileex` | Trong `fgos-holder-lock`: process giữ lock (`fgos internal lock-hold`, chờ handle cha + stdin), facade Node giữ handle là process helper; `run_borrowed` trong job `KILL_ON_JOB_CLOSE` của helper + **process giữ job thứ hai** ngoài job; "rỗng" = `ActiveProcesses == 0` **và** mọi member signaled; dự phòng Toolhelp theo chuỗi cha (pid + creation time); `predecessor.json` kind `windows-job` |
| Rust caller trên Windows | `fgctl`/observe gọi crate trong process: driver Windows cho caller Rust giữ `LockFileEx` trực tiếp trong process (không helper); kiểm lại luật 6.0.1 cho `fgctl` (không tạo miền) |
| Driver chứa process | Windows `job-object`, macOS `pgroup-tree` (best-effort, doctor báo mức) — consumer đầu tiên là 6.2 |
| Doctor | `lock-kernel-semantics` báo `job-scoped` trên Windows; bỏ dòng CHANGELOG "Windows `lock-driver-unavailable`" |
| Cách `terminal` trên Windows | Phụ thuộc herdr chạy trên Windows (máy probe: herdr không có trên PATH; `herdr-plugin.toml` chỉ khai `linux`, `macos`). Không thuộc 4.4b |
