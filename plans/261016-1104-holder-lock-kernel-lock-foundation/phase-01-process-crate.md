# Phase 01: crate `fgos-process` (facts + control phần 4.2 dùng)

Wave 1. Nhánh `holder-lock/p01-process`, worktree `.claude/worktrees/hl-p01`. Phụ thuộc: P00.

## Yêu cầu

- Mô-đun `facts`: `judge(tuple, observer) -> Alive|Dead|Unknown` đúng hai bảng r4 §5.1 (gồm zombie `Z`/`X`, record thiếu pid → `Unknown`, N4, anchor); `boot_id()`, `start_time(pid)`, `pid_ns()`; `lock_holders(dev, ino) -> Holders::List(Vec<ProcTuple>) | Holders::Unlistable` (Linux: quét `/proc/*/fdinfo/*`, dòng `lock:` khớp `dev:ino`); `scan(filter) -> Vec<ProcView{tuple, exe, cmdline, cwd, env_subset}>` cho quiescence (Linux: `/proc/*/{cmdline,cwd,environ}`, lỗi quyền → mục `unreadable`, không bỏ qua im lặng).
- Mô-đun `control`: `spawn_with_fds(cmd, fd_map) -> Child` (đóng mọi fd ≥ 3 không có trong map; fd trong map được `dup2` ở `pre_exec`, chỉ khoảnh khắc đó không `CLOEXEC`, r4 §6.1.1 điểm 1); `signal_by_identity(tuple, sig)` (Linux: `pidfd_open` → kiểm startTime → `pidfd_send_signal`).
- **Cổng trung lập OS:** trait `ProcessPlatform` (facts + control) với driver `linux`; `macos` và `windows` là driver thật nhưng chỉ phần có ngữ nghĩa rõ (macOS: `boot_id` qua `sysctl kern.bootsessionuuid`, `lock_holders → Unlistable`, `scan → Unsupported`; Windows: creation time thay boot id, `lock_holders → Unlistable`, `scan → Unsupported`). Kiểu công khai không chứa `RawFd`/`libc::pid_t` trần: dùng `ProcId(u32)`, `FdSlot(u32)` và `#[cfg(unix)]` bên trong driver.
- Không có gate primitive 5.2 (Lead D3).
- **Căn leaf Node** ([`process-identity.mjs`](../../src/runner/dispatch/process-identity.mjs), fs-only): thêm `judge(tuple)` đọc cùng vector `packages/process/contracts/process-facts.judge.v1.json`; `resolveHolderLiveness` ([`:59`](../../src/runner/dispatch/process-identity.mjs)) thành adapter của `judge` (`dead → 'dead'`, `alive|unknown → 'held'`) — đổi hành vi một chỗ: record thiếu pid từ `dead` thành `held` ([`:60`](../../src/runner/dispatch/process-identity.mjs), gemini R3-3), zombie thành `dead`. Thêm `pidExists(pid)` (`process.kill(pid,0)`, EPERM = tồn tại; được phép theo [`dispatch-reconciliation-import-graph.test.mjs:124`](../../test/runner/dispatch-reconciliation-import-graph.test.mjs)) để các phase cutover thay bản chép `isPidAlive` còn dùng ngoài lock.

Caller của `resolveHolderLiveness` (đổi hành vi record thiếu pid): `run-lock.mjs`, `provider-capacity.mjs`, `confinement/cleanup.mjs`, `detached-run-supervisor.mjs`, `herdr-round.mjs`, `herdr-reconcile.mjs`, `main-checkout-lock.mjs` (danh sách importer của `process-identity.mjs`, grep 2026-10-16). Executor grep lại từng lời gọi và ghi trong báo cáo ca nào có thể gặp record thiếu pid.

## File sở hữu

| Hành động | File |
|---|---|
| tạo | `packages/process/rust/src/{facts.rs,control.rs,platform/mod.rs,platform/linux.rs,platform/macos.rs,platform/windows.rs}`, `tests/{judge_vectors.rs,holders_multiprocess.rs,spawn_fds_leak.rs,signal_identity.rs}` |
| sửa | `packages/process/rust/{Cargo.toml,src/lib.rs}` |
| sửa | `src/runner/dispatch/process-identity.mjs` |
| tạo | `test/process/process-facts-vectors.test.mjs` |

## Bước

1. `judge` + vector (golden đỏ trước, rồi xanh) ở cả cargo và Node.
2. `lock_holders` + test đa process: process con giữ `flock` (test dùng `libc::flock` trực tiếp trong process con tự re-exec của test binary), cha thấy đúng pid con; con chết → danh sách rỗng.
3. `spawn_with_fds` + test rò: mở file `O_CLOEXEC`, spawn con với map `{3: fd}`, con spawn cháu không map; quét `/proc/<cháu>/fd` không có inode; `/proc/<con>/fd/3` có. Thêm ca không map: con không có inode (bắt lỗi Rust kế thừa fd ≥ 3, kongming F3).
4. `signal_by_identity`: startTime sai → từ chối, không gửi.
5. `scan` + test: process con có env `FGOS_STATE_ROOT=<tmp>` được thấy; process khác uid → `unreadable`, không mất.
6. `cargo check --target x86_64-pc-windows-msvc` và `aarch64-apple-darwin` (cài target bằng `rustup target add` nếu thiếu; chỉ `check`, không link).

## Test

`cargo test -p fgos-process`; `node --test test/process/process-facts-vectors.test.mjs test/runner/dispatch-reconciliation-import-graph.test.mjs`; test hiện có của caller `resolveHolderLiveness`: `node --test test/runner/provider-capacity.test.mjs test/runner/dispatch-liveness.test.mjs` và mọi file test import `run-lock.mjs` (grep `run-lock` trong `test/`).

## Tiêu chí nghiệm thu

- Vector chung xanh ở cargo và Node; không có bảng phán thứ hai.
- Test rò và holders chạy trên process thật, không mock.
- `cargo check` ba target xanh.

## Rủi ro / rollback

- Đổi "record thiếu pid → held" có thể giữ một ledger run-control có record hỏng mãi. Giảm thiểu: grep chỗ ghi record của `run-lock.mjs` (luôn có pid), test ca record hỏng hiện ra `held` và doctor hiện được. Rollback: revert commit này (crate chưa ai gọi ngoài test).
