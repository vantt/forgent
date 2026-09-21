# Phase 07 — Herdr adapter, trust store, supervisor tee

Wave 3 · Gate: none (H13/M15a đã làm ở Phase 03) · Findings: H7, M3, M15(b,c), L11. Context: review §H7/M3/M15, Phụ lục 2/6.

## Status — 2026-09-21

**R1–R7 xong trên nhánh `dispatch-hardening-phase07-herdr-trust-supervisor`** (worktree cùng tên, rẽ từ `main` HEAD lúc bắt đầu, `2b123019`). Test đích: `dispatch-trust-store.test.mjs`, `herdr-agent.test.mjs`, `cli-spawn-reconciliation.test.mjs`, `herdr-spawn-adapter.test.mjs`, `test/setup/checks.test.mjs` — tổng 246 test, 0 fail (1 skip = live-proof cần `FGOS_RUN_LIVE_AGY_HERDR=1`, không đổi). Full `npm test` đang chạy để so baseline trước khi commit.

Chi tiết:
- **R1 (H7a)**: `seedAgyTrust` viết lại hoàn toàn — trước đây không hề áp B1 (tự thêm cả `projectPath` LẪN `repoRoot` vô điều kiện, tức tự phát minh trust cho root) và khi settings.json hỏng thì âm thầm reset về `{}` (mất hết entry cũ). Giờ: refuse (`untrusted-root`) khi `repoRoot` chưa có trong `trustedWorkspaces` — kể cả khi file chưa tồn tại; refuse (`unreadable-store`) khi file hỏng, không overwrite. `readAgyStore` (nội bộ, giờ export) tách riêng để doctor check R3 dùng lại đúng logic đọc thật. `seedWorkspaceTrust` (herdr-round.mjs) trước đây KHÔNG có nhánh `agy`/`agy-json` nào cả — mọi kind khác `codex-toml` đều rơi vào nhánh `seedTrust` (ghi `~/.claude.json`), sai theo đúng finding H7a. HOME cho agy resolve từ `fullEnv.HOME` (executor's own private HOME, ví dụ `~/.agy-homes/<x>`), không phải `os.homedir()`.
- **R2 (H7b)**: grep xác nhận TRƯỚC ĐÂY teardown không gọi `removeTrust*` ở BẤT KỲ đâu trong herdr-round.mjs — entry agy/claude/codex bị seed sẽ tồn tại vĩnh viễn qua mọi round settle lẫn fail. Giờ: gọi ở 2 điểm hội tụ duy nhất — `settleRound` (path thành công) và `runHerdrRound`'s catch quanh `driveRound` (MỌI path fail, vì đây là điểm mọi throw không-settle hội tụ về). `worker-home.mjs` trước đây tự tay viết lại y hệt 6-field object shape của `seedTrust` (hai nơi độc lập, có thể trôi) — giờ dùng chung `trustedProjectEntry()` export từ trust-store.mjs.
- **R3 (H7c)**: doctor check cũ `trust-store-readable` chỉ đọc default `~/.claude.json`, chưa từng đọc `codex-toml`/`agy` dù executor có khai `interactiveMode.trustStore.kind` khác. Check mới `non-claude-trust-stores-readable` duyệt `executors` + `invocations`, dùng lại đúng `readCodexTrust`/`readAgyStore` (không viết parser thứ 3).
- **R4 (M3)**: `deliverLiveChunk` gọi `opts.onChunk(chunk, stream)` — SAI thứ tự so với quy ước `(stream, chunk)` dùng khắp nơi khác (transport.mjs's teeChunk, cli.mjs, loop.mjs). `startSupervisorProcess` còn tệ hơn: subscribe CẢ IPC message LẪN `proc.stdout`/`proc.stderr` 'data' — vì `deliverLiveChunk` tee cùng lúc cả hai kênh, nên onChunk bị gọi ĐÚP mỗi chunk. Sửa: đúng thứ tự + chỉ giữ subscription IPC. Parity test tại `cli-spawn-reconciliation.test.mjs` trước đây CHẤP NHẬN CẢ HAI THỨ TỰ (`typeof a === 'string' ? a : b`) — che mất bug; giờ strict.
- **R5 (M15b)**: `pollForOutcome` chỉ coi `ackSeen=true` khi file ack tồn tại trên đĩa; nếu worker không bao giờ ghi file ack (nhưng herdr tự báo `agentState:'working'`) thì bị resend lặp lại tới `MAX_RESENDS` dù đang xử lý dở. Giờ nhánh `if (agentState === 'working')` (đã có sẵn để cập nhật `lastProgressAt`) set thêm `ackSeen = true`.
- **R6 (M15c)**: `deliverBrief` trước đây: timeout ở bước submit + có result trên đĩa → coi là briefed (đã có); timeout + KHÔNG có result → `throw worker-spawn-fail` ngay, dù đây chỉ là transport ambiguity (herdr's `--until working` wait không kịp quan sát). Thêm nhánh thứ 3: timeout bất kỳ (không cần result) → `round.note({status:'briefed', delivery:'unknown'})` rồi return bình thường, để `pollForOutcome` (nơi DUY NHẤT thật sự settle round qua result file) có cơ hội quan sát outcome thật thay vì đoán mò ở submit.
- **R7 (L11)**: (a) `normalizeAgentName`'s middle-trim cũ giữ nguyên literal head+tail — 2 input khác nhau CHỈ khác ở đoạn giữa bị cắt bỏ sẽ collide thành cùng 1 tên agent (herdr địa chỉ theo tên!) — viết test tái hiện đúng collision này trước khi sửa, xác nhận sửa xong hết collide. Đổi sang hash SHA1 8-hex-char của TOÀN BỘ chuỗi làm suffix thay vì literal tail slice. (b) `cli-spawn-supervisor.mjs`'s `timeoutTimer` bị arm 2 lần (spawn-phase timer rồi worker-binding-phase timer) mà KHÔNG clear timer đầu trước khi gán biến mới — timer đầu bị orphan (mất khả năng bị clear ở nhánh exit bình thường, dù có guard `captureFrozen` nên không thực sự gây double-fire quan sát được, vẫn là leak + sai về nguyên tắc một-timer-một-biến). (c) 2 nhánh liveness check dùng bare `isProcessAlive(supBinding.supervisor?.pid)` không so `processStartTime` — cùng lớp PID-reuse-false-positive mà Phase 02 đã lập identity pattern để chặn cho nhánh incarnation-check kế bên; thêm `isBoundProcessAlive()` áp dụng cho cả 2 nhánh.

**Một gap đã biết**: chưa có test integration end-to-end cho `codex-toml` kind's teardown (chỉ có test cho `agy` kind lẫn unit test cho `removeCodexTrust`/`seedCodexTrust` sẵn có từ trước) — logic teardown dùng chung code path cho cả 3 kind (`if/else if/else` trong `removeWorkspaceTrust`), rủi ro thấp vì cấu trúc y hệt nhánh `agy` đã test qua integration.

## Requirements

- R1 (H7a) `trustStore.kind` `agy`/`agy-json` → `seedAgyTrust` với HOME resolved từ executor env (`~/.agy-homes/<x>/settings.json`), không `~/.claude.json`; `seedAgyTrust` áp B1 (refuse khi `repoRoot` chưa trusted) và không overwrite file corrupt.
- R2 (H7b) Teardown gọi `removeTrust*` đúng kind (`herdr-round.mjs:929` vùng), cả path fail; `worker-home.mjs:130-145` dùng cùng door `trust-store.mjs` (một writer).
- R3 (H7c) Doctor check readability cho codex-toml/agy trust store (hiện chỉ `claude-json`, `registrations.mjs:3544`).
- R4 (M3) `startSupervisorProcess`: gọi `onChunk(stream, chunk)` đúng thứ tự, chỉ subscribe IPC (hoặc supervisor không ghi stdio); parity test bỏ "chấp nhận cả hai thứ tự" (`cli-spawn-reconciliation.test.mjs:76-79`).
- R5 (M15b) Resend: coi `working` observed sau lần gửi đầu là ack cho mục đích resend (giữ `MAX_RESENDS`).
- R6 (M15c) Prompt submit timeout không result → delivery `unknown` typed (không `worker-spawn-fail`); receipt ghi `delivery:'unknown'` (bước đầu của tri-state, chỉ field này).
- R7 (L11) Tên agent normalize 32 ký tự → dùng hash suffix thay middle-trim để không collide; supervisor: một `timeoutTimer`, clear trước re-arm; cli-spawn liveness branch không binding so `processStartTime` (identity Phase 02).

## Files

- `src/runner/dispatch/herdr-round.mjs:578-607, 929, 700-713, 814-826, 1081`; `trust-store.mjs:277-372`; `worker-home.mjs:130-145`; `herdr-agent.mjs:49-60`
- `src/runner/dispatch/cli-spawn-supervisor.mjs:434-451, 568-590, 700-722, 849-863, 1140-1146, 1177-1183`
- `src/setup/registrations.mjs:3544`
- Tests: `test/runner/herdr-agent.test.mjs`, `herdr-spawn-adapter.test.mjs` (kind agy ghi `settings.json.trustedWorkspaces`; teardown xoá), `cli-spawn-reconciliation.test.mjs` (arg order + single delivery), `dispatch-trust-store.test.mjs` (B1 cho agy, corrupt không overwrite), `test/setup/checks-doctor-config.test.mjs`

## Steps

1. `impact` cho `seedTrust`, `seedAgyTrust`, `establishConfinement`, `startSupervisorProcess`, `deliverBrief`.
2. R4 (độc lập, có probe sẵn) → R1 → R2 → R3 → R5 → R6 → R7.
3. Docs: control-plane §Source Inventory trust-store (một door, hai kind), recovery-design X02 (ack semantics), CHANGELOG `[Unreleased]` (doctor check mới, trust entry được dọn).

## Validation

Test gaps #12, #13 (M3), #15 xanh; live: sau một herdr dispatch với `kind:agy`, `~/.claude.json` không thêm entry, `settings.json` có rồi mất sau teardown.

## Risk / rollback

R1 đổi nơi ghi trust cho agy — nếu agy CLI đọc `~/.claude.json` (không phải settings.json) thì dialog vẫn hiện: xác minh bằng live dispatch trước khi merge. R4 thay đổi output operator thấy (đúng hơn). Rollback từng R.
