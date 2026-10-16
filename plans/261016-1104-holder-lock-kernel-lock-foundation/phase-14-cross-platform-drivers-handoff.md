# Phase 14: đo đa nền tảng và driver Windows — track riêng, bàn giao sang 4.4

Không nằm trên đường găng của 4.2. Ghi để lõi 4.2 không đóng đường đa nền tảng (r4 §6.0, §6.1.2, §11 X1/X2; quyết định A2 của anh).

## Lõi 4.2 đã bảo đảm gì

- `LockDriver` (P02) và `ProcessPlatform` (P01) không có kiểu chỉ-POSIX trong API công khai; `cargo check` cho `x86_64-pc-windows-msvc` và `aarch64-apple-darwin` nằm trong tiêu chí xong.
- Facade Node (P03) không rẽ theo `process.platform`; hỏi driver `--guarantee`. Windows: `unsupported`, không lùi về v1.
- macOS: driver `flock` bật ngay; `fgctl` chặn activate khi vector mượn hoặc probe ngữ nghĩa đỏ (P05).

## Việc

| Việc | Nội dung | Ra gì |
|---|---|---|
| X2 macOS (GitHub Actions, runner `macos-latest`) | Một probe binary build từ `fgos-holder-lock` + `fgos-process`: `flock` qua description kế thừa (helper, git hook), stress có SIGKILL, borrow vectors với git của runner, `SCM_RIGHTS`, kill cây theo pgroup + `proc_listchildpids`, đường thoát `setsid` + fork đôi. Workflow riêng, chạy tay hoặc theo tag | Đổi mức macOS từ `kernel-unmeasured` sang `kernel` khi xanh; số đo vào spec |
| X1 Windows (máy thật của anh) | Process giữ lock `LockFileEx` cho Node (`fgos internal lock-hold`, sống suốt đời lock, chờ handle cha + stdin); acquire đồng bộ từ Node không addon (helper ghi file `ready` sau khi lock, Node chờ bằng `Atomics.wait`); `run_borrowed` git for Windows trong job `KILL_ON_JOB_CLOSE` của helper; hook nhận token một lần + tổ tiên (Toolhelp); chi phí một process mỗi lock | Số đo và mức thật (`job-scoped`); trạng thái herdr trên Windows |
| Driver Windows `lockfileex` (4.4) | Cài trong `fgos-holder-lock`, facade dùng handle là process helper (release = đóng stdin helper); `scan` Windows (Toolhelp) cho kiểm dừng | Windows bỏ `unsupported`; doctor báo `job-scoped` |
