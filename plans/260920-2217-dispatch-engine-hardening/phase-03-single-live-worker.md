# Phase 03 — Single live worker per Run

Wave 2 · Gate: Phase 02 · Findings: C1, H2, H13, M1, M9(a), M15(a), L2. Context: review §C1/H2/H13/M1, Phụ lục 4/6/7.

Mục tiêu duy nhất: **không path nào spawn worker thứ hai cho một Run chưa settle** — qua resume, recover, session retry, hay caller unfenced.

## Requirements

- R1 (C1a) Resume: sau `rec = await reconcileFn(runDir)`, `waiting|held|observed|refused` hoặc `parked` với reason ≠ `command-missing` → throw `RunnerConfigError{code:'run-in-flight'|'run-unreconciled', phase:'post-admission'}`; chỉ `command-missing` được launch.
- R2 (C1b) `reconcileHerdrSpawnRun` trả `runResult` khi `settled` (normalize từ receipt/outbox), hoặc `{settled:false, observed:true}` tường minh; `runHerdrRound:1044-1051` không trả raw reconcile object làm adapter result.
- R3 (C1c) `dispatch recover --action resume-driver`: refuse khi Run thuộc session (`findCoordinationSessionOwningAssignment`), `resume` yêu cầu `liveness.fresh === false`, xoá claim qua `planClearAssignmentClaim/applyClearAssignmentClaim` (một bộ proof).
- R4 (H2) session-engine unlink `dispatch.claim`/`retry-N.claim` chỉ khi `err.phase !== 'post-admission'`.
- R5 (H13) herdr-round ghi `controller/commands/<id>.json` qua `commitCommandOutcome` có control token.
- R6 (M1) Unfenced admission: refuse khi current generation chưa có `result.json` và holder alive/unknown (dùng identity Phase 02); flag `--force-new-attempt` cho operator.
- R7 (M9a) `reconcile apply` lock reclaim dead holder bằng `startTime(pid)` (đã có trong module).
- R8 (M15a) herdr unconfined: persist `paneId` trước khi deliver prompt.
- R9 (L2) Sau R6, session claim file trở thành redundant → giữ một release, ghi deprecation.

## Files

- `src/runner/dispatch/assignment-runner.mjs:1840-1876` (R1), `:955-1023` (R6), `:3079-3377` (reconcile vocab)
- `src/runner/dispatch/herdr-round.mjs:2036-2040, 2120-2125, 2170-2176, 1044-1051` (R2); `:1325-1330, 1503-1515, 1571-1580, 1695-1712, 2113-2118` (R5); `:1497-1515` (R8)
- `src/verbs/dispatch/recover.mjs:205-233`, `src/runner/dispatch/recovery-planner.mjs:91-140, 286-299` (R3)
- `src/runner/coordination/session-engine.mjs:385-397, 436-446, 4810-4825` (R4)
- `src/runner/dispatch/reconciliation-planner.mjs:537-541` (R7)
- Tests mới: `test/runner/dispatch-resume-live-worker.test.mjs` (cli-spawn + herdr: resume với supervisor/worker pid sống → 0 spawn, 0 `controller/commands` thứ hai); `test/verbs/dispatch-recovery.test.mjs` (refuse session-owned, refuse fresh heartbeat); `test/runner/coordination-session-engine.test.mjs` (post-admission error giữ claim); `dispatch-reconciliation-concurrency.test.mjs` (dead-holder reclaim)

## Steps

1. `impact` cho `executeAssignment`, `reconcileHerdrSpawnRun`, `reconcileCliSpawnRun`, `recoverApplyUseCase`, `createAndExecuteSessionTask`, `commitCommandOutcome`. Cảnh báo HIGH dự kiến — báo trước khi sửa.
2. Viết test R1 trước (fail đỏ) → R2 → R1 code → R4 → R3 → R5 → R6 → R7 → R8.
3. Gộp vocabulary reconcile: `waiting`(herdr) = `running`(cli) → một enum `RECONCILE_STATUS` dùng cả hai adapter (không đổi tên function, chỉ giá trị).
4. Docs: recovery-design §9 S1/S2, §10 F-b/F-f (giờ đúng cho `executeAssignment`), control-plane §Observation ("recover không relaunch; relaunch chỉ qua runner với proof").

## Validation

Test gaps #1, #3, #5, #10, #12 xanh; `test/runner/herdr-reconciliation.test.mjs`, `cli-spawn-reconciliation.test.mjs` không regress; `npm test` ngoài session.

## Risk / rollback

R1 có thể chặn resume hợp lệ nếu reconcile trả `parked` với reason lạ → liệt kê reason được phép launch tường minh (allow-list), log reason bị chặn. R6 đổi hành vi pinned `assignment-dispatch.test.mjs:3023` (next-available-attempt) — cần cập nhật test có chủ đích, ghi trong report phase. Rollback từng R.
