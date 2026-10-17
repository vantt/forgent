# Phase 08: driver `bwrap.mjs` cho PID namespace mọi attempt

Wave 1. Nhánh `run-supervisor/p08-bwrap`, worktree `.claude/worktrees/rs-p08`. Phụ thuộc: P00.

## Đọc trước

r6 §9.3 điểm 3 (dòng về `bwrap.mjs`), §5.1 (`FGOS_PIDNS_ANCHOR`); kongming M1, M2, N5; [`bwrap.mjs:464`](../../src/runner/dispatch/confinement/drivers/bwrap.mjs) (`--proc /proc`), [`:511`](../../src/runner/dispatch/confinement/drivers/bwrap.mjs) (`--unshare-pid` chỉ mode blind), [`:572-575`](../../src/runner/dispatch/confinement/drivers/bwrap.mjs) (bind/launched marker của bản vá reaper, giữ tới 6.3 vì phục vụ herdr).

## Yêu cầu

1. Plan bwrap cho launch (mọi mode): `--unshare-pid --as-pid-1 --proc /proc`; `--die-with-parent` **chỉ** khi `launchMode === 'terminal'` (6.3 truyền); ở `direct` không bao giờ có.
2. `--bind <runtimeSocketDir> <runtimeSocketDir>` khi `launchMode === 'terminal'` (N5). `runtimeSocketDir` = `$XDG_RUNTIME_DIR/fgos` hoặc `/tmp/fgos-<uid>` (0700, chủ là user), hàm `resolveRuntimeSocketDir()` mới trong `src/run-supervisor/runtime-dir.mjs` (setup P11 tạo thư mục, doctor kiểm).
3. Driver **không** đặt lệnh worker cuối argv nữa khi được gọi cho supervisor: trả `bwrapPrefix` (argv tới trước `--`) để envelope ghi, gate là lệnh. Attestation (`attestationPlanDigest`) tính trên prefix + lệnh gate + argv agent (để digest vẫn phủ cái thật sự chạy).
4. Marker home: ghi bản 2 (`home-marker.v2.json`) với `attemptId` khi request có `attemptId`; request không có (herdr tới 6.3) giữ bản 1. Hàm ghi marker nằm ở `cleanup.mjs` (P10): P08 gọi `writeOwnershipMarkerV2` theo chữ ký ở contract P00.
5. `FGOS_PIDNS_ANCHOR` không đặt ở đây (gate đặt, P03).

## File sở hữu

| Hành động | File |
|---|---|
| sửa | `src/runner/dispatch/confinement/drivers/bwrap.mjs` |
| tạo | `src/run-supervisor/runtime-dir.mjs`, `test/run-supervisor/runtime-dir.test.mjs` |
| sửa | `test/runner/dispatch-confinement-backend-p03.test.mjs`, `test/runner/dispatch-confinement-blind.test.mjs` (kỳ vọng argv mới) |

## Test

1. Argv `direct`: có `--unshare-pid --as-pid-1 --proc /proc`, không `--die-with-parent`; `terminal`: có `--die-with-parent` và `--bind` thư mục socket.
2. Digest attestation đổi khi lệnh gate đổi.
3. Chạy thật: prefix + `sh -c 'cat /proc/self/stat'` → pid 1 trong namespace (cần bwrap trên máy; không có → bỏ qua có tên).
4. `resolveRuntimeSocketDir`: quyền 0700, chủ là uid; đường dẫn + tên băm attempt ≤ 100 byte.

Lệnh: `node --test test/run-supervisor/runtime-dir.test.mjs test/runner/dispatch-confinement-*.test.mjs`.

## Tiêu chí nghiệm thu / rollback

Bốn ca xanh; test confinement hiện có xanh. Rollback: revert.
