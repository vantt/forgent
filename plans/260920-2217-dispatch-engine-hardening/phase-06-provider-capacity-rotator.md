# Phase 06 — Provider capacity rotator

Wave 3 · Gate: **phải xong trước khi bật `runner.providers.*.accounts` (global inventory) ở bất kỳ host nào** · Findings: C2, H8, M6 (vocabulary), H3 (state.json). Context: review §C2/H8, Phụ lục 2; `plans/260916-account-rotator/plan.md` Phase 05 contract ("quarantine only high-confidence cases") — C2 là regression so với contract này.

Tiềm ẩn hôm nay (host này không có inventory) nên xếp Wave 3; nhưng một khi inventory bật, C2 làm pool cạn ngay lần 429 đầu.

## Requirements

- R1 (C2a) Runner gọi `quarantineProviderAccount({provider, accountId, reasonCode, quarantineKind: fault.quarantineKind, until: fault.until, runtimeDir, detail:{kind:'provider-stderr-classifier', runId, assignmentId}})`; evidence đọc `quarantine.kind/until`.
- R2 (C2b) `classifyProviderCapacityFault` nhận `provider` bắt buộc; bỏ wildcard `provider === undefined`; regex auth anchor theo dòng provider-known (vd `No API key found`, `Use /login`) hoặc chỉ N dòng cuối; `auth-token` chỉ khi `adapterOutcome` corroborate; negative fixture "Unexpected token … failed".
- R3 (C2c) `withFileLock`: đọc `{pid}`, reclaim khi `!isPidAlive(pid)` (dùng identity Phase 02 nếu có); `acquireProviderAccountLease` bọc vào cùng settle path như `status:'refused'` (không escape sau admission); doctor `provider-capacity-lock-stale`.
- R4 (H3) `state.json` temp+rename; corrupt → rename aside + audit entry, khởi tạo rỗng (lease/quarantine mất, accounts re-derive từ config).
- R5 (H8) Lease được chọn nhưng backend không provision credential → `status:'refused', reason:'credential-provisioning-unsupported'` (hoặc provision qua env cho cli-spawn nếu chủ plan rotator chọn); resume re-acquire sticky account trước relaunch.
- R6 (M6) `normalizeProviderFamily` áp tại inventory validation và `providerCapacityProvider` derivation (`openai` ≡ `openai-codex`); fallback evidence thêm `fromProvider`/`toProvider`.

## Files

- `src/runner/dispatch/assignment-runner.mjs:1629-1636, 2587-2619, 1635, 1270` 
- `src/runner/dispatch/provider-capacity.mjs:182-215, 224, 300-340, 377-417, 61`
- `src/runner/dispatch/provider-adapter.mjs:75-84`, `confinement/drivers/bwrap.mjs:29-51`
- `src/setup/registrations.mjs:1670-1702` (doctor)
- Tests: `test/runner/provider-capacity.test.mjs` (negative classifier, lock reclaim, corrupt state), `assignment-dispatch.test.mjs` (fault qua `executeAssignment` → `until` có; unconfined lease → refuse; resume re-acquire; inventory vocabulary)

## Steps

1. `impact` cho `quarantineProviderAccount`, `classifyProviderCapacityFault`, `withFileLock`, `acquireProviderAccountLease`.
2. R1+R2 (integration test đẩy stderr qua fake executor trước) → R3 → R4 → R6 → R5 (theo chủ plan rotator).
3. Cập nhật `plans/260916-account-rotator/plan.md` status (Phase 00 việc 12) và ghi C2 vào ledger deferral/regression của plan đó.
4. Docs: control-plane §Planning (rotator sau Admission; rotator không đổi provider, declared fallback có thể), README :144.

## Validation

Test gaps #6 xanh; probe reviewer (`scratchpad/review/probe.mjs` đã xoá — viết lại thành test) chạy lại: quota → `until` có; "token failed" stderr → `none`; lock pid chết → reclaim trong <100 ms.

## Risk / rollback

R2 có thể bỏ sót auth fault thật → giữ `evidence-only` action (ghi nhận, không quarantine) cho match yếu, quarantine chỉ khi corroborated. R4 mất lease/quarantine khi corrupt — chấp nhận, có audit. Rollback từng R.
