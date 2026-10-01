---
phase: 7
title: "Engine + dispatch decide + hook dùng bind()"
status: pending
priority: P1
effort: "2d"
dependencies: [5]
---

# Phase 7: Engine + `dispatch decide` + hook dùng `bind()`

## Overview

Một nơi chọn người/cơ chế cho **mọi** đường còn sống: engine coordination (vẫn chạy tới P4), `fgos dispatch decide`, hook PreToolUse. Xoá các nơi quyết executor/persona cũ (A1 phần L4/L5). Không đầu tư thêm tính năng cho engine.

## Requirements

- Functional:
  - **Engine**: `bindOperations` (`binding.mjs`) gọi `bind()` cho mỗi actor/operation (capability = `policy.capability` đã khai; role; readOnly theo `mutation`; `independentOf` theo `distinctProviderFrom`); engine vẫn dùng **protocol stamp** cho cổng mutating (ngoại lệ tới P4).
  - **Giữ** 6 dòng `policy.capability` của `standalone-master-coordination-loop.yaml` (nguồn capability duy nhất còn lại của engine — red-team mục 9). Chỉ xoá tham số `facts` (không producer: đã kiểm `start.mjs`, `actions.mjs`, `launch-master-loop.mjs`) + nhánh `facade-primary`.
  - `distinctProviderFrom.strength: required` cho review/red-team của output ghi file — **khai tường minh trong YAML** (D7), không đổi lặng lẽ ở dispatch (X ràng buộc 9). Red-team code giữ bắt buộc (Q4).
  - **Xoá**: `preferExecutor`/`preferInvocation`/`preferPersona` khỏi PolicyPatch + mọi consumer (~40 file theo đếm phase 1, gồm `execution-contract.mjs`, `plan.mjs`, `cli.mjs`, `recovery.mjs`, `cohort-planner.mjs`, `verbs/coordination/schema.mjs`, `registrations.mjs`, test); `executors.<id>.for` + nhánh `capability.for` (`resolve.mjs`, `plan.mjs:300,310`, `tool-registry.mjs:105`, `registrations.mjs:2057`, 8 entry config); mặc định `'claude'` (`assignment-policy.mjs:294`); persona mặc định `'code-reviewer'` (`assignment-policy.mjs:389-390`); `feature.yaml:65 preferExecutor`.
  - Override coordination (`--executor`, `actors[]`) dịch thành `overrides[{scope:{role}, origin:'human-cli'}]` đưa vào `bind()`, sống qua mọi bước (sửa F8).
  - **`dispatch decide`** (`src/verbs/dispatch/**`) trả `mechanism` từ `bind()` (tái dùng `mechanism.mjs` — không còn logic thứ hai); **hook** `scripts/dispatch-decide-hook.mjs` (`.claude/settings.json:56-64`) giữ hành vi chặn, nguồn = `bind()`.
  - **`AGENTS.md` § Dispatch** viết lại cho khớp (decide = `bind()`; `fgos run` là cửa chạy cho việc mới; herdr mặc định — G7) — cùng phase với thay đổi `decide`.
- Non-functional: không thêm field/khái niệm vào engine; test engine xanh (kỳ vọng chọn người đổi theo khẩu vị là có chủ đích, ghi lý do).

## Related Code Files

- Modify: `src/verbs/coordination/binding.mjs`, `composers.mjs`, `run.mjs`, `schema.mjs`; `src/runner/dispatch/assignment-policy.mjs`, `resolve.mjs`, `plan.mjs`, `execution-contract.mjs`, `cli.mjs` (chỉ phần PolicyPatch/`for`), `recovery.mjs`; `src/runner/coordination/cohort-planner.mjs` (chỉ PolicyPatch); `src/runner/definitions/schema.mjs`; `src/state/tool-registry.mjs` (chỉ `for` — báo P3 vì là L3); `src/verbs/dispatch/**`; `scripts/dispatch-decide-hook.mjs`; `AGENTS.md`; `core/coordination-protocols/standalone-master-coordination-loop.yaml` (chỉ `strength`); `domains/coding/workflows/feature.yaml`; `.fgos/config.json`; test tương ứng
- Không sửa: `assignment-runner.mjs` (thuộc phase 6)

## Implementation Steps

1. GitNexus `impact`: `bindOperations`, `withComputedActorBindings`, `resolveAssignmentDispatchPolicy`, `resolveExecutorIdForPurpose`, hàm `decide`.
2. Test trước: master loop review ra claude (khẩu vị `code:review`) khác provider với doer; override `--executor` sống qua revise/recheck; `decide --for <cap>` == `bind()` trên bảng K1–K6; hook chặn đúng; config còn `executors.*.for` / PolicyPatch còn `preferExecutor` → lỗi có hướng dẫn.
3. Sửa; xoá; cập nhật test kỳ vọng; AGENTS.md.
4. Suite coordination + dispatch → commit → merge nhánh plan.

## Success Criteria

- [ ] Engine, `decide`, hook chọn qua `bind()`; một luật cơ chế (`mechanism.mjs`).
- [ ] `rg "preferExecutor|preferInvocation|preferPersona|executors\.[a-z-]+\.for|'code-reviewer'" src core domains .fgos/config.json` rỗng (trừ thông báo lỗi hướng dẫn); `facts` không còn.
- [ ] Master loop còn `policy.capability`; `strength: required` cho review/red-team output ghi file.

## Risk Assessment

- Đổi chọn người làm test engine đỏ hàng loạt → kỳ vọng mới theo khẩu vị; không sửa code cho khớp kỳ vọng cũ.
- Project khác dựa `executors.*.for` → fail-fast + doctor (cùng chính sách T D11).
