# Phase 01: lõi mutex nóng `hot-lock.mjs`

Wave 1. Nhánh `main-door/p01-hot-lock`, worktree `.claude/worktrees/md-p01`. Phụ thuộc: P00. Song song với P03, P09 (docs).

## Đọc trước

- r6 §6.6 toàn bộ (fast path, dọn dưới kernel lock, bất biến 1–5, nền tảng, chi phí, rủi ro còn lại), §5.1 (bảng phán, N4), §12.4 (probe A1, stress).
- Source: [`events.mjs:40-60`](../../src/state/events.mjs) (hằng số, timeout 5 s qua `FGOS_EVENTS_LOCK_TIMEOUT_MS`), [`:280-420`](../../src/state/events.mjs) (`tryAcquireEventsLockOnce`, `acquireEventsLock`, `withEventsLock`), record chỉ `pid` (`:302`). Node leaf `judge(tuple)` của 4.2 P01 trong [`process-identity.mjs`](../../src/runner/dispatch/process-identity.mjs).
- Contract P00 `hot-lock.v1.json`.

## Yêu cầu

Mô-đun mới `src/state/hot-lock.mjs` (chủ duy nhất của hot-mutex):

1. **Fast path giữ nguyên** (r6 §6.6): temp + `link` → `<fgosDir>/locks/<resource>.hot`, release = `unlink`. Record = `{v:1, pid, startTime, bootId, pidNs}` của chính process (đọc `/proc/self/stat`, `/proc/sys/kernel/random/boot_id`, `readlink /proc/self/ns/pid` một lần mỗi process — fs-only, không exec). Nền không có `/proc`: `{v:1, pid, bootId?}` (r6 §6.6 "Nền tảng").
2. **Dọn holder chết chỉ dưới kernel lock** `<resource>.reclaim` (facade 4.2 `acquireSync`, `--try` rồi chờ ngắn): đọc lại record, `judge(tuple) == dead` (zombie là dead; thiếu pid, hỏng, `unknown` → **không** dọn; N4: người phán ngoài init pid namespace + record thiếu `pidNs` → `unknown`), so byte với lần đọc trước, giống thì `unlink`, nhả kernel lock, thử lại `link`. Record không parse được → không bao giờ dọn; lỗi `hot-lock-timeout` kèm `lock-record-unreadable` sau hạn chờ.
3. **Chờ:** giữ hạn 5 s (giữ `FGOS_EVENTS_LOCK_TIMEOUT_MS` nếu đang được đọc ở nơi khác: grep; không có ai thì bỏ biến, theo luật không thêm env).
4. **Re-entry:** facade đếm độ sâu vùng găng nóng trong process; acquire `state` khi độ sâu > 0 → ném `hot-lock-reentry` **ngay** (quyết định của anh, thay lịch r6 §6.6 điểm 2b).
5. **Gác exec:** cài **một lần** khi nạp `hot-lock.mjs`: bọc `spawn`, `spawnSync`, `exec`, `execSync`, `execFile`, `execFileSync`, `fork` của `node:child_process` (kèm `ChildProcess.prototype.spawn` theo gợi ý kongming K7), rồi `module.syncBuiltinESMExports()`. Độ sâu > 0 → ném `exec-under-hot-lock` kèm stack **ngay** (quyết định của anh, thay M5). `src/state/events.mjs` import `hot-lock.mjs` ở đầu file để mọi điểm vào (`bin/fgos.mjs`, `bin/fgos-runner.mjs`, script) có gác (r6: đặt ở mô-đun lock, không ở `bin/`).
6. **`stateTx`:** `withStateTx(fgosDir, fn, {resource = 'state', prefetched})` gọi `fn(tx)` **đồng bộ**; `tx` có `append(logPath, event)`, `writeJson(path, obj)`, `unlink(path)`, `readJson(path)` (chỉ đường dưới `fgosDir` — ném nếu ra ngoài, bất biến 4), `mainFgosDir`, `head`, `writer` (lấy từ `prefetched`, không bao giờ tự exec). Sau `fn` trả về (kể cả ném) `tx` bị thu hồi: mọi ghi sau đó → `state-tx-revoked`. `fn` trả thenable → ném `state-tx-async` (đã đóng lock trước khi ném; không dựa vào nó để chống ghi, chỉ để báo lỗi lập trình sớm).
7. **Tạm giữ tên cũ trong lúc tích hợp:** `events.mjs` vẫn export `withEventsLock(logPath, fn, fgosDir)` mỏng = `withStateTx(fgosDir, (tx) => fn(tx), {resource})` với `resource` suy từ `path.dirname(logPath)` (`.fgos` → `state`, `.fgos/porting` → `porting-events`), để callers chưa chuyển vẫn chạy cho tới P02. P02 xoá tên này; tiêu chí 4 của plan.md bắt.
8. Xoá trong `events.mjs`: `tryAcquireEventsLockOnce`, `acquireEventsLock`, `isPidAlive`/kill-0 nếu chỉ lock dùng, `EVENTS_LOCK_FILE`.

## File sở hữu

| Hành động | File |
|---|---|
| tạo | `src/state/hot-lock.mjs` |
| sửa | `src/state/events.mjs` (phần lock + import gác; `appendEventCore`/`appendEventLocked` nhận `tx` tuỳ chọn, ghi qua `tx.append` khi có) |
| tạo | `test/state/hot-lock-multiprocess.test.mjs`, `test/state/hot-lock-guard.test.mjs`, `test/state/hot-lock-tx.test.mjs` |
| sửa | `test/state/events.test.mjs` (ca lock cũ: đổi sang v3), `test/state/identity-before-lock.test.mjs` (bất biến "identity trước lock" giữ, đường lock đổi) |

## Test (process thật, không mock)

1. **Lịch A1** (r6 §12.4): `hot-lock.mjs` export các bước dọn thành hàm có tên (`readHotRecord`, `reclaimDeadHolder`) — chính là các bước `withStateTx` gọi, không phải nhánh test. Script con R1 gọi lần lượt: giữ `reclaim`, đọc record của H đã chết, rồi chờ file tín hiệu do test tạo (chờ nằm trong script test, không trong code production), rồi `unlink`. Trong lúc R1 chờ, R2 chạy `withStateTx` thật → bị chặn ở `reclaim`. Thả R1 → R1 vào; R2 vào sau khi R1 nhả. Không có lúc nào hai holder (marker file).
2. **Stress** 8 process × 60 vòng, 10 holder bị SIGKILL trong vùng găng; vùng găng ghi marker vào file và kiểm không chồng → 0 vi phạm, 0 kẹt.
3. **Zombie:** holder là con chưa reap (zombie) của test → coi là chết, dọn được. **Record hỏng** → không dọn, `hot-lock-timeout` + `lock-record-unreadable` sau 5 s.
4. **N4:** chạy người phán trong `unshare --pid --fork --mount-proc` (nếu máy cho user namespace) với record host thiếu `pidNs` → không dọn. Máy không cho → ghi "chưa đo" trong báo cáo.
5. **Re-entry:** `withStateTx` lồng → `hot-lock-reentry` trong < 50 ms (hôm nay spin 5 s).
6. **Gác:** trong `fn` gọi `execFileSync` qua import có tên (`import { execFileSync } from 'node:child_process'` ở một module test nạp **trước** `hot-lock.mjs`) → `exec-under-hot-lock`; `spawnSync`, `fork` tương tự; ngoài vùng găng không ném. Chạy lại ba chỗ cũ bằng code của main lúc bắt đầu track (`git show <base>:src/runner/claim-port.mjs` vào thư mục tạm, import với store thật trong repo tạm) → ném đúng `exec-under-hot-lock` (đỏ có chủ đích, chứng minh gác bắt được).
7. **`stateTx` thu hồi:** `fn` lưu `tx`, trả về; một `setTimeout` sau đó gọi `tx.append` → `state-tx-revoked`, file không đổi; `fn` async → `state-tx-async`, lock đã nhả.
8. **Fast path benchmark:** 2000 lần acquire/release không tranh: p50 không quá 10% so với `withEventsLock` ở commit gốc (chạy cả hai trong cùng test).

Lệnh: `env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID -u FGOS_SESSION_ID FGOS_HOST_BIN=<build 4.2> node --test test/state/hot-lock-*.test.mjs test/state/events.test.mjs test/state/identity-before-lock.test.mjs`.

## Tiêu chí nghiệm thu

Tám nhóm test xanh; `hot-lock.mjs` không import gì từ `src/runner/` ngoài leaf `process-identity.mjs` (giữ đồ thị import của state).

## Rủi ro / rollback

- Gác ném ở chỗ chưa biết khi P01 vào nhánh tích hợp: đúng mục đích; ghi vào báo cáo, phase sở hữu file đó sửa (P02/P04/P05). Nhánh tích hợp được phép đỏ ở test claim tới P04 (plan.md).
- Rollback: revert phase.
