# Phase 09 — Boundary placement + simplification

Wave 4 · Gate: Phase 01–08 xong (hành vi đã khoá bằng test trước khi dời code) · Findings: M10, L5, L8, L12, L13 + Simplicity Audit. Context: review §Simplicity Audit, §Architecture Quality Audit, Phụ lục 8.

Status: VERIFIED/integrated via Unit I12 at `main@c782a08dfcae89279dcb1ca9fb59aa73fb58c515`; approved candidate `1089eb347455c10164ec03ffbcbf54ae35cd2097`; reviewer Round 5 APPROVE; post-merge full suite 7677 pass / 0 fail with dev-checkout `fgos` bin. Residual LOW debt: F-R5-1 static R2 lock evasions, F13 rollback-order debt, F14 probe-cache trust.

**Có component-boundary change** — cập nhật `docs/platform/component-boundary.md` + `dispatch-control-plane.md` §Component-Internal Ownership khi thi công.

## Requirements

- R1 (M10) Dời `fanoutBatchExecutorCli` (`cli.mjs:1248-1360`) sang Work Driver layer (cạnh `src/runner/loop.mjs` hoặc `src/verbs/state/`); dispatch chỉ còn `compileDispatchPlan` + `executeExecutorCli`; `pick` OK nhưng execute throw → `return` với blocked (không để item claimed treo). `executor.dispatch` event: docs ghi exception hoặc route qua run dir + evaluator đọc run dir. Grep-test: `src/runner/dispatch/**` không tham chiếu `'pick'`/`'return'`/`appendEvent`.
- R2 Dời `executorIdForWork`, `resolveCapabilityIdentityDetails`, `buildPrompt(workItem)` (Work/stage/skill lookup) ra khỏi dispatch core cùng `operation-choice.mjs` (đã được docs công nhận là Work Driver compatibility). *Track Manager Ratification / Decision*: Triển khai theo Option A (phê chuẩn bởi Track Manager): Dời các lookup sang leaf compatibility module `src/runner/work-compat.mjs` (đăng ký tầng `infra` trong architecture manifest) với 0 imports vào dispatch core; `resolve.mjs` và `prepare.mjs` giữ re-export tương thích ngược. Dispatch core không chứa implementation Work lookup; pre-existing consumers `plan.mjs` (`compileDispatchPlan({work})`) và `cli.mjs` (`spawnWorker`) tiêu thụ qua re-export và được khóa ranh giới bởi allowlist trong `test/runner/dispatch-reconciliation-import-graph.test.mjs` để bảo toàn call contract hiện có mà không gây cyclic import.
- R3 Tách `assignment-runner.mjs`: `settlement.mjs` (một pipeline thay 3 bản `2420-2748/2749-2844/2845-3078`), `reconcile-cli-spawn.mjs` (import-graph test đã muốn); giữ export tên cũ.
- R4 Confinement: một `assessAndPrepare(request)` cho hai door; driver claims → attestation (xoá parser argv bwrap `authority.mjs:133-215`); leaf `DispatchError/resolveExecutorEnv/proof helpers` để `authority.mjs` không import adapter layer. *Track Manager Ratification*: Giữ parser argv làm defensive fallback sau driver claims khi driver claims vắng mặt (CHANGELOG đã ghi rõ).
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

Track-local proof policy (approved 2026-09-26):

- Mỗi R chạy focused behavior tests liên quan, import/boundary/compatibility
  tests, `git diff --check`, và kiểm `git diff --stat` chỉ chạm file set đã
  khai. Không mặc định chạy `npm test` sau từng structural cell.
- R1–R2: boundary/import/call-site proof.
- R3–R4: settlement/result-truth và confinement fail-closed matrix.
- Sau R5: broader settlement/confinement/Herdr checkpoint; chạy `npm test`.
- R6–R8: brief/claim/handback/legacy compatibility focused proof.
- Sau R9: cache fingerprint/TTL/per-verb invalidation proof, aggregate focused
  matrix, rồi `npm test` trên final candidate.
- Independent Reviewer chạy một full suite trên exact reviewed candidate;
  mutation proof bắt buộc cho R3/R4/R5/R9, còn structural boundary có thể dùng
  mutation-sensitive static/focused test nếu nó khóa trực tiếp regression.
- Track Manager không chạy lại toàn reviewer matrix nếu SHA/log/environment
  còn hợp lệ; chỉ spot-check finding/high-risk evidence và chạy một post-merge
  full suite.

I12 implementation/review đã hoạt động theo prompt cũ trước khi policy này
được duyệt nên được grandfather: không interrupt/restart/invalidate live
sessions và không bỏ evidence mạnh hơn đã sinh. Policy áp dụng cho prompt
fix/re-review/integration kế tiếp và các unit sau.

## Risk / rollback

Refactor không đổi hành vi — mỗi R chỉ commit khi focused proof tương ứng xanh;
checkpoint/full-suite proof khóa aggregate behavior theo policy trên. Rollback
theo cell.
