# Phase 07: xoá phần reaper herdr của bản vá tạm, viết lại S2

Wave 2. Nhánh `terminal-mode/p07-reaper-herdr`, worktree `.claude/worktrees/tm-p07`. Phụ thuộc: P00; nghiệm thu sau P06 (writer marker bản 1 có `paneId` không còn). Chủ `cleanup.mjs`, `bwrap.mjs`, `worker-session.mjs`, `authority.mjs`, `dispatch/cli.mjs`.

## Đọc trước

r6 §9.8 (danh sách xoá); S2 [báo cáo](../reports/spike-s2-261015-1818-reaper-fence-acceptance-tests.md); [`dispatch-confinement-reaper-fence.test.mjs`](../../test/runner/dispatch-confinement-reaper-fence.test.mjs); 6.2 P10 (`sweepAttempts`).

## Yêu cầu

1. Herdr ghi marker bản 2 (`attemptId`) như cli: `bwrap.mjs` bỏ nhánh bản 1, bỏ `bindOwnershipMarker`/`markOwnershipLaunched` ở `:572-575`.
2. `cleanup.mjs`: xoá `LAUNCH_GRACE_MS`, `OWNERSHIP_BINDING_FIELDS`, `bindOwnershipMarker`, `markOwnershipLaunched` (`:138-180`), `defaultPaneOpen`, `paneOpenUnlessClosed` (`:403`, `:434`), toàn bộ `reapOrphanedConfinementResources` (`:465` trở đi) — mọi home đi qua adopt. `sweepAttempts` chỉ còn gọi adopt.
3. `dispatch/cli.mjs:1229-1236`: bỏ lượt dọn sau probe (`closedPanes`); probe account đóng pane qua `release(key)` (6.5) và home của probe đi qua adopt hoặc dọn trực tiếp nếu probe không phải attempt (executor kiểm: probe dùng home riêng? ghi kết luận).
4. `worker-session.mjs`: xoá `herdrEndpointForEnv`, `envForEndpoint` nếu `rg` không còn caller.
5. `authority.mjs`: xoá `bindingForPrepared` (`:1772`) và nhánh bỏ qua trường binding khi so digest (`:1849-1852`); bỏ `FGOS_SESSION_ID: writerId` (`:1415`, P05 báo).
6. Landing: như 6.2 D8, dọn mọi home bản 1 có `paneId` bằng release 6.2 trước khi activate (P09 runbook).

## Test

S2 viết lại theo luật "chỉ adopt dọn, chỉ khi lock attempt trống và miền rỗng": mỗi ca S2 (1)–(8) ánh xạ sang: lock giữ → không dọn; lock trống + miền rỗng + receipt → dọn qua `finalize-home`; lock trống + miền chưa rỗng → adopter kết thúc miền rồi mới dọn; hai adopter → một lần dọn. Ca chỉ có nghĩa với luật pane/binder cũ → xoá, ghi lý do trong báo cáo. Kết quả: 0 đỏ, 0 todo.

Lệnh: `FGOS_HOST_BIN=<build> node --test test/runner/dispatch-confinement-*.test.mjs test/run-supervisor/sweep.test.mjs test/runner/dispatch-production-call-sites.test.mjs`.

## File sở hữu

| Hành động | File |
|---|---|
| sửa | `src/runner/dispatch/confinement/{cleanup.mjs,authority.mjs,drivers/bwrap.mjs}`, `src/runner/dispatch/worker-session.mjs`, `src/runner/dispatch/cli.mjs`, `src/run-supervisor/sweep.mjs` |
| sửa | `test/runner/dispatch-confinement-reaper-fence.test.mjs`, `test/runner/dispatch-confinement-authority.test.mjs`, `test/run-supervisor/sweep.test.mjs` |

## Tiêu chí nghiệm thu / rollback

`rg` tiêu chí 6 phần reaper rỗng; S2 0 đỏ 0 todo. Rollback: revert cùng P06.
