# Phase 10: call site reaper sang cửa adopt, marker home bản 2

Wave 1. Nhánh `run-supervisor/p10-reaper-to-adopt`, worktree `.claude/worktrees/rs-p10`. Phụ thuộc: P00; nghiệm thu cần P06 (route adopt). Chủ `confinement/cleanup.mjs`.

## Đọc trước

r6 §9.8; plan.md D8; S2 [báo cáo](../reports/spike-s2-261015-1818-reaper-fence-acceptance-tests.md) và [`dispatch-confinement-reaper-fence.test.mjs`](../../test/runner/dispatch-confinement-reaper-fence.test.mjs); call site: [`run.mjs:315`](../../src/runner/execution/run.mjs), [`loop.mjs:1443`](../../src/runner/loop.mjs), [`dispatch/cli.mjs:1231`](../../src/runner/dispatch/cli.mjs), [`registrations.mjs:5450`](../../src/setup/registrations.mjs) (cái thứ tư do P11 sửa).

## Yêu cầu

1. `cleanup.mjs`: thêm `writeOwnershipMarkerV2(dir, {attemptId, runDir, resource})` (contract P00). Reaper (`reapOrphanedConfinementResources`) **bỏ qua** marker bản 2 (không bao giờ xoá); chỉ còn xử lý marker bản 1 có `paneId` (herdr). Marker bản 1 không có `paneId` (cli cũ): sau landing không còn (runbook D8); gặp → giữ + báo doctor (không còn luật pid controller).
2. Một hàm vào duy nhất `sweepAttempts({assignmentsRoot, tempRoot})` trong `src/run-supervisor/sweep.mjs`: gọi `adoptScan` (P06) rồi `reapOrphanedConfinementResources` cho phần herdr bản 1. Ba call site (`run.mjs:315`, `loop.mjs:1443`, `cli.mjs:1231`) gọi `sweepAttempts`; tham số `checkPaneOpen: paneOpenUnlessClosed(closedPanes)` ở `cli.mjs:1233` giữ (herdr, 6.3 xoá).
3. Home bản 2 không có attempt nào sống (adopt `closed` mà home còn vì `credential-home-kept`) chỉ do adopt thử lại bước `finalize-home`; reaper không đụng.

## File sở hữu

| Hành động | File |
|---|---|
| sửa | `src/runner/dispatch/confinement/cleanup.mjs`, `src/runner/execution/run.mjs` (chỉ dòng 30 import và 315), `src/runner/loop.mjs` (import `:104` và `:1443`), `src/runner/dispatch/cli.mjs` (import `:38` và khối `:1229-1236`) |
| tạo | `src/run-supervisor/sweep.mjs`, `test/run-supervisor/sweep.test.mjs` |
| sửa | `test/runner/dispatch-confinement-reaper-fence.test.mjs` (thêm ca marker bản 2; ca cli bản 1 không pane đổi kỳ vọng thành "giữ") |

## Test

1. Lịch `r3-reaper-migration` (Astra): marker bản 2 + lock attempt đang giữ + worker sống → reaper chạy 50 lần xen kẽ → home còn.
2. Marker bản 2, lock trống, miền rỗng, có receipt → `sweepAttempts` gọi adopt → `finalize-home` dọn home; reaper không xoá trước.
3. Marker bản 1 có `paneId` → luật herdr hôm nay giữ nguyên (ca S2 herdr xanh như trước).
4. Ba call site gọi `sweepAttempts` (test production-call-sites: grep `reapOrphanedConfinementResources(` chỉ còn trong `sweep.mjs` và `registrations.mjs` tới P11).

Lệnh: `FGOS_HOST_BIN=<build> node --test test/run-supervisor/sweep.test.mjs test/runner/dispatch-confinement-reaper-fence.test.mjs test/runner/dispatch-production-call-sites.test.mjs`.

## Tiêu chí nghiệm thu / rollback

Bốn ca xanh; S2 phần herdr không đổi. Rollback: revert cùng P09 (writer và destructor chuyển cùng landing).
