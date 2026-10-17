# Phase 06: cutover `herdr-spawn` sang supervisor cách `terminal`

Wave 2. Nhánh `terminal-mode/p06-cutover-herdr`, worktree `.claude/worktrees/tm-p06`. Phụ thuộc: P01–P05 đã vào nhánh tích hợp. Chủ `herdr-round.mjs`, `transport.mjs`, `herdr-reconcile.mjs`, `recovery-planner.mjs`, `assignment-runner.mjs`. Blast radius HIGH: `impact` trên `runHerdrRound`, `driveRound`, `herdrSpawnAdapter`, `herdrSpawnInteractiveAdapter`, `reconcileHerdrSpawnRun` trước khi sửa.

## Đọc trước

r6 §9.4 (cùng thứ tự cho `terminal`), §11 entry 6.3 (Xoá); T8 §4.3, §6; 6.2 P09 (đường `direct` đã cutover — tái dùng đúng hàm chuẩn bị/giao); 6.5 P06 (key, `groupKey`).

## Yêu cầu

1. `herdrSpawnAdapter`/`herdrSpawnInteractiveAdapter` ([`transport.mjs:820`, `:957`](../../src/runner/dispatch/transport.mjs)) đi qua **cùng** hàm chuẩn bị + giao của 6.2 (`executeAssignment` đường supervised), thêm: `client.allocate(key = attemptId, groupKey)` sau prepare; envelope `mode: terminal`, `slot`, `terminal.socketPath`, bước `release-slot` built-in; `identity` (P05). Key đổi từ `launchCommandId` sang attempt id (6.5 nói "6.3 đổi key mà không đổi cổng"; nếu attempt id = `launchCommandId` thì không đổi gì).
2. `runHerdrRound` thu về phần chuẩn bị còn riêng cho herdr (trust store `seedWorkspaceTrust` `:683`, `establishConfinement` `:589`, `prepareRunDir` `:547` nếu không trùng 6.2) rồi giao; **xoá** `pollForOutcome` (`:1186`), `settleRound` (`:1404`), `concludeFailure` (`:1360`), `killPaneForegroundAndClose` (`:319`), `cleanupIfWorkerStillLive` (`:344`), `cleanupAndKeepScreen` (`:352`, nếu chỉ phục vụ vòng cũ), `livenessProbe` (`:1158`), `startAgent` (`:798`), `submitBrief`/`deliverBrief`/`awaitPromptReady`/`confirmBriefSubmitted`/`isDraftStillInComposer`/`ensureHerdrKnowsAgent`/`refuseBriefIntoUnreadyPane`/`readAgentState` và hai regex (logic đã ở P04), `groupDeadlines` (`:476`) nếu deadline chỉ còn trong envelope, phần lớn `driveRound` (`:1674`), call `binding.bind` (`:1900`). `removeWorkspaceTrust` (`:767`) thành bước sau receipt? **Có**: thêm bước `cleanup-trust` (Node, `attempt-step`) vào envelope để dọn trust khi controller chết.
3. `herdr-reconcile.mjs`: đường reconcile round herdr thay bằng adopt (6.2 client); xoá phần đoán liveness pane còn lại. `recovery-planner.mjs`: không còn đường herdr dẫn tới park vì `result-1.json` (outbox là bằng chứng có tên trong adopt); `recover` đầy đủ qua adopt là 6.4.
4. `transport.mjs:553`: bỏ `FGOS_SESSION_ID: resolveWriterIdentity(...)` (P05 báo dòng).
5. Live output cho người xem: controller (nếu còn sống) đọc màn hình qua `client.read(key)` chỉ để hiển thị, không quyết định gì.

## Bằng chứng (đỏ trước, xanh sau)

`test/run-supervisor/terminal-crash-matrix.test.mjs` trên fake herdr: controller SIGKILL sau binding → supervisor giao brief, `completed`, settle đủ, `release(close)`; deadline sau khi controller chết → `timeout`, pane `retain`; supervisor SIGKILL sau `BRIEF_DELIVERED` → adopt sau khi gate thoát; ba seat cùng `groupKey`, seat một `release(close)` trùng lúc seat bốn `allocate` (D3) → không lỗi lọt, seat bốn ở tab mới cùng nhãn hoặc tách từ pane sống.

## File sở hữu

| Hành động | File |
|---|---|
| sửa | `src/runner/dispatch/herdr-round.mjs`, `transport.mjs`, `herdr-reconcile.mjs`, `recovery-planner.mjs`, `assignment-runner.mjs` |
| tạo | `src/run-supervisor/steps/cleanup-trust.mjs`, `test/run-supervisor/terminal-crash-matrix.test.mjs`, `test/run-supervisor/terminal-cutover.test.mjs` |
| sửa | `test/runner/herdr-*.test.mjs`, `test/runner/execution/run-herdr.test.mjs`, `test/runner/herdr-round-reconcile.test.mjs`, `test/runner/dispatch-recovery*.test.mjs` (phần herdr) |

## Lệnh

`cargo build -p fgos`; `env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID -u FGOS_SESSION_ID FGOS_HOST_BIN=<build> node --test test/run-supervisor/*.test.mjs test/runner/herdr-*.test.mjs test/runner/execution/run-herdr.test.mjs`; full `npm test`.

## Tiêu chí nghiệm thu / rollback

Bằng chứng xanh; `rg` tiêu chí 6 phần herdr-round rỗng; full suite xanh. Rollback: revert P06 + P07 cùng nhau.
