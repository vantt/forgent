# Phase 09 — Boundary placement + simplification

Wave 4 · Gate: Phase 01–08 xong (hành vi đã khoá bằng test trước khi dời code) · Findings: M10, L5, L8, L12, L13 + Simplicity Audit. Context: review §Simplicity Audit, §Architecture Quality Audit, Phụ lục 8.

**Có component-boundary change** — cập nhật `docs/platform/component-boundary.md` + `dispatch-control-plane.md` §Component-Internal Ownership khi thi công.

## Requirements

- R1 (M10) Dời `fanoutBatchExecutorCli` (`cli.mjs:1248-1360`) sang Work Driver layer (cạnh `src/runner/loop.mjs` hoặc `src/verbs/state/`); dispatch chỉ còn `compileDispatchPlan` + `executeExecutorCli`; `pick` OK nhưng execute throw → `return` với blocked (không để item claimed treo). `executor.dispatch` event: docs ghi exception hoặc route qua run dir + evaluator đọc run dir. Grep-test: `src/runner/dispatch/**` không tham chiếu `'pick'`/`'return'`/`appendEvent`.
- R2 Dời `executorIdForWork`, `resolveCapabilityIdentityDetails`, `buildPrompt(workItem)` (Work/stage/skill lookup) ra khỏi dispatch core cùng `operation-choice.mjs` (đã được docs công nhận là Work Driver compatibility).
- R3 Tách `assignment-runner.mjs`: `settlement.mjs` (một pipeline thay 3 bản `2420-2748/2749-2844/2845-3078`), `reconcile-cli-spawn.mjs` (import-graph test đã muốn); giữ export tên cũ.
- R4 Confinement: một `assessAndPrepare(request)` cho hai door; driver claims → attestation (xoá parser argv bwrap `authority.mjs:133-215`); leaf `DispatchError/resolveExecutorEnv/proof helpers` để `authority.mjs` không import adapter layer.
- R5 Herdr: tách `herdr-reconcile.mjs` (S2 proof layer ≈500 dòng) khỏi round; receipt publication một hàm cho failed/settled.
- R6 (L5) Một claim schema + một result path trong brief (`assignment.mjs:715-731` vs `brief.mjs:83-110`); `effectiveContract` truyền vào `renderBrief`; cli-spawn prompt qua file-pointer như herdr (bỏ giới hạn argv 128 KiB) hoặc size hint trước spawn; xoá `prepareDispatch` 0 caller.
- R7 (L8) In-process handback: hoặc mở Run + nhận result (Task) hoặc docs ghi rõ "handback là return value, không phải invocation"; `replacement-authority` đọc từ `controller/`, không `outbox/`; `gatewaySessionId` populate hoặc bỏ.
- R8 (L12/L13) `openDispatchRun` stamp `contract:'dispatch-run.legacy'`; docs ghi herdr-plugin launcher là host convenience.
- R9 Perf (từ Performance Audit): cache probe `{fingerprint → passedAt}` TTL trong attestation store (~213 ms/launch); memo `allRuns` per verb call.

## Files

- `src/runner/dispatch/cli.mjs`, `resolve.mjs:13, 38-42, 534-700`, `prepare.mjs`, `operation-choice.mjs`, `assignment-runner.mjs`, `confinement/authority.mjs`, `herdr-round.mjs`, `brief.mjs`, `assignment.mjs`, `runtime-inspection.mjs:118`
- `src/runner/loop.mjs` (nhận fanout), `src/report/dispatch-confidence.mjs`
- `test/runner/dispatch-reconciliation-import-graph.test.mjs` (mở rộng ban list + boundary grep-test mới), `dispatch-production-call-sites.test.mjs` (thêm fanout + `dispatchDeclaredOperation` → adapter)

## Steps

1. `impact` cho mọi symbol dời; mỗi R là một cell riêng (không gộp), `detect_changes` trước commit.
2. R1 → R2 (boundary) → R3 → R4 → R5 (cấu trúc) → R6 → R7 → R8 → R9.
3. Docs: `component-boundary.md`, control-plane §Component-Internal Ownership (forbidden list trở thành thật), §Source Inventory, boundary-map §9 OccupancyPort, advisory §12.

## Validation

`npm test` xanh sau mỗi R; import-graph tests mở rộng pass; `git diff --stat` mỗi cell chỉ chạm module nêu tên.

## Risk / rollback

Refactor không đổi hành vi — mỗi R chỉ merge khi test suite trước/sau giống nhau; R4/R5 chạm test p03/p04/p05 lớn, làm sau cùng. Rollback theo cell.
