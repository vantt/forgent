# Phase 02 — Admission/lock foundation

Wave 1 · Gate: none · Findings: M2, H1, H3, L1. Context: review §H1/H3/M2, Phụ lục 4. Tiền đề cho Phase 03.

## Requirements

- R1 (M2) `RunnerConfigError` mang `code` + `phase` (`pre-admission` | `post-admission`): `admission-duplicate-retry`, `admission-invalid-predecessor`, `run-control-held`, `run-control-superseded`. Tests assert `code`, không regex message.
- R2 (H1) Control holder = `{id, pid, bootId, processStartTime, host}`; `acquireRunControl`: pid sống nhưng `processStartTime` lệch → dead; `/proc/<pid>` không đọc được → **unknown → held**. Cùng holder cho `recover.mjs:280`, `assignment-runner.mjs:3125`.
- R3 (H3) `result.json`, `run.json` full rewrite, `dispatch-plan.json`/effective-contract rewrite → `publishMutableProjection` (temp+fsync+rename); `assignment.json.dispatchedRuns` → marker append-only `dispatched/<NN>`; resume: `result.json` tồn tại nhưng không parse → `parked: result-corrupt`, không launch.
- R4 (L1) `expectedRunId` có attempt ≠ next computed → refuse, không adopt.

## Files

- `src/runner/dispatch/config.mjs:75-81` (`RunnerConfigError` code/phase), `dispatch-error.mjs`
- `src/runner/dispatch/run-lock.mjs:32-41, 275-326` (R2); `cli-spawn-supervisor.mjs:48-61` — hoist `getBootId/getProcessStartTime` vào leaf `src/runner/dispatch/process-identity.mjs` (fs-only, không widen import graph; xem `dispatch-reconciliation-import-graph.test.mjs:47-66` ban list)
- `src/runner/dispatch/assignment-runner.mjs:1079-1088, 1957, 2293, 2411, 2712, 2762, 2858` (R1); `:1782, 2717, 2833, 3060, 2839, 3066, 1369, 1887-1890, 1696-1704, 2239` (R3); `:1025-1033` (R4); `:1841-1846` (resume corrupt)
- `src/verbs/dispatch/recover.mjs:280`
- Tests: `test/runner/assignment-dispatch.test.mjs` (`:2793`, `:3020` → assert code), `dispatch-assignment-id-claim-concurrency.test.mjs`, new `run-lock-identity.test.mjs`

## Steps

1. `impact` cho `acquireRunControl`, `releaseRunControl`, `admitRunAttempt`, `RunnerConfigError`.
2. R1 trước (không đổi hành vi, chỉ thêm field) → cập nhật test regex → code.
3. R2: leaf module; holder mới; reclaim decision table: {alive+startTime match → held; alive+mismatch → dead; ESRCH → dead; EPERM/unreadable → unknown→held}. Test 3 case + reused-pid.
4. R3: một helper `writeRunArtifactAtomic(runDir, name, obj)`; thay 10 site; marker `dispatched/`; `operation-choice.mjs:140-149` đọc marker thay `dispatchedRuns` (giữ đọc cả hai một release).
5. R4.
6. Docs: contract :103-114 (holder identity đã đủ; phase/delivery vẫn static tới Phase 03), recovery-design §6.

## Validation

Test gaps #2 (torn write → parked), #4 (identity) xanh; `npm test` ngoài session.

## Risk / rollback

R2 đổi format generation record (thêm field) — reader cũ bỏ qua field lạ, tương thích. R3 marker mới song song `dispatchedRuns` một release rồi bỏ. Sandbox không thấy host process sẽ **giữ** lock thay vì reclaim — đúng ý "unknown is not dead"; operator có `dispatch recover` với proof.
