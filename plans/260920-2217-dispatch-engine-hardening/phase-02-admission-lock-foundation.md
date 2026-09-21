# Phase 02 — Admission/lock foundation

Wave 1 · Gate: none · Findings: M2, H1, H3, L1. Context: review §H1/H3/M2, Phụ lục 4. Tiền đề cho Phase 03.

## Status — 2026-09-21

**R1, R2, R3, R4 xong trên nhánh `dispatch-hardening-phase02-admission-lock`** (worktree `.claude/worktrees/dispatch-hardening-phase02-admission-lock`, rẽ từ `main`@`0a97332b`). `npm test` ngoài session: 7216 test, chỉ fail 51 — toàn bộ thuộc `rust-host`/`fgctl`/`main-checkout-lock`, do worktree này chưa `cargo build --release --workspace` (binary không track trong git, main checkout có sẵn, worktree mới thì không) — không liên quan gì tới diff phase này, xác nhận qua `node -e` check binary tồn tại trên main. Không có test dispatch/coordination/run-lock/operation-choice nào fail.

Deviation nhỏ so với kế hoạch ban đầu:
- R3 không cần viết helper `writeRunArtifactAtomic` mới — `publishMutableProjection`/`publishMarkerOnce` đã có sẵn trong `cli-spawn-supervisor.mjs`/`run-lock.mjs` từ trước, dùng thẳng.
- "resume: result.json corrupt → parked: result-corrupt" hiện ở `executeAssignment` (không phải `reconcileCliSpawnRun`, nơi vocab `status:'parked'` thuộc về) nên implement bằng `throw RunnerConfigError({code:'result-corrupt', phase:'post-admission'})` — cùng cơ chế refuse với R1, không phải trả object `{status:'parked'}`.
- R1's line-range trong Files section trôi khá xa so với thực tế (file đã đổi nhiều từ lúc viết phase file) — thực tế throw site cho `run-control-superseded` có **3 chỗ** (không phải 2 như phỏng đoán ban đầu từ review), cả 3 đã gắn code/phase.

Bug tìm thấy giữa chừng, ngoài phạm vi ban đầu nhưng bắt buộc phải sửa: hoist `getBootId`/`getProcessStartTime` sang `process-identity.mjs` bằng `export {...} from './process-identity.mjs'` — re-export syntax này KHÔNG tạo local binding, nên mọi lời gọi `getProcessStartTime(...)` ngay trong chính `cli-spawn-supervisor.mjs` (dùng cho worker/supervisor liveness) throw `ReferenceError` ngay khi supervisor con tự spawn lại chính nó. Hậu quả thực tế: mọi test `executeAssignment` chạm tới cli-spawn thật đều fail với "supervisor exited before adapter receipt was published" — bị lầm tưởng ban đầu là do thiếu `node_modules`, sau đó lầm tưởng là do worktree/git môi trường, cuối cùng bisect bằng cách tự chạy `cli-spawn-supervisor.mjs` trực tiếp mới lộ ra đúng nguyên nhân. Fix: `import {...} from './process-identity.mjs'; export {...};` — tách import (cho local dùng) và export (cho consumer ngoài) riêng.

Cũng tìm thấy: file mới `process-identity.mjs` thiếu row trong `docs/architecture-manifest.json` làm 2 test trong `test/architecture.test.mjs` fail ("đủ sổ" + "import một chiều") — đã thêm row `"infra"` cạnh `run-lock.mjs`.

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
