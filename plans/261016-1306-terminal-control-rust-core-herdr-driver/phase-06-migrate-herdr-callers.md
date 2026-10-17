# Phase 06: chuyển mọi caller herdr của Node sang terminal-control

Wave 3. Nhánh `terminal-control/p06-callers`, worktree `.claude/worktrees/tc-p06`. Phụ thuộc: P05. Chủ duy nhất của `src/runner/dispatch/*` trong plan này. Phase lớn nhất, rủi ro cao (blast radius HIGH): chạy `impact` trên `driveRound`, `createHerdrClient`, `reconcileHerdrSpawnRun` và báo trước khi sửa.

## Đọc trước

- r6 §7.4, §7.7, §7.10; plan.md D2; bảng ánh xạ của P01 câu 5.
- Caller (grep `createHerdrClient\|herdr-agent.mjs\|'pane', 'list'\|'pane', 'close'`): [`herdr-round.mjs`](../../src/runner/dispatch/herdr-round.mjs) (import `:36`; `batchTabFor` `:1656-1670`; split `:1765-1803`; `paneRun` `:1964`; `paneClose` `:328`, `:1382`, `:1430`, `:1871`, `:1902`, `:1953`; `paneProcessInfo` 6 chỗ; agent ops ~20 chỗ; `verifyForegroundProcessArgv` `:128`); [`herdr-reconcile.mjs:213-222`](../../src/runner/dispatch/herdr-reconcile.mjs); [`worker-session-boot.mjs:24`, `:38`, `:112`](../../src/runner/dispatch/worker-session-boot.mjs); [`dispatch/cli.mjs:1219-1225`](../../src/runner/dispatch/cli.mjs) (account probe `closePane`); [`confinement/cleanup.mjs:410`, `:428`](../../src/runner/dispatch/confinement/cleanup.mjs) (reaper `pane list`/`pane close` thô); [`transport.mjs:847`](../../src/runner/dispatch/transport.mjs) (`FGOS_HERDR_ANCHOR_PANE`).

## Yêu cầu

1. **Key và nhóm:** key = `ctx.launchCommandId` (assignment) hoặc id round ad-hoc hiện có (giữ quy tắc đặt tên round test 16 của `herdr-reconciliation.test.mjs`); `groupKey` = `dispatchBatchKey` nếu có (coordination), không thì unit run id / workflow run id (hội đồng §2.3). Display `{label: groupKey ngắn, role, agent, model}` là dữ liệu.
2. **Vòng đời pane** trong `driveRound`: `allocate` thay `batchTabFor`/`paneSplit`; neo `FGOS_HERDR_ANCHOR_PANE` → `attach(key-của-neo, pane)` một lần để nhóm có pane sống (không bao giờ bị đóng). `launch` thay `paneRun` + `verifyForegroundProcessArgv` (identity trả về); `release(close|retain)` thay mọi `paneClose` và `paneFateFor` (retain dùng `terminal.retainFailedPaneMs`, D5). `killPaneForegroundAndClose` → `inspect` + signal theo identity (`fgos-process`) + `release(close)`.
3. **IO agent:** ánh xạ theo bảng P01 (dự kiến: `agentStart` → `launch.activity`; `agentPrompt` → `send{text, submit}`; `agentSendKeys` → `send{keys}`; `agentRead` → `read`; `agentGet`/`agentExplain`/`agentWait` → `inspect().activity` (chờ do caller lặp); `reportAgent*` → `label`). Logic chờ/regex (`awaitPromptReady`, `deliverBrief`, `confirmBriefSubmitted`) giữ ở `herdr-round.mjs` tới 6.3 (agent-protocol); chỉ đường IO đổi.
4. `herdr-reconcile.mjs`: tìm pane theo key qua `inspect`, không theo nhãn/argv dò.
5. `worker-session-boot.mjs`: probe server bằng `capabilities`/`inspect`.
6. Account probe (`cli.mjs:1220`): `closePane({paneId})` → `release(key, close)`; kết quả probe mang key.
7. Reaper (`cleanup.mjs:410`, `:428`): marker home ghi thêm `terminalKey` (khi bind); reaper hỏi `inspect(key)` thay `pane list`, đóng bằng `release(key, close)`. Marker cũ chỉ có `paneId` → coi pane `unknown` = giữ (không đóng mù). Nếu 6.2 đã land và xoá phần này thì bỏ bước 7.
8. **Xoá:** `createHerdrClient`, `createBatchTab`, `closeIfEmpty`, `batchTabFor`, `batchTabsByKey`, hook `process.once('exit')`, nhãn `fgos-lead-<key>-<ts>`; `herdr-agent.mjs` chỉ còn hằng/hàm thuần (`READY_STATES`, `isReadyState`, `normalizeAgentName`) hoặc gộp vào nơi dùng rồi xoá file.
9. Test hiện có tiêm `run` vào `createHerdrClient` (`test/runner/herdr-agent.test.mjs`, `herdr-reconciliation.test.mjs`, `execution/run-herdr.test.mjs`, `test/verbs/dispatch-observe.test.mjs`) chuyển sang fake herdr binary (`fake-herdr-pane.mjs`) qua `FGOS_HERDR_BIN`; ca chỉ kiểm argv của client cũ chuyển sang `herdr_driver_fake.rs` (P03) hoặc xoá nếu trùng.

## File sở hữu

| Hành động | File |
|---|---|
| sửa | `src/runner/dispatch/herdr-round.mjs`, `herdr-agent.mjs` (xoá/thu nhỏ), `herdr-reconcile.mjs`, `worker-session-boot.mjs`, `cli.mjs` (khối `:1195-1235`), `confinement/cleanup.mjs` (khối `:400-435` + bind marker `:150-180`), `transport.mjs` (`:840-850`) |
| sửa | `test/runner/herdr-*.test.mjs`, `test/runner/execution/run-herdr.test.mjs`, `test/runner/dispatch-worker-session-boot.test.mjs`, `test/runner/dispatch-confinement-reaper-fence.test.mjs` (phần herdr), `test/runner/dispatch-production-call-sites.test.mjs`, `test/verbs/dispatch-observe.test.mjs`, `test/helpers/fake-herdr-pane.mjs` (thêm lệnh `pane layout` nếu thiếu) |
| tạo | `test/runner/herdr-round-terminal-control.test.mjs` |

## Test

1. Round herdr (fake) end-to-end: allocate → launch → brief → kết quả → release; log fake herdr không có `tab close`, không pane rỗng.
2. Ba seat cùng `dispatchBatchKey` → cùng tab; seat thứ hai tách từ pane sống của seat một; seat một đã đóng → seat ba vẫn tách từ pane sống còn lại hoặc mở tab mới cùng nhãn.
3. Round thất bại → pane `retain`, không đóng; `fgos dispatch probe-account` đóng đúng pane theo key.
4. Reaper: home marker mới với pane sống → giữ; pane `gone` → dọn; marker cũ chỉ `paneId` → giữ.
5. Controller SIGKILL sau `allocate`, trước `launch` → không ai đóng pane chỉ vì quá hạn; `reconcile-scan` báo.
6. Toàn bộ test herdr hiện có xanh trên fake herdr.

Lệnh: `env -u ... FGOS_HOST_BIN=<build> node --test test/runner/herdr-*.test.mjs test/runner/execution/run-herdr.test.mjs test/runner/dispatch-*.test.mjs test/verbs/dispatch-observe.test.mjs`; rồi full `npm test`.

## Tiêu chí nghiệm thu / rollback

Tiêu chí 5 của plan.md; sáu test xanh. Rollback: revert cùng P05/P07 (route còn nhưng không ai gọi là vô hại; revert P06 trả lại client cũ).
