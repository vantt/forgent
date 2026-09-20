# Phase 04 — Confinement attestation + secrets

Wave 2 · Gate: D2 (H10), D4 (M8 bypass) · Findings: H9, H11, H10, M8, L9. Context: review §H9/H10/H11/M8, Phụ lục 3.

**H9 là regression:** P06 evidence (`plans/260910-1243-confinement-authority-implementation/reports/phase-06-evidence/*.json`, dispatch 2026-09-10) có `phase:completed, outcome:enforced, backend:bwrap`; nhánh `if (!request.assignmentLaunchContext)` tách hai door vào 2026-09-13 (`8e3da27c`, `f7d8ccec`, `649792d6` — runtime-recovery P02). Từ đó assignment door ghi `outcome=unknown`.

## Requirements

- R1 (H9) `prepareConfinementForLaunch` trả `{backendPlan, preparedConfinement}`; completed/failed attestation dùng chúng; test assignment door → `outcome:'enforced'`, `backend.id:'bwrap'`. Bật p04 R8 mặc định khi bwrap có (`FGOS_LIVE_BWRAP_TESTS` chỉ để tắt).
- R2 (H11) Launch envelope + prepared-invocation lưu `envDigest` + allow-list env non-secret; secret qua side file 0600 xoá sau spawn (supervisor đọc rồi unlink); herdr `--env` argv chỉ non-secret, launcher script không export secret; `protected/` mkdir 0700. `attestation-store.mjs` header sửa cho đúng.
- R3 (H10, sau D2) Một rule `backendId = request.backendId ?? invocation.confinement.backend ?? executor.confinement.backend ?? 'bwrap'` dùng cho cả hai door; xoá `backendRegistry.defaultBackend` dead code.
- R4 (M8) Gọi `reapOrphanedConfinementResources` từ `fgos doctor --fix` + runner start; doctor check đếm markered dead-owner dirs; `finalize` với `timeout` receipt → schedule reap thay retained-forever; test dùng mkdtemp riêng. Bypass pairing (sau D4) derive từ plan coverage; ghi `permissionMode` vào attestation.
- R5 (L9) `saveAttestationRecord` fail trên refusal path không che typed refusal (wrap, attach `cause`); `getBackendDriver` untyped → `DispatchError`.

## Files

- `src/runner/dispatch/confinement/authority.mjs:586-589, 1094-1104, 1126-1300, 1349-1360, 1606-1646, 1690-1705` (R1, R2, R4), `:638-655, 1168` (R3), `:506-520` (R4 bypass), `:635` (R5)
- `src/runner/dispatch/confinement/request.mjs:413` (R3), `cleanup.mjs:100` (R4), `attestation-store.mjs:166` (R5), `backend-registry.mjs:151-157`
- `src/runner/dispatch/cli-spawn-supervisor.mjs:99, 125, 596` (R2), `herdr-round.mjs:66-80, 1135` + `herdr-agent.mjs:154-156` (R2)
- `src/setup/checks.mjs` / `registrations.mjs` (R4 doctor; thêm `confinement-attestation-store-writable` — trùng M16, làm ở đây)
- Tests: `test/runner/dispatch-confinement-authority.test.mjs:940-1000` mở rộng required + scratch registry; `dispatch-confinement-p04.test.mjs` R8; new envelope-redaction test; `test/setup/confinement-doctor-checks.test.mjs`

## Steps

1. `impact` cho `executeThroughConfinement`, `prepareConfinementForLaunch`, `finalizeConfinementResources`, `buildConfinementRequest`.
2. R1 (regression) trước, có test bám P06 evidence shape.
3. R2 — thiết kế side-file contract trong `cli-spawn-launch-envelope.v1` (thêm `secretsRef`), giữ digest verify; herdr đường riêng.
4. R3/R4 theo quyết định; R5.
5. Docs: control-plane §Launch/Confinement (`required` = host-write-deny; hai door cùng rule), `attestation-store.mjs` header, CHANGELOG `[Unreleased]` (user-visible: doctor check mới, reaper).

## Validation

Test gaps #8 xanh; live check: `ls /tmp/fgos-confinement | wc -l` giảm sau `doctor --fix`; grep envelope không có giá trị `ANTHROPIC_*`.

## Risk / rollback

R2 đổi contract envelope (supervisor cũ không đọc side file) — bump `cli-spawn-launch-envelope.v2`, supervisor chấp nhận cả hai một release. R1 thuần sửa lỗi. Rollback từng R.
