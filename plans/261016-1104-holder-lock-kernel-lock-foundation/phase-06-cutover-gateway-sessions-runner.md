# Phase 06: cutover gateway, sessions, runner

Wave 2. Nhánh `holder-lock/p06-gateway-sessions-runner`, worktree `.claude/worktrees/hl-p06`. Phụ thuộc: P03. Song song với P07–P11.

## Luật chung của mọi phase cutover (P06–P10)

- **Một lock một commit, v3 thay hẳn v1** (quyết định A1). Trong cùng commit: lock đi qua facade; xoá mọi code v1 của lock đó (tạo file, đọc record, dọn holder chết, bản chép `isPidAlive`); bản chép `isPidAlive` còn dùng ngoài lock thay bằng `pidExists` của P01. Không nhánh "marker", không alias.
- Ngữ nghĩa với caller giữ nguyên: cùng tên export, cùng kiểu lỗi/mã thoát, cùng thời gian chờ mặc định. Nền không có driver → lỗi `lock-driver-unavailable` từ facade (Windows: `unsupported`).
- Test hiện có của lock viết lại cho v3 (bỏ ca chỉ có nghĩa với file pid: TTL, record hỏng, pid tái dùng); thêm ca đa process thật: holder SIGKILL → người sau vào ngay.
- Mỗi phase chạy **full `npm test`** trên nhánh của mình trước khi nộp (lộ vi phạm thứ tự lock, vì giờ ném ngay — A3) và sửa trong chính phase.
- Không sửa registry, `registrations.mjs`, `CHANGELOG.md`, `bin/fgos.mjs`. Dòng CHANGELOG ghi trong phase file, P11 đưa vào.

## Yêu cầu

| Lock | Chỗ đổi | Kind / chờ | Xoá |
|---|---|---|---|
| gateway | `acquireGatewayLock` ([`gateway-control.mjs:154`](../../src/runner/gateway-control.mjs)) | lease, `acquireSync` 120 s | `tryAcquireLockOnce` (`:97`), `LOCK_FILE` cũ (`:36`); `isPidAlive` (`:59`) thay bằng `pidExists` ở `:80,260,322,370,419` |
| sessions | `acquireSessionsLock` ([`session.mjs:258`](../../src/runner/session.mjs)) | mutex, `acquireSync` 10 s | `tryAcquireOnce` (`:199`), `isPidAlive` (`:69`) |
| runner | `acquireRunnerLock` ([`loop.mjs:256`](../../src/runner/loop.mjs)) | lease, `--try` hai lần rồi exit 6 | khối link/temp (`:256-320`), `isPidAlive` (`:210`) nếu không còn ai dùng (grep trong `loop.mjs`) |

`LOCK_FILE` của `loop.mjs` (`:136`) là export: grep importer (`test/runner/lock.test.mjs`, `lock-wait.test.mjs`, `test/e2e/runner-loop.test.mjs`) và đổi theo.

## File sở hữu

| Hành động | File |
|---|---|
| sửa | `src/runner/gateway-control.mjs`, `src/runner/session.mjs`, `src/runner/loop.mjs` (khối runner lock) |
| sửa | `test/runner/gateway-control.test.mjs`, `test/runner/session.test.mjs`, `test/runner/lock.test.mjs`, `test/runner/lock-wait.test.mjs`, `test/e2e/runner-loop.test.mjs` |

## Test

Đa process v3: hai `fgos gateway start` đồng thời → một build-spawn; holder SIGKILL → người sau vào ngay. Runner thứ hai exit 6; holder SIGKILL → khởi động lại được ngay. Sessions: 8 process ghi `sessions.json` song song, không mất bản ghi.

Lệnh hẹp: `env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID -u FGOS_SESSION_ID FGOS_HOST_BIN=<build tích hợp> node --test <các file trên>`; rồi full `npm test` cùng env.

## Dòng CHANGELOG

- Changed: gateway, sessions và runner lock là kernel lock ở `.fgos/locks/`; holder chết nhả ngay. Release cũ gặp thư mục `TOMBSTONE` ở `.fgos/{gateway,sessions,runner}.lock` và báo `EISDIR`. Trên Windows các lock này báo `unsupported` tới khi có driver.

## Rollback

Revert từng commit (code v1 trở lại); nếu đã landing thì theo runbook P12.
