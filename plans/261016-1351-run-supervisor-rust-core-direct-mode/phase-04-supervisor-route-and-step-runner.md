# Phase 04: route `fgos internal supervise` + step runner

Wave 1. Nhánh `run-supervisor/p04-supervise`, worktree `.claude/worktrees/rs-p04`. Phụ thuộc: P00; nghiệm thu cần P01, P03. Chủ `apps/fgos/src/main.rs` trong plan này: đăng ký `supervise`, `gate`, `adopt`, `attempt-step` (gọi hàm do P03, P06, P07 cung cấp; P07 chỉ cung cấp entry Node, phần Rust của `attempt-step` nằm ở đây).

## Đọc trước

r6 §9.1, §9.2 cột `direct`, §9.3 điểm 7 (đóng lease cwd ngay khi gate thoát), §9.4 bước 3–5 (phía supervisor), §9.5, §9.6, §9.10; kongming N2; 4.2 P02 (`Handle::declare_domain`, nhánh `internal` là câu lệnh đầu của `main`).

## Yêu cầu

1. Vào: CLOEXEC fd 3 (attempt) và fd 4 (cwd, nếu có); kiểm `--protocol`; đọc envelope, kiểm `digest`; `hostBin` trong envelope phải là chính binary đang chạy (so `std::env::current_exe` realpath) → lệch `host-version-mismatch`.
2. `containment.select` → `create(attemptId)` → **`declare_domain` trên handle lock attempt** (ghi `attempt.lock.predecessor.json`) **trước** khi gate được phép chạy agent: với `bwrap-pidns` tuple gate chỉ có sau spawn, nên thứ tự là `spawn_in(gate)` → nhận tuple → `declare_domain` → gửi `GO`. Gate không chạy agent trước `GO`, nên không có process agent nào trước record.
3. Kênh GO `direct`: socketpair, đầu gate map vào fd 5 của gate. Map fd cho gate: `{3: attempt, 4: cwd?, 5: go}` qua `spawn_with_fds`.
4. Publish `supervisor-binding.json` (contract P00) ngay sau `AGENT` (hoặc sau `GO` nếu agent chưa báo trong 2 s, cập nhật `agent` ở file `agent-binding.json` riêng; không ghi đè binding).
5. Canh: deadline mềm (mốc tuyệt đối trong envelope, `CLOCK_BOOTTIME`), idle theo `activity` của adapter agent-protocol (P05; `direct` = kích thước capture/sự kiện JSON); heartbeat `supervisor-heartbeat.json` mỗi 5 s (chỉ hiển thị); đọc `cancel-requested.json` (6.4 ghi) mỗi vòng. Hết giờ hoặc cancel: ghi `stop-requested.json{cause}` → `STOP` qua kênh GO + SIGTERM gate (theo identity).
6. Gate thoát: đọc `gate-exit.json`; **đóng fd 4 (lease cwd) ngay**; không có `gate-exit` mà gate `Dead` → receipt `gate-lost`. Publish receipt một lần (link).
7. **Step runner** (`steps.rs`, dùng chung với adopt P06): với mỗi bước trong envelope theo thứ tự, bỏ qua bước đã có receipt bước; chạy làm con bằng `spawn_with_fds` map **rỗng** (N2), env tường minh, `cwd`, giới hạn `stepTimeoutMs` (quá → SIGKILL theo identity, bước coi là chưa xong); exit 0 và bước tự publish receipt bước? **Không:** step runner publish receipt bước sau exit 0 của lệnh, trừ khi lệnh trả mã 75 (`EX_TEMPFAIL`, ví dụ `credential-home-kept`) → không publish, để adopt thử lại. Lỗi → dừng chuỗi, để attempt cho adopt.
8. `attempt-step` route (Rust phần đầu): resolve payload Node của `payloadRoot` (cùng cách [`legacy_exec.rs`](../../apps/fgos/src/legacy_exec.rs) đọc manifest `components.legacyNode`), exec `node <root>/src/run-supervisor/attempt-step.mjs <stepId> --run-dir …`, chuyển mã thoát.
9. Thoát supervisor sau bước cuối: đóng fd 3. Supervisor không bao giờ nhận pipe của agent.

## File sở hữu

| Hành động | File |
|---|---|
| tạo | `packages/run-supervisor/rust/src/{supervise.rs,steps.rs,envelope.rs,attempt_step.rs}` |
| tạo | `packages/run-supervisor/rust/tests/{supervise_lifecycle.rs,steps_runner.rs,supervise_crash.rs}` |
| sửa | `packages/run-supervisor/rust/{Cargo.toml,src/lib.rs}` (dep `fgos-process`, `fgos-holder-lock`, `fgos-agent-protocol`) |
| sửa | `apps/fgos/src/main.rs` (nhánh `internal`: bốn route), `apps/fgos/Cargo.toml` |
| sửa | `test/rust-host/internal-routes.test.mjs` (route mới không có trong help; protocol sai → exit 4) |

## Test

1. Vòng đời: envelope fixture + `noisy-agent.mjs` → binding, receipt `exited`, hai bước fixture (script ghi file) chạy đúng thứ tự, receipt bước; lock attempt trống sau khi supervisor thoát.
2. Supervisor SIGKILL giữa chừng → agent chạy xong (gate cầm IO, không `EPIPE`); lock vẫn bị giữ tới khi gate thoát (stranger `LOCK_SH|LOCK_NB` thất bại).
3. Deadline mềm 1 s → receipt `timeout`, `gate-exit.stoppedBy = soft-deadline`, cháu chết.
4. `cancel-requested.json` → `cancelled`.
5. Bước trả 75 → không có receipt bước, chuỗi dừng; bước treo quá `stepTimeoutMs` → bị giết, không receipt.
6. Bước không có inode lock trong `/proc/<step>/fd` (N2).
7. Lease cwd (fd 4) trống ngay khi gate thoát, trước khi bước chạy xong (bước fixture ngủ 2 s, contender `dispatch-cwd` giành được trong lúc đó).
8. `hostBin` lệch → `host-version-mismatch`, không spawn gì.

Lệnh: `cargo test -p fgos-run-supervisor -p fgos`; `env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID -u FGOS_SESSION_ID FGOS_HOST_BIN=<build> node --test test/rust-host/internal-routes.test.mjs test/rust-host/help-routes.test.mjs`.

## Tiêu chí nghiệm thu / rollback

Tám ca xanh. Rollback: revert (route không có caller production tới P09).
