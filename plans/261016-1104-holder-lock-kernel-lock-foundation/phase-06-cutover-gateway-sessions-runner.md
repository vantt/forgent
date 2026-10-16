# Phase 06: cutover gateway, sessions, runner (họ `repo-files`)

Wave 3. Nhánh `holder-lock/p06-gateway-sessions-runner`, worktree `.claude/worktrees/hl-p06`. Phụ thuộc: P03, P04. Song song với P07–P10.

## Luật chung của mọi phase cutover (P06–P10)

- **Một lock một commit.** Mỗi commit: đường v3 qua facade + chọn bằng `familyActive(family)` (R-dual, r4 §6.8 bước 3); đường v1 giữ **nguyên văn** cho tới phase 13; đường v1 gặp tombstone/thế hệ chặn khi marker chưa có → lỗi có tên `lock-cutover-pending`.
- Ngữ nghĩa giữ nguyên với caller: cùng tên hàm export, cùng kiểu lỗi/mã thoát, cùng thời gian chờ mặc định. Không đổi chữ ký trừ khi ghi trong phase.
- Test hiện có của lock chạy ở **cả hai chế độ** (marker vắng/có) bằng cách tham số hoá file test, không nhân bản. Thêm: tombstone đặt bởi engine → v1 thật thất bại (đã có ở P04 cho cả họ; ở đây chỉ kiểm hành vi caller).
- Bản chép `isPidAlive` chỉ dùng cho lock: **không xoá ở đây** (đường v1 còn dùng); ghi danh sách để phase 13 xoá. Bản chép còn dùng ngoài lock: thay bằng `pidExists` của P01 ngay trong commit này nếu không đụng đường v1.
- Không sửa registry, `registrations.mjs`, `CHANGELOG.md`, `bin/fgos.mjs`. Dòng CHANGELOG ghi trong phase file, P11 đưa vào.

## Yêu cầu

| Lock | Chỗ đổi | Kind / chờ | Ghi chú |
|---|---|---|---|
| gateway | `acquireGatewayLock` ([`gateway-control.mjs:154`](../../src/runner/gateway-control.mjs)) | lease, `acquireSync` chờ 120 s như hôm nay | `isPidAlive` ở `:59` còn dùng cho tiến trình gateway (`:260,322,370,419`) → thay bằng `pidExists` |
| sessions | `acquireSessionsLock` ([`session.mjs:258`](../../src/runner/session.mjs)) | mutex, `acquireSync` 10 s | Caller đồng bộ hôm nay; không đổi sang async |
| runner | `acquireRunnerLock` ([`loop.mjs:256`](../../src/runner/loop.mjs)) | lease, `--try` hai lần như hôm nay rồi exit 6 | Giữ suốt drain; release = đóng khi process thoát (kernel), giữ `release()` tường minh |

Handle v3 mang `scope` của caller; ở 4.2 mỗi điểm vào tạo scope riêng (`new LockScope('gateway')`...). Hạng theo registry.

## File sở hữu

| Hành động | File |
|---|---|
| sửa | `src/runner/gateway-control.mjs`, `src/runner/session.mjs`, `src/runner/loop.mjs` (chỉ khối runner lock `:136-320`) |
| sửa | `test/runner/gateway-control.test.mjs`, `test/runner/session.test.mjs`, `test/runner/lock.test.mjs`, `test/runner/lock-wait.test.mjs` |

## Test

- Hai chế độ cho cả ba file test trên; `test/e2e/runner-loop.test.mjs` chạy không đổi (chế độ v1, marker vắng) và một lần với marker có.
- Đa process v3: hai `fgos gateway start` đồng thời → một build-spawn; holder SIGKILL giữa chừng → người sau vào ngay (không chờ TTL). Runner: process thứ hai exit 6; holder SIGKILL → khởi động lại được ngay.
- Lệnh: `env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID -u FGOS_SESSION_ID FGOS_HOST_BIN=<build tích hợp> node --test test/runner/gateway-control.test.mjs test/runner/session.test.mjs test/runner/lock.test.mjs test/runner/lock-wait.test.mjs test/e2e/runner-loop.test.mjs`.

## Dòng CHANGELOG (P11 đưa vào)

- Changed: gateway, sessions và runner lock dùng kernel lock sau khi `fgos lock cutover repo-files` bật; holder chết nhả ngay, không còn chờ hay dọn file. Release cũ gặp thư mục `TOMBSTONE` ở `.fgos/{gateway,sessions,runner}.lock` sẽ báo `EISDIR`.

## Tiêu chí nghiệm thu / rollback

Test hai chế độ xanh; đa process v3 xanh. Rollback: revert từng commit (đường v1 còn nguyên); nếu họ đã bật, `fgos lock cutover repo-files --revert` trước.
