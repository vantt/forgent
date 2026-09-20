# Phase 05 — Policy/plan governance coherence

Wave 3 · Gate: D1 cho H6(b); M5 phối hợp chủ plan `260915-executor-policy-dispatch-seams` (Phase 08 pending) · Findings: H6, H12, M5, M6, M7, M12, L4. Context: review §H6/H12/M5/M6/M7/M12, Phụ lục 1/2.

## Requirements

- R1 (H6a) `--work` early-return plan vẫn chạy `resolveExecutorConfig` cho global executor và copy `governance`; synthesize minimal policy để `disallowedProviders` được đánh giá. Không còn plan "dispatchable" nào thiếu `governance`.
- R2 (H6b, sau D1) `selector.type==='executor'` + `configured:false` → `mechanism:'unavailable'`, `reasonCodes:['selector.unregistered']`; cập nhật `dispatch.test.mjs:5189` có chủ đích.
- R3 (H12) `preferInvocation` vào merge loop `schema.mjs:341` và rebuild `cliOverride` `session-engine.mjs:2896`; test declared-protocol assert invocation id spawn và read-only redirect không fire khi đã pin.
- R4 (M12) Một allow-list `POLICY_PATCH_FIELDS` là nguồn duy nhất (schema, resolver reader, `registrations.mjs:853`, `execution-contract.mjs` import từ nó); `policyProvenance` cho mọi field; rename param `cliOverride` → `policyInputs` (giữ alias một release); xoá 2 precedence list lệch trong comment.
- R5 (M6) Một `deriveProviderFamily(entry, cliCommand)` + `normalizeProviderFamily` dùng ở `assignment-policy.mjs:407-425`, `assignment-runner.mjs:270-296, 1628, 1270`, `cli.mjs:855-890, 303`; tách `lookupProvider` (bảng model) khỏi `providerFamily` (governance/provenance).
- R6 (M7) Persist redirect decision `{sourceExecutorId, pool, seed, chosen, invocation}` vào `dispatch-plan.json`; pool entry cross-provider phải khai `crossProvider:true`.
- R7 (M5) Hỏi chủ plan seams: flip PlacementPolicy thành binder thật (theo Phase 08 của plan đó) hay giữ shadow → nếu giữ, xoá `admitFallbackCandidate/fallbackCandidates` shadow và sửa header/docs.
- R8 (L4) Cắt cycle `config.mjs:39 → transport.mjs`: `EXECUTOR_ADAPTERS` vào `adapters.mjs` leaf.

## Files

- `src/runner/dispatch/plan.mjs:117-135, 229-263` (R1, R2), `resolve.mjs:135, 331-334, 365, 498`
- `src/runner/definitions/schema.mjs:125, 272-345` (R3, R4), `src/runner/coordination/session-engine.mjs:2885-2905`
- `src/runner/dispatch/assignment-policy.mjs:3-8, 132-563` (R4, R5), `assignment-runner.mjs:270-296, 1477-1520, 1628` (R5, R6), `cli.mjs:303, 855-890` (R5), `placement-policy.mjs` (R7), `config.mjs:39`, `transport.mjs` (R8)
- `src/setup/registrations.mjs:853`, `src/runner/dispatch/execution-contract.mjs:325-333` (R4)
- Tests: `dispatch.test.mjs` (`--work` plan có `governance.egress`; global executor cross-provider không `allowCrossProvider` → unavailable), new `policy-patch-fields.test.mjs` (table-driven: mọi key sống sót merge), `dispatch-policy-baseline-snapshot.test.mjs` thêm fixture `--work` + `decide <unregistered>`, `assignment-policy.test.mjs` provenance mọi field

## Steps

1. `impact` cho `compileDispatchPlan`, `resolveExecutorAndOverrides`, `resolveExecutorConfig`, `mergePolicyStack`, `resolveAssignmentDispatchPolicy`, `deriveProviderFamily`.
2. R3 (nhỏ, độc lập) → R1 → R2 (theo D1) → R4 → R5 → R6 → R7 → R8.
3. Docs: control-plane §PolicyPatch (precedence thật, allow-list), §DispatchPlan (partial → implemented sau R1), §Merge rules (override exception), §Component-Outer (cohort-planner).

## Validation

Test gaps #7, #13 (part), #14 (part) xanh; `dispatch-policy-baseline-snapshot` không đổi ngoài fixture mới.

## Risk / rollback

R2 đổi hành vi public `decide` — ghi CHANGELOG `[Unreleased]`. R4 rename param có alias. R5 chạm 125 fixture phụ thuộc default `claude` (ghi ở `assignment-policy.mjs:389-405`) — chỉ sửa hai site runner không nằm trong fixture path trước; site resolver để sau khi fixture cập nhật. Rollback từng R.
