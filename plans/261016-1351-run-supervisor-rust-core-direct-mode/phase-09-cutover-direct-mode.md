# Phase 09: cutover cách `direct` sang supervisor Rust

Wave 2. Nhánh `run-supervisor/p09-cutover-direct`, worktree `.claude/worktrees/rs-p09`. Phụ thuộc: P01–P08, P10 đã vào nhánh tích hợp; **4.3 đã land**. Chủ duy nhất của `assignment-runner.mjs`, `transport.mjs`, `detached-run-supervisor.mjs` trong plan này. Blast radius HIGH: chạy `impact` trên `executeAssignment`, `cliSpawnAdapter`, `startDetachedRunSupervisorProcess`, `bindingForPrepared` và báo trước khi sửa.

> **Amendment 2026-10-18:** 4.3-S đã land. Spawn supervisor (và mọi child_process) **không** được chạy trong `withStateTx`: guard `exec-under-hot-lock` (`src/state/hot-lock.mjs`) ném ngay. Resolve `FGOS_HOST_BIN`, `payloadRoot`, dựng envelope trước mọi tx; ghi state sau khi spawn xong. Tiền đề "4.3 landed" đã thoả. Windows không còn bị chặn bởi `lock-driver-unavailable` (4.4b).

## Đọc trước

r6 §9.4 (năm bước), §9.6 ("controller không tự settle"), §9.9, §11 entry 6.2 (Xoá, Bằng chứng); [T8 §6](../reports/spike-t8-261015-1841-controller-crash-during-herdr-and-cli-runs.md); [`assignment-runner.mjs:2127`](../../src/runner/dispatch/assignment-runner.mjs) (`useSupervisorRecovery`), [`:2155-2180`](../../src/runner/dispatch/assignment-runner.mjs) (lease cwd hôm nay), [`:2511`](../../src/runner/dispatch/assignment-runner.mjs) (envelope), [`:2534`](../../src/runner/dispatch/assignment-runner.mjs) (`bindConfinedHomesToSupervisor`), [`:2742`](../../src/runner/dispatch/assignment-runner.mjs) (`settleRunOutcome` của controller), [`:2783-2790`](../../src/runner/dispatch/assignment-runner.mjs) (`finally`); [`transport.mjs:370-420`](../../src/runner/dispatch/transport.mjs), [`:540-553`](../../src/runner/dispatch/transport.mjs).

## Yêu cầu

1. **Thứ tự 9.4** trong `executeAssignment` cho adapter `cli-spawn`: mint attempt id (= `launchCommandId` hiện có) → tạo run dir → `LockScope`: acquire `attempt` (15) rồi, chỉ khi `effectiveMutation === 'mutating'` và không `forceSharedCwd`, `dispatch-cwd` (30) → **sau đó** prepare (bind, `confinement.prepare` với `attemptId`) → ghi envelope v3 + side file → spawn `$FGOS_HOST_BIN internal supervise --envelope <p> --protocol 1` với `stdio: [ignore, file, file, fdAttempt, fdCwd?]`, `detached: true` (setsid), **không** `ipc`.
2. Chờ `supervisor-binding.json` (hạn = thời hạn binding hiện có, hoặc 30 s): thấy → đóng fd 3/4 ngay; không thấy → kết quả `launch-unknown` (không `not-started`, không mở attempt mới). Đóng fd trong `finally` của **mọi** đường.
3. Sau binding: controller chỉ đọc tiến độ (đuôi capture cho `onChunk`/live output bằng đọc file, không IPC) và chờ `result.json` do bước `settle-attempt` ghi; trả `runResult` đọc từ đó. **Không** gọi `settleRunOutcome` cho đường supervised; không gọi `finalizeConfinementResources` ở `finally`.
4. Envelope `steps`: `settle-attempt`, `finalize-home` (route `attempt-step`, `payloadRoot` = gốc payload Node của release đang chạy, `hostBin` = `FGOS_HOST_BIN` đã resolve một lần).
5. Mọi đường chạy agent của unit qua `cli-spawn` đi qua supervisor. Nhánh `cliSpawnAdapter` không envelope ([`transport.mjs:540-553`](../../src/runner/dispatch/transport.mjs)): executor liệt kê mọi caller (`rg -n "cliSpawnAdapter|EXECUTOR_ADAPTERS\[" src`, ghi báo cáo); caller chạy agent của unit → chuyển sang envelope; lời gọi ngắn sống cùng caller (vd. probe) → giữ và ghi lý do (r6 §9.9). [UNVERIFIED: danh sách caller nhánh không envelope chưa liệt kê đủ ở lúc viết plan.]
6. **Xoá:** trong `detached-run-supervisor.mjs`: `runDetachedRunSupervisor` (`:307`), `startDetachedRunSupervisorProcess` (`:862`), `deliverLiveChunk`/IPC (`:419-427`), entry `:1220-1234`, `getProcessPgid`/`isProcessAlive` nếu không còn ai dùng; hàm đọc artifact (`readDetachedRun*`, `publishDetachedRun*`) và `reconcileCliSpawnRun` (`:984`) chuyển sang đọc hợp đồng mới hoặc xoá theo caller (`reconcile-cli-spawn.mjs`, `settlement.mjs`, `herdr-reconcile.mjs`, `reconciliation-planner.mjs`: liệt kê, sửa). File còn lại nếu rỗng thì xoá. `bindConfinedHomesToSupervisor` (`transport.mjs:370`), `opts.legacySpawn` và `useSupervisorRecovery` (`assignment-runner.mjs:2127`, `:2137`, `:2673`), test dùng `legacySpawn` ([`dispatch-stray-write-attribution.test.mjs:263`](../../test/runner/dispatch-stray-write-attribution.test.mjs)) chuyển sang đường supervisor; `bindingForPrepared` khỏi đường cli (`assignment-runner.mjs:97`, `:2534`; định nghĩa `authority.mjs:1772` giữ cho herdr tới 6.3).
7. Kênh lease cwd cũ (heartbeat `cwdLockHeartbeat`, `cwdLockRes.release()` ở `finally`) xoá cho đường supervised: lease thuộc supervisor sau binding.
8. herdr-spawn không đổi trong phase này (6.3).

## Bằng chứng (viết đỏ trước, xanh sau; process thật, bwrap thật)

File `test/run-supervisor/direct-crash-matrix.test.mjs`, fixture executor = `noisy-agent.mjs` (P03) qua `fgos run` thật trên repo tạm:
1. Controller SIGKILL sau binding → agent xong; `result.json`, `exit.json`, `evidence.json`, receipt, hai receipt bước; home dọn; lock attempt trống (T8 cB/cC đảo kết quả).
2. Controller SIGTERM → như trên (SIGINT/SIGTERM gửi `cancel` là 6.4; ở 6.2 controller không bắt signal nên kết quả như SIGKILL).
3. Supervisor SIGKILL giữa chừng → agent chạy xong; `fgos run` kế tiếp (adopt qua `sweepAttempts`) settle từ `gate-exit` + outbox; agent chạy đúng một lần.
4. Deadline 2 s, controller đã chết → receipt `timeout`, cháu chết.
5. Controller + supervisor chết, trần cứng 3 s → gate giết agent, adopt settle `timeout`.
6. Hai `fgos run` đầu lượt cùng lúc trên một run cần adopt → một adopt, một thấy `being-adopted`.
7. Controller chết ở bốn cạnh 9.4 (giết khi file tương ứng xuất hiện, không thêm nhánh test trong code): trước lock (không gì xảy ra), sau lock trước prepare (adopt `abandoned-not-started`, không home), sau prepare (adopt `abandoned-not-started`, home dọn), sau spawn trước binding (`launch-unknown`; supervisor vẫn chạy và settle).
8. Rò description: fd lock không có ở agent/cháu/bước.
9. Attempt chỉ đọc song song 3 ghế trên cùng cwd không lấy lease; attempt ghi lấy lease, nhả ngay khi gate thoát.

## File sở hữu

| Hành động | File |
|---|---|
| sửa | `src/runner/dispatch/assignment-runner.mjs`, `transport.mjs`, `detached-run-supervisor.mjs` (xoá phần chạy hoặc cả file), `reconcile-cli-spawn.mjs`, `settlement.mjs` (import), `herdr-reconcile.mjs` (chỉ import), `reconciliation-planner.mjs` (chỉ import), `confinement/authority.mjs` (bỏ caller cli của `bindingForPrepared` nếu cần) |
| tạo | `test/run-supervisor/direct-crash-matrix.test.mjs`, `test/run-supervisor/direct-cutover.test.mjs` |
| sửa | `test/runner/assignment-dispatch.test.mjs`, `cli-spawn-reconciliation.test.mjs`, `dispatch-reconciliation-import-graph.test.mjs`, `dispatch-stray-write-attribution.test.mjs`, `test/runner/execution/run-*.test.mjs` chạm cli-spawn |

## Lệnh

`cargo build -p fgos`; `env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID -u FGOS_SESSION_ID FGOS_HOST_BIN="$CARGO_TARGET_DIR/debug/fgos" node --test test/run-supervisor/*.test.mjs test/runner/assignment-*.test.mjs test/runner/cli-spawn-*.test.mjs test/runner/dispatch-*.test.mjs`; rồi full `npm test`.

## Tiêu chí nghiệm thu / rollback

Chín ca xanh; tiêu chí 5 của plan.md; full suite xanh. Rollback: revert P09 + P10 cùng nhau (writer và destructor).
