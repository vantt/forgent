---
phase: 2
title: "rigor thay minTier; bảng rigorToTier; xoá quality bridge"
status: in-progress
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
  - **Kênh override tier tường minh (thay `minTier` ở actor/cli):** hôm nay `actors[].tier` và `--tier` đi vào dispatch dưới dạng `minTier` của PolicyPatch scope actor (`src/verbs/coordination/run.mjs:118-142,204-224` → `session-engine.mjs:990,2647,2677-2681` → `cliOverride.minTier`, `assignment-policy.mjs:251,267`). Phase này thêm field `tier` vào `POLICY_PATCH_FIELDS`. Field này **chỉ hợp lệ** ở scope actor/assignment/cli (validator từ chối ở definition/operation/role), gộp theo luật chỉ-nâng, và đi qua đúng chuỗi trên thay cho `minTier`. Test end-to-end: `actors[{id:'explorer', tier:'advanced'}]` → `tierSource: actor`, ra model advanced. <!-- Updated: Red Team 2026-09-30 -->
  - **`policy.minTier` đã lưu** (37 file `.fgos/assignments/**`, 8 file `.fgos/coordination/**`, cohort planner `cohort-planner.mjs:466,622`, inline execution contract `execution-contract.mjs:228,363`): đọc thành `tier` tường minh ở **một** chỗ, lúc load assignment/contract. Không map sang `rigor`, vì `mini`/`advanced` không có rigor tương ứng. Cohort planner ghi `tier` (không ghi `minTier`) cho allocation. Session resume sau merge vẫn giữ đúng mức sàn (có test). <!-- Updated: Red Team 2026-09-30 -->
  - **Sàn theo loại việc `capabilities.<cap>.rigor` (D19, owner 2026-10-01):**
    - Config: capability entry nhận field `rigor` (`RIGOR_VALUES`); validator (`config.mjs`) **xoá** `CAPABILITY_OVERRIDE_FIELDS` và khối `overrides` (phase 1 đã bỏ `rigorOverrides`/`providerModel`; phase này bỏ nốt `tier`/`model`). Config còn `capabilities.*.overrides` → `RunnerConfigError` nêu khoá và cách thay (`overrides.tier` → `rigor` tương ứng).
    - Merge: là **một scope của bên cầu**, chỉ-nâng, cùng luật với step/unit: `rigor = max(step/unit rigor, capabilities[cap].rigor)`; provenance `rigorSource: capability` khi nó thắng.
    - Đường coordination: resolver lấy tên capability của operation — `policy.capability` đã khai, hoặc tên do `deriveOperationCapability` suy ra (`src/verbs/coordination/binding.mjs:89`); nếu tên suy ra chưa tới được `assignment-policy.mjs` thì truyền nó qua scope policy của operation (kiểm bằng test, không đoán).
    - Đường Work: `plan.mjs:397-400` bỏ `resolved.overrides.tier/.model`; lấy `capabilities[capability].rigor` gộp với `work.rigor` (phase 3) theo luật chỉ-nâng. Trong phase 2, Work vẫn qua bridge tạm (xem dòng dưới) — chỉ cần bỏ đọc `overrides`.
    - Doctor: check giá trị `capabilities.*.rigor` hợp lệ; check `capabilities.*.overrides` còn sót ở config project và global.
  - Resolver trong `assignment-policy.mjs`:
    - `tier = max(rigorToTier[rigor], explicitTier)`, trong đó `rigor` đã gộp sàn capability (D19), `explicitTier` đến từ `--tier` hoặc `actors[].tier` và chỉ được nâng;
    - rigor mặc định khi không scope nào khai: `standard`;
    - provenance ghi `{rigor, rigorSource, tier, tierSource, reasoningEffort}`;
    - `reasoningEffort` mặc định suy từ `rigor`, đổi tên `REASONING_EFFORT_DEFAULT_FROM_MIN_RIGOR` → `…_FROM_RIGOR` (cùng khoá `low…critical`, `assignment-policy.mjs:78-83,383`). Nâng tier tường minh **không** nâng effort; ghi rõ điều này trong spec. <!-- Updated: Red Team 2026-09-30 -->
  - Xoá `minRigor`, `mode`, `QUALITY_TIER_BRIDGE`, `QUALITY_MODE_VALUES`, `MIN_RIGOR_VALUES`, và mọi field provenance tương ứng. <!-- Updated: Validation Session 2 - RIGOR_VALUES đã tồn tại -->
  - `RIGOR_VALUES` **đã tồn tại** ở `src/runner/capability-match.mjs:30` (bản sao của `MIN_RIGOR_VALUES`). Gộp về đúng một hằng trong một module lá, để cả `schema.mjs`, `assignment-policy.mjs`, `capability-match.mjs` và `src/state/work.mjs` ([phase 3](./phase-03-work-size-and-rigor.md)) cùng import mà không tạo vòng import. Không khai thêm bản thứ ba.
  - Đường Work (`loop.mjs`, `execute --tier light|standard|heavy`) giữ nguyên trong phase này, vẫn đi qua bridge tạm thời trong `resolveTierModel`; [phase 3](./phase-03-work-size-and-rigor.md) xử lý.
  - DemandFacts `rigor`: `matchCapability` không có caller production (`capability-match.mjs:84-86,116`; `rg matchCapability src bin`), nên doctrine (`core/skills/_shared/capability-matching.md`) ghi rằng nó **chỉ để tư vấn chọn capability**, cùng thang giá trị với `rigor` trên step/unit. Dispatch đọc `rigor` của step/unit/Work, không đọc DemandFacts. Không vẽ mũi tên DemandFacts → dispatch trong spec. <!-- Updated: Red Team 2026-09-30 -->
- Non-functional:
  - Map giá trị YAML hiện có: `nano → low`, `standard → standard`, `flagship → high`, `frontier → critical`. Một chỗ `advanced` (`group-cognition-framework.yaml:169`, step `divergent-exploration`, vai `explorer`) → `rigor: standard` (owner chốt 2026-09-30). Hệ quả: claude giữ nguyên sonnet (`advanced` = `standard` ở claude); gemini từ flash-high về flash-medium. Cần mạnh hơn thì override một lần bằng `actors[].tier`.
  - Với bảng `rigorToTier` mặc định, mọi step hiện có ra **cùng tier** như trước, trừ đúng step `divergent-exploration` nói trên.

## Architecture

```text
step.policy.rigor ─┐ (merge chỉ-nâng qua definition→operation→role→actor→assignment)
unit (Work) ───────┤   (DemandFacts.rigor: chỉ tư vấn, không vào dispatch)
capabilities.<cap>.rigor ┘ (sàn theo loại việc, D19; rigorSource: capability)
        │
runner.rigorToTier[rigor] ──max── explicit --tier / actors[].tier
        │
resolveTierModel(cfg, tier, executors.<id>.providerModel)   ← phase 1
```

## Related Code Files

- Modify (schema/runtime): `src/runner/definitions/schema.mjs`, `src/runner/definitions/workflow-adapter.mjs`, `src/runner/dispatch/assignment-policy.mjs`, `src/runner/dispatch/assignment.mjs`, `src/runner/dispatch/plan.mjs`, `src/runner/dispatch/execution-contract.mjs`, `src/runner/dispatch/config.mjs`, `src/runner/dispatch/resolve.mjs`, `src/runner/dispatch/cli.mjs`, `src/runner/coordination/cohort-planner.mjs`, `src/runner/coordination/session-engine.mjs`, `src/verbs/coordination/run.mjs`, `src/verbs/coordination/binding.mjs`, `src/verbs/coordination/composers.mjs`, `src/runner/capability-match.mjs`
- Modify (setup/doctor): `src/setup/registrations.mjs` (default `rigorToTier`, doctor check; các check đang đọc `minTier`/`MODEL_POLICY_TIERS`; check `capabilities.*.rigor` hợp lệ và `capabilities.*.overrides` còn sót — D19)
- Modify (D19): `src/runner/dispatch/config.mjs` (xoá `CAPABILITY_OVERRIDE_FIELDS`/khối `overrides`, thêm `rigor` cho capability), `src/runner/dispatch/resolve.mjs` (`resolveExecutorAndOverrides` thôi trả `overrides`), `src/runner/dispatch/plan.mjs:397-400`, `src/runner/dispatch/cli.mjs:810-820`, `src/verbs/coordination/binding.mjs` (đưa tên capability suy ra tới policy nếu cần)
- Modify (dữ liệu): 13 file `core/coordination-protocols/*.yaml`, `domains/coding/workflows/feature.yaml`, `.fgos/config.json`, `~/.fgos/config.json`
- Modify (contract doc): `docs/platform/agent-coordination/contracts/flow-definition.md` và `docs/architect/agent-coordination/contracts/flow-definition.md` (mỗi file 9 chỗ `minTier`) <!-- Updated: Red Team 2026-09-30 -->
- Modify (doctrine/skill; sửa ở nguồn rồi `npm run build:skills`): `core/skills/_shared/capability-matching.md`, `core/skills/fgos-architecture-panel/SKILL.md`, cùng mọi SKILL/reference khác mà `rg -l minTier core domains` tìm thấy
- Tests cập nhật (tối thiểu): `test/runner/flow-definition-schema.test.mjs`, `test/runner/assignment-policy.test.mjs`, `test/runner/assignment-provenance.test.mjs`, `test/runner/dispatch-coordination-role-tiers.test.mjs`, `test/runner/execution-contract.test.mjs`, `test/runner/effective-execution-contract.test.mjs`, `test/runner/cohort-planner.test.mjs`, `test/runner/flow-definition-workflow-adapter.test.mjs`, `test/runner/flow-definition-standalone-master-coordination-loop.test.mjs`, `test/runner/group-cognition-framework.test.mjs`, các test conformance của group-thinking/architecture panel, `test/setup/registrations.test.mjs`, `test/state/workflow-stage-graphs.test.mjs`, `test/runner/loop.test.mjs`, và fixture `test/fixtures/run-result/real-shapes/*.json` chứa `minRigor`/`minTier`. Danh sách trên chưa đủ: hiện có 28 file test chứa `minTier` (`rg -l minTier test`); sửa hết theo kết quả `rg`, không theo danh sách này.

## Implementation Steps

1. Mở worktree phase từ đầu nhánh plan (đã chứa phase 1). `impact` upstream cho `validatePolicyPatch`/`mergePolicyStack` (`schema.mjs`), hàm resolver chính trong `assignment-policy.mjs`, `QUALITY_TIER_BRIDGE`.
2. **Bảng đối chiếu trước khi sửa:** liệt kê mọi step có `minTier` (60 chỗ) cùng tier hiện tại, và tier mới qua `rigorToTier` mặc định. Chênh lệch nào không phải chỗ `advanced` thì dừng lại, không tiếp tục.
3. Sửa schema: dùng `RIGOR_VALUES` đã gộp, merge chỉ-nâng, từ chối `minTier`. Viết test trước cho: merge nâng, merge hạ bị từ chối, `minTier` bị từ chối kèm hướng dẫn.
4. Sửa resolver: `rigorToTier` + explicit tier; xoá quality bridge; cập nhật provenance.
5. (Không đụng đường Work: để dành cho phase 3.)
6. Đổi toàn bộ YAML bằng script một lần (không commit script), rồi đọc lại diff từng file.
7. Thêm `rigorToTier` vào `.fgos/config.json`, global config, và default của `fgos setup`; thêm doctor check thiếu hoặc sai `rigorToTier`.
7b. **D19:** `impact` upstream cho `resolveExecutorAndOverrides` (`resolve.mjs:256`, trả `overrides`) và caller ở `plan.mjs`/`cli.mjs`. Viết test trước: (a) capability có `rigor: high`, step `standard` → tier flagship, `rigorSource: capability`; (b) step `critical` thắng sàn `high`; (c) config còn `capabilities.*.overrides` → lỗi có hướng dẫn; (d) sàn có hiệu lực cho operation **không** khai `policy.capability` (tên suy ra). Rồi xoá `CAPABILITY_OVERRIDE_FIELDS`/khối `overrides`, thêm field `rigor`, nối vào merge. Không khai giá trị `capabilities.*.rigor` nào trong config ở phase này (khẩu vị do owner khai sau; mặc định không có sàn → hành vi không đổi, giữ tiêu chí "0 thay đổi tier").
8. Cập nhật doctrine và skill ở nguồn; chạy `npm run build:skills`.
9. Bổ sung vào `dead-vocabulary-guard.test.mjs`: `minTier`, `minRigor`, `QUALITY_TIER_BRIDGE`, `QUALITY_MODE_VALUES`, `MIN_RIGOR_VALUES`, `MIN_TIER_VALUES`.
10. Chạy focused tests + `npm run test:related` với `env -u CLAUDE_CODE_SESSION_ID`. Xanh thì commit, merge `--no-ff` vào nhánh plan, chạy lại focused tests trên nhánh plan.

## Success Criteria

- [ ] `rg -n "minTier|minRigor|QUALITY_TIER_BRIDGE|QUALITY_MODE_VALUES|MIN_RIGOR_VALUES|MIN_TIER_VALUES" src bin core domains .fgos/config.json` → rỗng.
- [ ] Bảng đối chiếu ở bước 2 cho thấy 0 thay đổi tier, ngoài step `divergent-exploration` đã được owner duyệt.
- [ ] YAML chứa `minTier` → lỗi validate có hướng dẫn (có test).
- [ ] Provenance của assignment có `rigor/rigorSource/tier/tierSource` (có test).
- [ ] `capabilities.<cap>.rigor` nâng được tier ở cả operation khai và không khai `policy.capability`; `capabilities.*.overrides` bị từ chối kèm hướng dẫn; `rg -n "CAPABILITY_OVERRIDE_FIELDS|overrides\.(tier|model)" src` → rỗng (D19, có test).
- [ ] `fgos doctor` báo được trường hợp thiếu `rigorToTier`; `fgos setup` ghi default.
- [ ] Guard test xanh; focused tests xanh; đã merge vào nhánh plan.

## Risk Assessment

- **Thang 4 mức rigor mất độ mịn của 6 mức tier** (`mini`, `advanced` không có rigor tương ứng). Tín hiệu: owner muốn một bước dùng `advanced`. Xử lý: dùng override tier tường minh (`actors[].tier`) cho đúng lần đó. Nếu phải override lặp lại, đó là bằng chứng để mở rộng thang rigor, nhưng quyết định đó thuộc plan khác, không mở lại ở đây.
- **Fixture RunResult chứa `minRigor`** là dữ liệu lịch sử thật (real-shapes). Xử lý: nếu reader cũ chỉ bỏ qua field thì giữ fixture; chỉ sửa nếu validator mới từ chối, và ghi lý do vào báo cáo phase.
- **Rollback:** revert merge commit của phase trên nhánh plan.
