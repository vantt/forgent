# Phase 01: cổng chứa process + driver Linux

Wave 1. Nhánh `run-supervisor/p01-containment-linux`, worktree `.claude/worktrees/rs-p01`. Phụ thuộc: P00.

## Đọc trước

r6 §5.3 (bảng driver), §9.3 điểm 3 và 7, §12.7; kongming M1, M2, N3; 4.2 P01 (`domain_is_empty/kill_all` cho `linux-gate`, `spawn_with_fds`, `judge`).

> **Amendment 2026-10-18:** `Domain` trong `packages/process/rust/src/lib.rs` chưa có `LinuxPgroup`; phase này thêm biến thể, `domain_is_empty/domain_kill_all` cho nó, và mọi `match` trên `Domain`. `LinuxGate` và `WindowsJob` đã có driver, không viết lại.

## Yêu cầu

- `containment/mod.rs`: trait `ContainmentDriver` theo contract; `select(env) -> Box<dyn ContainmentDriver>`: Linux thử `bwrap-pidns` (có `bwrap` theo đường dẫn tuyệt đối trong envelope hoặc cấu hình confinement, và user namespace dùng được: chạy `bwrap --unshare-user --unshare-pid --as-pid-1 -- /bin/true` một lần mỗi process, cache) → không được thì `linux-pgroup`.
- Driver `bwrap-pidns`:
  - `spawn_in`: argv = `bwrapPrefix` của envelope (do confinement dựng, P08) hoặc mặc định `bwrap --unshare-pid --as-pid-1 --dev-bind / / --proc /proc`, cộng `--info-fd N`, `--` và lệnh gate. Kiểm prefix có `--unshare-pid`, `--as-pid-1`, `--proc /proc`; thiếu → lỗi có tên (không tự sửa argv của confinement vì digest attest). Cờ `--die-with-parent` chỉ có khi `spec.mode == terminal` (M1); ở `direct` có cờ đó → lỗi.
  - Đọc `child-pid` (pid host của gate) từ `--info-fd`; trả tuple host `{host, bootId, pidNs, pid, startTime}` qua `fgos-process::facts`.
  - `domain = {kind: linux-gate, id: tuple của gate}`; `is_empty` = `judge(tuple) == Dead` (N3; dùng hàm `domain_is_empty` của 4.2, không viết lại); `kill_all` = `signal_by_identity(gate, SIGKILL)` rồi chờ `Dead`.
  - `guarantee() = {level: kernel, escapes: ["process do daemon ngoài namespace tạo (herdr, systemd, docker)"]}`.
- Driver `linux-pgroup` (best-effort): `PR_SET_CHILD_SUBREAPER` ở supervisor, gate chạy trong session/process group riêng; `is_empty` = không còn process nào có pgid đó và không còn hậu duệ của gate trong cây đã quét (`/proc/*/stat` ppid); `kill_all` = `killpg` + quét cây + SIGKILL theo identity; `domain = {kind: linux-pgroup, id: {pgid, gate tuple}}`; `guarantee = best-effort` với escape `setsid + fork đôi`.
- Không `cfg(target_os)` ngoài thư mục `containment/linux.rs` và `platform/`.

## File sở hữu

| Hành động | File |
|---|---|
| sửa | `packages/process/rust/src/containment/{mod.rs,linux.rs}`, `packages/process/rust/src/lib.rs`, `packages/process/rust/Cargo.toml` |
| tạo | `packages/process/rust/tests/{containment_bwrap.rs,containment_pgroup.rs}`, `packages/process/rust/tests/fixtures/heartbeat-grandchild.sh` |

## Test (process thật, không mock)

1. `bwrap-pidns`: lệnh trong miền in `$$` qua `/proc/self/stat` trong namespace → `1` (M2); gate host pid từ `--info-fd` khớp `/proc/<pid>/status` `NSpid` dòng đầu.
2. Cháu `setsid` ghi heartbeat; SIGKILL gate → heartbeat dừng trong 200 ms; `is_empty` = `empty` ngay khi gate `Dead` (12.7).
3. Cha của bwrap (process test đóng vai supervisor) bị SIGKILL ở `direct` → lệnh trong miền vẫn chạy (M1); cùng ca với `terminal` → lệnh chết.
4. `--die-with-parent` trong `direct` → lỗi có tên.
5. `linux-pgroup`: cây 20 process kể cả `setsid` một lần → `kill_all` kết thúc đủ; `setsid` + fork đôi → ghi là escape trong test (khẳng định `guarantee` nói đúng, không khẳng định bắt được).
6. Máy không có user namespace (giả bằng `unshare` thất bại không được: test **bỏ qua có tên** `skip: no-userns-to-disable`, không giả). `select` trên máy có bwrap → `bwrap-pidns`.

Lệnh: `cargo test -p fgos-process containment`.

## Tiêu chí nghiệm thu / rollback

Sáu ca xanh trên Linux dev; `cargo check` ba target. Rollback: revert (chưa caller production).
