# Phase 06 — Provider capacity rotator

Wave 3 · Gate: **phải xong trước khi bật `runner.providers.*.accounts` (global inventory) ở bất kỳ host nào** · Findings: C2, H8, M6 (vocabulary), H3 (state.json). Context: review §C2/H8, Phụ lục 2; `plans/260916-account-rotator/plan.md` Phase 05 contract ("quarantine only high-confidence cases") — C2 là regression so với contract này.

## Status — 2026-09-21

**R1–R6 xong trên nhánh `dispatch-hardening-phase06-provider-capacity-rotator`** (worktree cùng tên, rẽ từ `main` HEAD lúc bắt đầu). `npm test` ngoài session: 7225 test, 51 fail — so trực tiếp (bỏ timing suffix) với baseline của Phase 02/04 → **giống hệt, 0 khác biệt**, xác nhận không regression.

Chi tiết:
- **R1 (C2a)**: call site `quarantineProviderAccount` trước đây truyền `{runnerConfig, manualClear, evidence}` — không khớp signature thật `{provider, accountId, reasonCode, quarantineKind, until, runtimeDir, detail}`. Hậu quả thật: `until` luôn bị bỏ → `isQuarantined()` fail-closed **vĩnh viễn** ngay lần fault đầu tiên (quota fault có reset 3h vẫn quarantine mãi mãi). Sửa đúng signature; cũng sửa `src/setup/registrations.mjs`'s `provider-capacity-state` doctor check — đọc nhầm `account.id` (đúng phải là `.accountId`) và `quarantine.manualClear` (không tồn tại, đúng phải là `quarantine.kind === 'manual-clear'`). Tìm thêm một chỗ dùng sai signature tương tự trong `test/runner/dispatch-reconcile-operation.test.mjs`, đã sửa.
- **R2 (C2b)**: `provider` giờ bắt buộc (bỏ wildcard `undefined` → openai vocabulary). Regex auth-fault anchor theo cụm từ CLI thật ("No API key found", "Use /login", …) + chỉ quét N=5 dòng cuối, VÀ bắt buộc `adapterOutcome` corroborate (process thật fail/error, không chỉ text match). Negative fixture đúng probe review: `"SyntaxError: Unexpected token } … 1 test failed"` giờ KHÔNG còn bị bắt nhầm thành `auth-token`.
- **R3 (C2c)**: `withFileLock` giờ đọc `{pid}` của lock file khi gặp `EEXIST`, reclaim ngay khi `!isPidAlive(pid)` thay vì chờ hết `waitMs` rồi throw raw `EEXIST`. Lỗi (kể cả lock-stale mới lẫn corrupt-state cũ) không còn escape ra ngoài `admitRunAttempt` — bọc `acquireProviderAccountLease` ở CẢ HAI call site (primary + fallback-candidate loop) vào cùng settle path `status:'refused'` đã có sẵn cho H2. Doctor check mới `provider-capacity-lock-stale` (read-only, không tự reclaim).
- **R4 (H3)**: `writeState` giờ temp+fsync+rename (atomic). `readState` bắt lỗi JSON.parse/non-object, rename file hỏng sang `state.json.corrupt-<ts>` (giữ nguyên bằng chứng), khởi tạo state rỗng + ghi audit entry mô tả sự cố — thay vì throw thẳng ra làm hỏng MỌI lease/release/quarantine call trên host.
- **R5 (H8)**: refuse (`credential-provisioning-unsupported`) khi lease được chọn nhưng `confinement.mode: 'required'` được khai báo mà adapter không phải `cli-spawn` (đường duy nhất bwrap driver thật sự provision credential hôm nay) — release lease trước khi refuse, không leak. **Cố ý thu hẹp phạm vi**: KHÔNG refuse trường hợp unconfined/không khai confinement — giữ nguyên hành vi hiện tại (`credentialProvisioned:false`, đã trung thực từ trước), vì một test thật (`assignment-dispatch.test.mjs`) chứng minh đây là hành vi ĐANG được chấp nhận hôm nay; chọn giữa "refuse cả 2 case" vs "provision qua env cho cli-spawn" cho case unconfined để dành cho chủ plan account-rotator quyết, đúng như 2 lựa chọn review nêu ra. Resume re-acquire: bỏ điều kiện `!admitted.resumed` — control flow chỉ tới điểm lease-select khi reconcile đã xác nhận không có worker sống/settled để reattach, nên relaunch thật sự cần lease mới; sticky-account logic có sẵn tự động ưu tiên lại đúng account cũ.
- **R6 (M6)**: `normalizeProviderFamily` (provider-adapter.mjs) thêm case `openai` (bare) ≡ `openai-codex`. Áp dụng tại `providerCapacityProvider` derivation (2 chỗ: primary + fallback candidate) VÀ tại `validateProviderAccountInventory` (config khai cả `providers.openai` lẫn `providers.openai-codex` giờ bị refuse rõ ràng thay vì âm thầm tách kho tài khoản làm hai, không bao giờ cùng nhìn thấy nhau). Fallback evidence thêm `fromProvider`/`toProvider`.

**Một gap đã biết, ghi lại thay vì giấu**: R5's refuse-path (`required` confinement + non-cli-spawn adapter) không có integration test riêng — đã thử fixture qua `executeAssignment` thật với executor `herdr-spawn`, tốn nhiều vòng debug (routing executor cần `cliOverride.preferExecutor` chứ không phải `buildAssignment({executorId})`; `confinement` phải khai ở `capabilities.<cap>.confinement` chứ không phải `executors.<id>.confinement`) nhưng cuối cùng chạm vào `confinement-grant-invalid` từ chính Confinement Authority thật (do fixture thiếu setup đầy đủ cho bwrap driver thật) trước khi tới được nhánh refuse của phase này — không đủ thời gian debug tiếp trong ngân sách phase, và một test sai/gây hiểu lầm còn tệ hơn không có test. Logic đã verify kỹ bằng đọc code trực tiếp (2 dòng điều kiện, không phức tạp). Không loại trừ khả năng cần một `fgos-code-panel`/dev session riêng dựng fixture herdr-spawn đầy đủ nếu cần coverage này sau.

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
