---
phase: 7
title: "Đường coordination dùng bind()"
status: pending
priority: P1
effort: "1.5d"
dependencies: [5]
---

# Phase 7: Đường coordination dùng `bind()`

## Overview

Engine coordination vẫn chạy tới P4. Để G6 và "đúng người" đúng ngay hôm nay trên mọi đường, cho engine chọn người qua **`bind()`** và xoá các nơi quyết executor/persona cũ (A1 phần L4/L5). Không đầu tư thêm tính năng cho engine (bài học §7c).

## Requirements

- Functional:
  - `binding.mjs` (`bindOperations`): mỗi actor/operation gọi `bind()` (capability = `policy.capability` hoặc suy ra; role; readOnly theo `mutation`; independentOf theo `distinctProviderFrom`), gắn `provenance.binding` vào assignment (để qua cổng mutating mới của phase 5).
  - Xoá: tham số `facts` chết (F7) và nhánh `facade-primary`; `preferExecutor`/`preferInvocation` khỏi PolicyPatch portable (schema cho qua, runtime chặn — bỏ hẳn khỏi schema); `executors.<id>.for` + nhánh `capability.for` trong `resolve.mjs` (F14); mặc định `runner.executor.command ?? 'claude'` (`assignment-policy.mjs` ~290); persona mặc định `'code-reviewer'` (`assignment-policy.mjs` ~388-391); `preferPersona`; `feature.yaml:65 preferExecutor: claude`.
  - Override: `--executor`/`actors[]` của coordination được dịch thành `overrides[{scope:{role}}]` đưa vào `bind()` (một cơ chế; sống qua mọi bước — sửa F8).
  - Master loop YAML: bỏ 6 dòng `policy.capability` (khoá tra theo `domain:verb` của Unit/request); `distinctProviderFrom.strength: required` cho review/red-team của output ghi file (D7, tường minh trong YAML — không đổi lặng lẽ ở dispatch, X ràng buộc 9); red-team của code giữ bắt buộc (Q4).
  - Giữ mọi test engine xanh (hành vi chọn người đổi theo khẩu vị là có chủ đích; cập nhật kỳ vọng test có ghi lý do).
- Non-functional: không thêm field/khái niệm mới vào engine.

## Architecture

```text
engine operation ─► bindOperations ─► bind(ask, ctx)  (một chỗ)
                                └► provenance.binding ─► assignment ─► executeAssignment (cổng phase 5)
```

## Related Code Files

- Modify: `src/verbs/coordination/binding.mjs`, `src/verbs/coordination/composers.mjs`, `src/verbs/coordination/run.mjs` (actorPolicyFields → overrides), `src/runner/dispatch/assignment-policy.mjs`, `src/runner/dispatch/resolve.mjs`, `src/runner/definitions/schema.mjs` (PolicyPatch), `src/runner/coordination/session-engine.mjs` (chỉ chỗ guard `assertNoPortableExecutorPin` nếu thành thừa), `core/coordination-protocols/standalone-master-coordination-loop.yaml`, `domains/coding/workflows/feature.yaml`, `.fgos/config.json` (xoá `executors.*.for`)
- Tests: `test/verbs/coordination-*binding*.test.mjs`, `test/runner/assignment-policy.test.mjs`, `test/runner/dispatch-coordination-role-tiers.test.mjs`, conformance group-thinking/architecture panel

## Implementation Steps

1. GitNexus `impact`: `bindOperations`, `withComputedActorBindings`, `resolveAssignmentDispatchPolicy`, `resolveExecutorIdForPurpose`.
2. Test trước: operation review của master loop ra claude (khẩu vị `code:review`) khác provider với doer; override `--executor` sống qua revise/recheck; config còn `executors.*.for` → lỗi có hướng dẫn; PolicyPatch có `preferExecutor` → lỗi validate.
3. Sửa; xoá các nơi cũ; cập nhật test kỳ vọng.
4. Coordination + dispatch suite xanh → commit → merge vào nhánh plan.

## Success Criteria

- [ ] Engine chọn người chỉ qua `bind()`; mọi assignment engine có `provenance.binding`.
- [ ] `rg "preferExecutor|preferPersona|executors\.[a-z-]+\.for|'code-reviewer'|command \?\? 'claude'" src core domains .fgos/config.json` rỗng (trừ thông báo lỗi hướng dẫn).
- [ ] `strength: required` cho review/red-team output ghi file trong master loop.

## Risk Assessment

- Đổi chọn người làm test engine đỏ hàng loạt → kỳ vọng mới phải khớp khẩu vị config, không sửa code cho khớp kỳ vọng cũ.
- Project khác dựa `executors.*.for` → fail-fast + doctor (T D11 cùng chính sách).
