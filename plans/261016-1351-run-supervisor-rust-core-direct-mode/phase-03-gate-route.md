# Phase 03: route `fgos internal gate`

Wave 1. Nhánh `run-supervisor/p03-gate`, worktree `.claude/worktrees/rs-p03`. Phụ thuộc: P00; nghiệm thu cần P01 (bwrap thật). P04 đăng ký route trong `main.rs` và gọi `fgos_run_supervisor::gate::run`.

## Đọc trước

r6 §9.3 điểm 1–8, §9.5, §6.1.1 điểm 1–4; kongming M2, M3, N8, câu mở 3; [12.3](../reports/design-261016-1238-lock-and-run-supervisor-foundation-v3-r6.md) (EOF trước GO).

## Yêu cầu

1. Vào: đặt `FD_CLOEXEC` lên mọi fd lock nhận được (fd do supervisor map, ghi trong argv `--lock-fds 3,4`) **trước** mọi syscall khác (6.1.1 điểm 2).
2. GO (`direct`): fd socketpair kế thừa (`--go-fd N`). Gửi `HELLO`, chờ `GO`; EOF/lỗi trước `GO` → thoát mã 3, không chạy agent. So `attemptId` và `envelopeDigest` trong `GO` với envelope gate tự đọc (đường dẫn ở argv); lệch → thoát mã 3. Không so pid (M3).
3. Là pid 1 (bwrap `--as-pid-1`, kiểm `getpid() == 1` khi driver là `bwrap-pidns`, sai → thoát có tên): handler SIGTERM/SIGINT (chuyển signal cho group của agent), SIGCHLD; vòng `waitpid(-1, WNOHANG)` mỗi lần SIGCHLD để reap mọi zombie nhận nuôi suốt attempt.
4. Cầm IO: mở `capture.stdout/stderr` (append, 0600) và `dup2` vào 1, 2 của agent; stdin theo `stdinPolicy` (file brief hoặc `/dev/null`). Không pipe nào về supervisor.
5. Env: dựng từ envelope + side file (`env_clear` rồi đặt tường minh); thêm `FGOS_PIDNS_ANCHOR` = tuple host của gate (gate nhận qua argv từ supervisor sau `--info-fd`; gửi trong `GO`). Mint writer id là 6.3.
6. Spawn agent bằng `spawn_with_fds` (map rỗng: agent không nhận fd lock nào); gửi `AGENT{tuple}`.
7. Trần cứng: mốc `CLOCK_BOOTTIME` + bootId từ envelope; bootId khác → coi đã quá trần. Hết trần: SIGTERM group agent → chờ `gateKillGraceMs` (envelope) → SIGKILL `kill(-1)`.
8. Lý do dừng: khi nhận SIGTERM từ supervisor, đọc `stop-requested.json` (supervisor ghi trước khi gửi signal) để lấy `cause`; không có file → `cause: signal`.
9. Agent thoát → `kill(-1, SIGKILL)` → reap tới `ECHILD` → publish `gate-exit.json` (link một lần) → thoát. Gate giữ fd lock tới sau bước reap.
10. Windows/macOS: không pid 1. Windows: gate mở handle job theo tên (người giữ thứ hai cùng supervisor); macOS: agent trong group riêng, gate quét cây khi agent thoát rồi `kill_all`. Cùng hợp đồng `gate-exit`.

## File sở hữu

| Hành động | File |
|---|---|
| tạo | `packages/run-supervisor/rust/src/{gate.rs,go_channel.rs,publish.rs}` (publish link một lần dùng chung cho P04, P06) |
| tạo | `packages/run-supervisor/rust/tests/{gate_pid1.rs,gate_go.rs,gate_ceiling.rs}`, `packages/run-supervisor/rust/tests/fixtures/{noisy-agent.mjs,ignore-sigterm.sh}` (`noisy-agent.mjs`: CLI Node thật ghi stdout liên tục, tạo cháu `setsid`, ghi outbox khi xong) |
| sửa | `packages/run-supervisor/rust/{Cargo.toml,src/lib.rs}` |

## Test (qua bwrap thật, process thật)

1. EOF trước `GO` → mã 3, agent không chạy (file marker của fixture không xuất hiện).
2. `GO` sai digest → mã 3.
3. SIGTERM gate → agent dừng trong grace; `gate-exit.stoppedBy` theo `stop-requested`.
4. Agent bỏ qua SIGTERM → SIGKILL sau grace; trần cứng thi hành khi không có supervisor.
5. Gate SIGKILL khi agent có cháu `setsid` → cháu chết (12.7).
6. Attempt 60 s với 200 cháu ngắn hạn → không còn `Z` trong namespace khi kiểm giữa chừng.
7. Rò description: `/proc/<agent>/fd`, `/proc/<cháu>/fd` không có inode lock.
8. `gate-exit` publish đúng một lần; ghi lần hai → giữ bản đầu.

Lệnh: `cargo test -p fgos-run-supervisor gate`.

## Tiêu chí nghiệm thu / rollback

Tám ca xanh. Rollback: revert.
