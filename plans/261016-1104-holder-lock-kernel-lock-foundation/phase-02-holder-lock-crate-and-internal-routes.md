# Phase 02: crate `fgos-holder-lock`, driver `flock`, route nội bộ, state root, borrow vectors

Wave 1. Nhánh `holder-lock/p02-crate-routes`, worktree `.claude/worktrees/hl-p02`. Phụ thuộc: P00. Code song song với P01; `holders()` và `run_borrowed()` dùng `fgos-process`, nên nghiệm thu sau khi P01 vào nhánh tích hợp (rebase).

## Yêu cầu

**Cổng (r5 §6.0)**, trait `LockDriver`:

| Thao tác | Linux/macOS `flock` |
|---|---|
| `acquire(resource, Ex\|Sh, Wait::Try\|Ms(n)) -> Handle\|Held\|Timeout\|Unavailable` | `open(O_RDWR\|O_CREAT\|O_CLOEXEC)`, `flock`, kiểm `fstat.ino == stat(path).ino` (khác → đóng, thử lại) |
| `release(handle)` | `close`. Không bao giờ `LOCK_UN`; `Handle` không có `Drop` gọi `LOCK_UN` |
| `run_borrowed(handle, spec) -> ExitStatus` | `fgos_process::control::spawn_with_fds` map description vào fd 3, env `FGOS_LOCK_FD=<name>:3`; nếu lệnh là git: chèn `-c gc.auto=0 -c maintenance.auto=false`; chờ con |
| `probe(resource) -> Free\|Held` | description mới, `LOCK_SH\|LOCK_NB`, đóng ngay (kongming N6) |
| `holders(resource)` | `fgos_process::facts::lock_holders(dev, ino)`; macOS `Unlistable` |
| `guarantee(resource_dir)` | `{driver:"flock", exclusion:"kernel"\|"kernel", borrow:"kernel-fd", holders:"listable"\|"unlistable"}`; fs mạng (`statfs` magic NFS/SMB/CIFS) → `none` |

**Luật 6.0.1 trong `acquire`, từ driver đầu tiên (r5 §6.0.1, §11/4.2):** sau khi giữ được kernel lock, `acquire` (cài một lần trong lõi cổng, không lặp ở từng driver) đọc `<lockFile>.predecessor.json`:
1. Không có record → trả `Handle`.
2. Có record → hỏi `fgos_process::domain_is_empty`. `Empty` → trả `Handle`. `NotEmpty`/`Unknown` → chờ (hỏi lặp mỗi 1 ms) tối đa `drain_ms` (tham số, mặc định 2000; Node truyền `--drain-ms` từ cấu hình `lock.predecessorDrainMs`).
3. Quá hạn → `domain_kill_all` (ta đang giữ lock nên holder trước đã chết), chờ thêm một `drain_ms`. Vẫn không rỗng (hoặc `Refused`) → đóng description, trả `Held{reason: PredecessorDomainNotEmpty, domain}`.
4. API `Handle::declare_domain(domain)` ghi đè `predecessor.json` (ghi temp + rename, khi đang giữ lock) cho holder sắp tạo miền con. Ở 4.2 không ai gọi trên Linux: `run_borrowed` không tạo miền vì git tự giữ bản sao description (r5: probe `git-borrow-*` pass trên Linux/macOS). Consumer đầu tiên là attempt ở 6.2 và driver Windows ở 4.4.
5. `Handle::release` không xoá `predecessor.json` (record cũ trỏ tới miền đã rỗng chỉ tốn một lần `judge`); holder mới không tạo miền thì xoá record sau khi miền trước đã rỗng, để lần sau không phải hỏi lại.

Route `lock-fd` chạy đúng luật này trước khi in `acquired`: Node chỉ nhận `acquired` khi cả hai điều kiện đúng; `held` vì miền trước → Node đóng fd.

Handle là kiểu mờ; caller không thấy fd. Driver Windows: `cfg(windows)` trả `Unavailable` + `guarantee = {driver:"unsupported", exclusion:"unsupported", note:"driver Windows ở 4.4 sau spike X1"}` (quyết định A2: không lùi về v1). Không có kiểu chỉ-POSIX trong API công khai.

**State root (r5 §6.9):** `state_root() -> (PathBuf, Source)` đúng công thức [`store.rs:59-75`](../../packages/distribution/rust/src/store.rs) (`FGOS_STATE_ROOT` đã ghim thắng trước, rồi `FGOS_STATE_HOME` nguyên giá trị, `XDG_STATE_HOME/fgos`, `HOME`/`USERPROFILE` `/.local/state/fgos`). `resolve_machine_release_store_root` trong `store.rs` gọi hàm này (một nguồn). `lock_root() = state_root/locks`.

**Borrow vectors (r5 §6.1.1 điểm 8, kongming M4):** `borrow_vectors::run(git) -> Report{vectors:[{name, pass, detail}], gitVersion}` trong repo tạm, < 1 s mục tiêu: (1) alias git chạy shell tạo `sleep` nền; (2) filter clean/smudge; (3) hook tạo process nền; (4) `gc.auto=1` + một object rời. Mỗi vector: owner acquire, `run_borrowed` git, owner đóng; khẳng định `probe == Free` ngay sau đó. Kèm vector anh em: process cùng env `FGOS_LOCK_FD` nhưng tự mở file → `--borrowed-check` từ chối.

**Route nội bộ** (`apps/fgos/src/main.rs`): nhánh sớm nhất của `main()` khi `argv[1] == "internal"`, **trước** mọi composition/provider/spawn (để không có process con nào thừa hưởng fd 3), không có trong `command-routes.json` hay help:

- `internal lock-fd --protocol 1 (--try|--wait-ms N|--shared-try|--borrowed-check <path>|--guarantee <dir>)`: đặt `CLOEXEC` lên fd 3 ngay lệnh đầu (luật 6.1.1 điểm 2), `flock` description kế thừa, in một dòng JSON, thoát. `--borrowed-check`: đúng ba điều r5 §6.4 điểm 2 (env chỉ đúng slot; `fstat(3)` cùng `dev:ino` với path; `LOCK_EX\|LOCK_NB` thành công).
- `internal state-root --protocol 1`: in `{stateRoot, lockRoot, source}`.
- `internal quiesce-scan --protocol 1 --workspace <root> [--state-root <p>]`: gọi `fgos_process::facts::scan`, in danh sách process fgOS liên quan (cmdline có entry fgOS, cwd trong một worktree của workspace, env `FGOS_STATE_ROOT`) kèm payload root; không phán gì (P04 dùng danh sách này để kiểm dừng-toàn-bộ).
- `internal lock-borrow-vectors --protocol 1`: chạy `borrow_vectors::run`.
- `--protocol` khác 1 → exit 4, stderr `host-version-mismatch`.

**Host đặt `FGOS_STATE_ROOT`** trước khi exec payload Node ([`legacy_exec.rs:242-247`](../../apps/fgos/src/legacy_exec.rs)), giữ nguyên nếu env đã có.

## File sở hữu

| Hành động | File |
|---|---|
| tạo | `packages/holder-lock/rust/src/{port.rs,driver/mod.rs,driver/flock.rs,driver/windows.rs,state_root.rs,borrow_vectors.rs,route.rs}`, `tests/{multiprocess.rs,borrow_git.rs,route_leak.rs,state_root_vectors.rs,stress.rs}` |
| sửa | `packages/holder-lock/rust/{Cargo.toml,src/lib.rs}` |
| sửa | `apps/fgos/src/main.rs` (nhánh `internal`), `apps/fgos/src/legacy_exec.rs`, `apps/fgos/Cargo.toml` |
| sửa | `packages/distribution/rust/src/store.rs` (gọi `state_root`), `packages/distribution/rust/Cargo.toml` |
| tạo | `test/rust-host/internal-routes.test.mjs` (route chạy thật qua binary: không có trong help; protocol sai → exit 4) |

## Test (trước writer đầu tiên, r5 §11 4.2)

Cargo, đa process thật (test binary tự re-exec làm con):

1. Giữ sau khi helper thoát: con mở fd, gọi route `lock-fd --try` qua fd 3, route thoát; process lạ `Held`; con đóng → `Free`.
2. Một process hai description: lần hai `Held`; đóng lần một → lần hai `Acquired`.
3. Holder SIGKILL → lock trống ngay.
4. `--wait-ms 300` khi bị giữ → `timeout` sau ~300 ms; holder chết sau đó → trống (route không giữ gì).
5. Stress 8 process × 40 vòng, 10 holder bị SIGKILL trong vùng găng, marker file kiểm 0 vi phạm, 0 kẹt.
6. Rò description trên route: route được gọi với fd 3, sau khi thoát quét `/proc/*/fd` không còn process nào ngoài caller có inode; thêm ca `run_borrowed` với git có hook spawn cháu: sau khi git thoát, cháu không giữ inode (gc tắt).
7. Borrow vectors 4 ca + anh em bị từ chối; mỗi ca `probe == Free` ngay khi owner và git đã đóng. Một ca đối chứng **không** tắt gc với `gc.auto=1` + object rời phải cho thấy lock còn giữ (chứng minh vector bắt được lỗi; nếu git máy này không daemon hoá gc thì ghi lý do và dùng ca alias nền làm đối chứng).
8. `probe` dùng `LOCK_SH`: hai probe đồng thời không cản nhau; probe khi có holder EX → `Held`.
9. State root: mọi vector của P00 ở cargo.
10. **Luật 6.0.1 (Linux, miền `linux-gate`, process thật; bản đối chứng Linux của ba probe r5):**
    - `predecessor-check`: holder A giữ lock, ghi record trỏ tới một process con G (vai gate, `sleep` thật); SIGKILL A rồi cho G sống thêm 300 ms. Contender B lấy được kernel lock ngay nhưng `acquire` chỉ trả sau khi G chết; lặp 50 lần, 0 lần B đi tiếp khi G còn sống; ghi phân bố thời gian chờ.
    - `predecessor-record-stale`: record trỏ tới tuple đã chết → đi tiếp ngay (đo độ trễ thêm).
    - `predecessor-drain-timeout`: G bỏ qua SIGTERM và sống quá `drain_ms` (đặt 200 ms trong test) → B gửi SIGKILL theo identity → G chết → B đi tiếp; record trỏ tới pid 1 (không giết được khi không là root) → `held (predecessor-domain-not-empty)`, fd đã đóng, lock trống.
    - Không có record → không thêm độ trễ đo được (so với stress ở ca 5).
    - Qua route `lock-fd` từ Node-style caller (fd 3): cùng ba ca, kết quả JSON đúng `reason`.
11. `cargo check -p fgos-holder-lock --target x86_64-pc-windows-msvc` và `aarch64-apple-darwin`.

Lệnh: `cargo test -p fgos-holder-lock -p fgos -p fgos-distribution`; `node --test test/rust-host/internal-routes.test.mjs test/rust-host/help-routes.test.mjs test/rust-host/command-routes.test.mjs`.

## Tiêu chí nghiệm thu

- 11 nhóm test trên xanh; số đo p50/p95 của `lock-fd --try` (300 lần) ghi vào báo cáo phase (mục tiêu ~3 ms theo S6, không phải cổng chặn vì chỉ đường lạnh dùng).
- `fgos help` không liệt kê `internal`.

## Rủi ro / rollback

- `main()` nạp thứ gì đó spawn con trước nhánh `internal` → con thừa hưởng fd 3. Test 6 bắt; giữ nhánh `internal` là câu lệnh đầu tiên của `main`.
- `store.rs` đổi nguồn state root: vector P00 đảm bảo cùng công thức. Rollback: revert; crate chưa có caller production.
