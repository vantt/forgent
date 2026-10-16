# Phase 14: driver Windows/macOS — bàn giao sang 4.4

Không thực hiện trong plan này. Ghi để 4.4 nhận đúng hợp đồng và để lõi 4.2 không đóng đường đa nền tảng (yêu cầu của anh, r4 §6.0, §6.1.2, §11 X1/X2).

## Lõi 4.2 đã bảo đảm gì

- Cổng `LockDriver` (P02) và `ProcessPlatform` (P01) không có kiểu chỉ-POSIX trong API công khai; `cargo check` cho `x86_64-pc-windows-msvc` và `aarch64-apple-darwin` nằm trong tiêu chí xong.
- Facade Node (P03) không bao giờ rẽ theo `process.platform`; nó hỏi driver `--guarantee` và làm theo mức. Không có driver → `unavailable` → họ giữ v1, doctor báo `legacy-v1` (warn).
- macOS dùng driver `flock` ngay (Lead D5), mức `kernel-unmeasured`; `lock-borrow-vectors` + `lock-kernel-semantics` trên mount thật là phép đo.

## Việc của 4.4

| Việc | Nội dung | Bằng chứng cần |
|---|---|---|
| Spike X1 (Windows, máy thật) | Process giữ lock `LockFileEx` cho Node: `fgos internal lock-hold` sống suốt đời lock, chờ handle cha + stdin; chi phí một process mỗi lock; **acquire đồng bộ** từ Node không addon: helper ghi file `ready` sau khi lock, Node chờ bằng `Atomics.wait` + đọc file (facade 4.2 có `acquireSync` cho gateway/sessions/runner/state-lock); `run_borrowed` git for Windows trong job `KILL_ON_JOB_CLOSE` của helper; hook nhận token một lần + tổ tiên (Toolhelp) | Số đo + mức thật (`job-scoped`), trạng thái herdr trên Windows |
| Driver Windows `lockfileex` | Cài trong `fgos-holder-lock` + facade dùng handle là process helper (release = đóng stdin helper) | Test đa process trên Windows; vector mượn; doctor báo `job-scoped` |
| Spike X2 (macOS, máy thật) | `flock` qua description kế thừa (helper, hook), `SCM_RIGHTS`, kill cây theo pgroup + `proc_listchildpids` | Đổi mức từ `kernel-unmeasured` sang `kernel` khi xanh |
| Cutover trên Windows | Engine P04 cần `scan` Windows (Toolhelp) hoặc dùng `--attest-quiescent` | Mở khoá phase 13 |

## Cổng

Phase 13 chờ dòng "Driver Windows" xanh (hoặc quyết định khác của anh, câu hỏi 1 trong plan.md).
