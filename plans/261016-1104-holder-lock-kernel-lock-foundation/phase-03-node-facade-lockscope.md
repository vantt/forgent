# Phase 03: facade Node `LockScope`

Wave 1. Nhánh `holder-lock/p03-node-facade`, worktree `.claude/worktrees/hl-p03`. Phụ thuộc: P00 (contract). Code song song với P02; test thật cần binary của P02: rebase lên nhánh tích hợp sau khi P02 vào, build `cargo build -p fgos`, chạy với `FGOS_HOST_BIN=<binary đó>`.

## Yêu cầu

Thư mục component mới `src/holder-lock/` (facade Node của cổng r4 §6.0; caller không bao giờ thấy fd):

- `registry.mjs`: nạp `packages/holder-lock/contracts/lock-registry.v1.json`, giải mẫu đường dẫn (`fgosDir`, `lockRoot`, run dir), trả `{v3Path, v1Path, kind, rank, family, fence}`.
- `state-root.mjs`: đọc `FGOS_STATE_ROOT`; vắng (kênh `node bin/fgos.mjs`) thì gọi `fgos internal state-root` một lần mỗi process, cache.
- `driver.mjs`: tìm binary bằng `resolveActiveHostBin` ([`host-bin-path.mjs:68`](../../src/util/host-bin-path.mjs), cùng luật với identity), một lần mỗi process; hỏi `--guarantee <dir>` một lần mỗi thư mục lock; `exclusion == none` hoặc không có driver → mọi `acquire` trả `unavailable` với mã `lock-driver-unavailable` (đây là đường Windows/NFS ở 4.2, Lead D6).
- `index.mjs` — API:
  - `acquireSync(scope, name, params, {waitMs})` và `acquire(...)` (async: `--try` lặp bằng timer, không chặn event loop). `acquireSync` dùng `spawnSync(..., {killSignal:'SIGKILL', timeout})` với `--wait-ms` (r4 §6.3, B8). Mở file `O_RDWR|O_CREAT` (Node `openSync` đã `O_CLOEXEC`), gọi route với `stdio[3] = fd`, kiểm inode sau acquire.
  - `handle.release()` = `closeSync(fd)`; idempotent; không bao giờ `LOCK_UN`.
  - `probe(name, params)` → `--shared-try` trên description mới, đóng ngay.
  - `runBorrowed(handle, spec, {sync|async})`: chỉ hàm này được đặt fd lock vào `stdio`; env `FGOS_LOCK_FD=<name>:3`; nếu `spec.command` là git thì chèn `-c gc.auto=0 -c maintenance.auto=false`; bản async trả `ChildProcess` cho caller cần `onSpawn` (account lock, P09).
  - `LockScope`: object truyền tường minh; kiểm hạng trong scope (chỉ acquire hạng lớn hơn mọi hạng đang giữ, cùng hạng bị cấm). **Lịch trace → cảnh báo → ném (r4 §6.5, kongming M5):** ở release 4.2 vi phạm chỉ **cảnh báo** (stderr một lần mỗi call site) và ghi một dòng JSON vào `<lockRoot>/trace/lock-order.jsonl` (`{ts, scopeId, held:[name,rank], acquiring, callSite}`); hằng `LOCK_ORDER_ENFORCE = 'warn'` trong mã, phase 13 đổi thành `'throw'`. Không có env tắt/bật (không nhánh test).
  - `familyActive(family, params)`: đọc marker (P00 đường dẫn). Đây là chỗ duy nhất code R-dual hỏi "dùng v3 chưa".
  - `LOCK_PROTOCOL = 3` trong `src/holder-lock/protocol.mjs` (P04 và P05 đọc).
- `adapters.mjs` `workerBaseEnv` ([`:99-109`](../../src/runner/dispatch/adapters.mjs)): bỏ `FGOS_LOCK_FD` (và `FGOS_MAIN_LOCK_HOLDER_PID` theo r4 §6.4 điểm 5); ghim `FGOS_STATE_ROOT` = state root của process cha (r4 §6.9).

## File sở hữu

| Hành động | File |
|---|---|
| tạo | `src/holder-lock/{index.mjs,registry.mjs,state-root.mjs,driver.mjs,protocol.mjs,lock-scope.mjs}` |
| sửa | `src/runner/dispatch/adapters.mjs` (chỉ `workerBaseEnv`) |
| tạo | `test/holder-lock/{facade-multiprocess.test.mjs,lock-scope-order.test.mjs,run-borrowed-git.test.mjs,state-root.test.mjs,driver-unavailable.test.mjs}` |
| sửa | test hiện có của `workerBaseEnv` (grep `workerBaseEnv` trong `test/`) |

## Test

1. Đa process Node thật: giữ sau helper thoát; hai `acquireSync` cùng process (hai scope) loại trừ; holder Node bị SIGKILL → trống; `acquireSync` timeout → `timeout`, fd đã đóng, không giữ.
2. `runBorrowed` với git thật trong repo tạm, `gc.auto=1` + object rời, hook tạo process nền: lock trống ngay khi git và owner đóng; process anh em cùng env tự mở file → `--borrowed-check` từ chối.
3. Rò: sau `runBorrowed`, con cháu không có inode lock; process Node con spawn thường (không qua `runBorrowed`) không có inode.
4. `LockScope`: thứ tự sai → cảnh báo + dòng trace, **không** ném; cùng hạng → cảnh báo.
5. State root: vector P00 qua Node (env có/không, gọi route khi vắng).
6. Nhánh `unavailable`: (a) không tìm được binary → `lock-driver-unavailable` có tên, không đoán; (b) thư mục lock trên mount NFS/SMB thật nếu máy có → `guarantee.exclusion = none` → `unavailable`. Máy không có mount như vậy: ghi "chưa đo" trong báo cáo, không giả lập. Nhánh Windows đo ở P14.

Lệnh: `env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID -u FGOS_SESSION_ID FGOS_HOST_BIN=<build P02> node --test test/holder-lock/*.test.mjs` + test của `workerBaseEnv`.

## Tiêu chí nghiệm thu

- Facade không lộ fd ra caller (grep export: không hàm nào trả số fd).
- Mọi test trên xanh với binary thật; không mock route.

## Rủi ro / rollback

- `spawnSync` + `--wait-ms` chặn event loop: chỉ dùng ở caller đã đồng bộ hôm nay (gateway, sessions, runner start). Runner loop dùng `acquire` async.
- Rollback: revert; chưa caller production nào gọi facade tới P06–P10.
