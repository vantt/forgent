# Phase 07 — Herdr adapter, trust store, supervisor tee

Wave 3 · Gate: none (H13/M15a đã làm ở Phase 03) · Findings: H7, M3, M15(b,c), L11. Context: review §H7/M3/M15, Phụ lục 2/6.

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
