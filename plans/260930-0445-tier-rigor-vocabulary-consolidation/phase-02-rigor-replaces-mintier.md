---
phase: 2
title: "rigor thay minTier; bảng rigorToTier; xoá quality bridge"
status: pending
priority: P1
effort: "1.5d"
dependencies: [1]
---

# Phase 2: rigor thay minTier

## Overview

Đưa `rigor` (`low|standard|high|critical`) thành **từ duy nhất ở bên cầu**:
- nó thay `minTier` trong mọi FlowDefinition/workflow YAML (D1);
- tier được suy ra qua **một** bảng config `runner.rigorToTier`.

Trong cùng phase, xoá quality bridge (`minRigor`, `mode`, `QUALITY_TIER_BRIDGE`, `QUALITY_MODE_VALUES`). Bảng cầu `DEFAULT_TIER_TO_POLICY` và liên kết `size → model` (D7) **không** thuộc phase này: chúng bị xoá ở [phase 3](./phase-03-work-size-and-rigor.md), cùng lúc Work có `rigor`. Nếu xoá ở đây thì Work dispatch sẽ gãy giữa chừng.

## Requirements

- Functional:
  - `POLICY_PATCH_FIELDS` (`src/runner/definitions/schema.mjs:145`): bỏ `minTier`, thêm `rigor`, giữ luật merge **chỉ-nâng** qua các scope (thay `MIN_TIER_RANK` bằng thứ hạng rigor). YAML còn `minTier` → lỗi validate kèm hướng dẫn đổi.
  - `runner.rigorToTier` là khoá config bắt buộc. Mặc định cài bởi `fgos setup` và được `fgos doctor` kiểm (install gate trong `AGENTS.md`): `{low: nano, standard: standard, high: flagship, critical: frontier}`.
  - Resolver trong `assignment-policy.mjs`:
    - `tier = max(rigorToTier[rigor], explicitTier)`, trong đó `explicitTier` đến từ `--tier` hoặc `actors[].tier` và chỉ được nâng;
    - rigor mặc định khi không scope nào khai: `standard`;
    - provenance ghi `{rigor, rigorSource, tier, tierSource}`.
  - Xoá `minRigor`, `mode`, `QUALITY_TIER_BRIDGE`, `QUALITY_MODE_VALUES`, `MIN_RIGOR_VALUES` (thay bằng `RIGOR_VALUES` duy nhất), và mọi field provenance tương ứng.
  - Đường Work (`loop.mjs`, `execute --tier light|standard|heavy`) giữ nguyên trong phase này, vẫn đi qua bridge tạm thời trong `resolveTierModel`; [phase 3](./phase-03-work-size-and-rigor.md) xử lý.
  - DemandFacts `rigor` hết là "pass-through". Doctrine (`core/skills/_shared/capability-matching.md`) ghi rằng nó là cùng một trường với `rigor` trên step/unit.
- Non-functional:
  - Map giá trị YAML hiện có: `nano → low`, `standard → standard`, `flagship → high`, `frontier → critical`. Một chỗ `advanced` (`group-cognition-framework.yaml:169`, step `divergent-exploration`, vai `explorer`) → `rigor: standard` (owner chốt 2026-09-30). Hệ quả: claude giữ nguyên sonnet (`advanced` = `standard` ở claude); gemini từ flash-high về flash-medium. Cần mạnh hơn thì override một lần bằng `actors[].tier`.
  - Với bảng `rigorToTier` mặc định, mọi step hiện có ra **cùng tier** như trước, trừ đúng step `divergent-exploration` nói trên.

## Architecture

```text
step.policy.rigor ─┐ (merge chỉ-nâng qua definition→operation→role→actor→assignment)
unit/DemandFacts ──┘
        │
runner.rigorToTier[rigor] ──max── explicit --tier / actors[].tier
        │
resolveTierModel(cfg, tier, executors.<id>.providerModel)   ← phase 1
```

## Related Code Files

- Modify (schema/runtime): `src/runner/definitions/schema.mjs`, `src/runner/definitions/workflow-adapter.mjs`, `src/runner/dispatch/assignment-policy.mjs`, `src/runner/dispatch/assignment.mjs`, `src/runner/dispatch/plan.mjs`, `src/runner/dispatch/execution-contract.mjs`, `src/runner/dispatch/config.mjs`, `src/runner/dispatch/resolve.mjs`, `src/runner/dispatch/cli.mjs`, `src/runner/coordination/cohort-planner.mjs`, `src/runner/coordination/session-engine.mjs`, `src/verbs/coordination/run.mjs`, `src/verbs/coordination/binding.mjs`, `src/verbs/coordination/composers.mjs`, `src/runner/capability-match.mjs`
- Modify (setup/doctor): `src/setup/registrations.mjs` (default `rigorToTier`, doctor check; các check đang đọc `minTier`/`MODEL_POLICY_TIERS`)
- Modify (dữ liệu): 13 file `core/coordination-protocols/*.yaml`, `domains/coding/workflows/feature.yaml`, `.fgos/config.json`, `~/.fgos/config.json`
- Modify (doctrine/skill; sửa ở nguồn rồi `npm run build:skills`): `core/skills/_shared/capability-matching.md`, `core/skills/fgos-architecture-panel/SKILL.md`, cùng mọi SKILL/reference khác mà `rg -l minTier core domains` tìm thấy
- Tests cập nhật (tối thiểu): `test/runner/flow-definition-schema.test.mjs`, `test/runner/assignment-policy.test.mjs`, `test/runner/assignment-provenance.test.mjs`, `test/runner/dispatch-coordination-role-tiers.test.mjs`, `test/runner/execution-contract.test.mjs`, `test/runner/effective-execution-contract.test.mjs`, `test/runner/cohort-planner.test.mjs`, `test/runner/flow-definition-workflow-adapter.test.mjs`, `test/runner/flow-definition-standalone-master-coordination-loop.test.mjs`, `test/runner/group-cognition-framework.test.mjs`, các test conformance của group-thinking/architecture panel, `test/setup/registrations.test.mjs`, `test/state/workflow-stage-graphs.test.mjs`, `test/runner/loop.test.mjs`, và fixture `test/fixtures/run-result/real-shapes/*.json` chứa `minRigor`/`minTier`

## Implementation Steps

1. Mở worktree phase từ đầu nhánh plan (đã chứa phase 1). `impact` upstream cho `validatePolicyPatch`/`mergePolicyStack` (`schema.mjs`), hàm resolver chính trong `assignment-policy.mjs`, `QUALITY_TIER_BRIDGE`.
2. **Bảng đối chiếu trước khi sửa:** liệt kê mọi step có `minTier` (60 chỗ) cùng tier hiện tại, và tier mới qua `rigorToTier` mặc định. Chênh lệch nào không phải chỗ `advanced` thì dừng lại, không tiếp tục.
3. Sửa schema: thêm `RIGOR_VALUES`, merge chỉ-nâng, từ chối `minTier`. Viết test trước cho: merge nâng, merge hạ bị từ chối, `minTier` bị từ chối kèm hướng dẫn.
4. Sửa resolver: `rigorToTier` + explicit tier; xoá quality bridge; cập nhật provenance.
5. (Không đụng đường Work: để dành cho phase 3.)
6. Đổi toàn bộ YAML bằng script một lần (không commit script), rồi đọc lại diff từng file.
7. Thêm `rigorToTier` vào `.fgos/config.json`, global config, và default của `fgos setup`; thêm doctor check thiếu hoặc sai `rigorToTier`.
8. Cập nhật doctrine và skill ở nguồn; chạy `npm run build:skills`.
9. Bổ sung vào `dead-vocabulary-guard.test.mjs`: `minTier`, `minRigor`, `QUALITY_TIER_BRIDGE`, `QUALITY_MODE_VALUES`, `MIN_RIGOR_VALUES`, `MIN_TIER_VALUES`.
10. Chạy focused tests + `npm run test:related` với `env -u CLAUDE_CODE_SESSION_ID`. Xanh thì commit, merge `--no-ff` vào nhánh plan, chạy lại focused tests trên nhánh plan.

## Success Criteria

- [ ] `rg -n "minTier|minRigor|QUALITY_TIER_BRIDGE|QUALITY_MODE_VALUES|MIN_RIGOR_VALUES|MIN_TIER_VALUES" src bin core domains .fgos/config.json` → rỗng.
- [ ] Bảng đối chiếu ở bước 2 cho thấy 0 thay đổi tier, ngoài step `divergent-exploration` đã được owner duyệt.
- [ ] YAML chứa `minTier` → lỗi validate có hướng dẫn (có test).
- [ ] Provenance của assignment có `rigor/rigorSource/tier/tierSource` (có test).
- [ ] `fgos doctor` báo được trường hợp thiếu `rigorToTier`; `fgos setup` ghi default.
- [ ] Guard test xanh; focused tests xanh; đã merge vào nhánh plan.

## Risk Assessment

- **Thang 4 mức rigor mất độ mịn của 6 mức tier** (`mini`, `advanced` không có rigor tương ứng). Tín hiệu: owner muốn một bước dùng `advanced`. Xử lý: dùng override tier tường minh (`actors[].tier`) cho đúng lần đó. Nếu phải override lặp lại, đó là bằng chứng để mở rộng thang rigor, nhưng quyết định đó thuộc plan khác, không mở lại ở đây.
- **Fixture RunResult chứa `minRigor`** là dữ liệu lịch sử thật (real-shapes). Xử lý: nếu reader cũ chỉ bỏ qua field thì giữ fixture; chỉ sửa nếu validator mới từ chối, và ghi lý do vào báo cáo phase.
- **Rollback:** revert merge commit của phase trên nhánh plan.
