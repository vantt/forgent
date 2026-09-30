---
phase: 1
title: "Một resolver tier→model; xoá cầu nối, rigorOverrides, shadow"
status: pending
priority: P1
effort: "1.5d"
dependencies: []
---

# Phase 1: Một resolver tier→model

## Overview

Gom mọi phép "tier → model" về **một hàm duy nhất** đọc `modelPolicies[provider][tier]`. Trong cùng phase, xoá bảng legacy `runner.models`, `rigorOverrides` (dời giá trị vào `modelPolicies`), `providerModel` ở tầng capability, và toàn bộ phần shadow của PlacementPolicy (tính model hai lần rồi so sánh).

## Requirements

- Functional:
  - Một hàm `resolveTierModel(cfg, tier, provider)` trong `src/runner/dispatch/resolve.mjs`. Nó là nơi duy nhất đọc `modelPolicies`, và chỉ nhận tier thuộc `nano|mini|standard|advanced|flagship|frontier`.
  - Mọi caller hiện có chuyển sang gọi hàm này: `modelForTier`, `resolvePolicyTierModel`, `policyTierForDispatchTier` (`plan.mjs:26`), `policyTierForWorkTier` (`placement-policy.mjs:80`), `resolveVerifiedPlacementModel` (`cli.mjs:313`, `cli.mjs:833`), `assignment-runner.mjs:266`, `assignment-policy.mjs:466`.
  - `provider` chỉ lấy từ `executors.<id>.providerModel` (D6).
  - Đường Work/`execute --tier` vẫn nhận `light|standard|heavy` **tạm thời** qua `DEFAULT_TIER_TO_POLICY`. Bảng này được gọi đúng một lần, ở đầu `resolveTierModel`, và bị xoá ở phase 2 khi có `rigor` (D7). Không nơi nào khác được đọc nó.
- Non-functional:
  - Mọi model thật đang chạy giữ nguyên, trừ các chỗ `rigorOverrides` đổi model. Những chỗ đó được dời vào `modelPolicies` sao cho kết quả không đổi (bảng đối chiếu ở bước 2).
  - Config chứa `runner.models`, `executors.*.rigorOverrides`, `capabilities.*.overrides.rigorOverrides` hoặc `capabilities.*.overrides.providerModel` → `RunnerConfigError`, nêu rõ khoá và cách thay.

## Architecture

```text
trước:  modelForTier ─┐  resolvePolicyTierModel ─┐  policyTierForDispatchTier ─┐  policyTierForWorkTier ─┐
        (models flat) │  (modelPolicies)         │  (rigorOverrides + bridge)  │  (bản sao)             │
        resolveVerifiedPlacementModel: tính lại lần 2 và so sánh (shadow)
sau:    resolveTierModel(cfg, tier, provider) → modelPolicies[provider][tier]
```

Các hàm bị xoá khỏi `placement-policy.mjs`: `PLACEMENT_POLICY_SHADOW_CONTRACT`, `buildPlacementPolicyCandidate`, `evaluatePlacementPolicyShadow`, `resolveVerifiedPlacementModel`, `policyTierForWorkTier`. Hàm `recordShadowBinderDivergence` vẫn còn một caller cho argv binder (`transport.mjs:51`, không thuộc phạm vi plan này), nên nó được **dời** sang `provider-adapter.mjs`, cạnh `resolveVerifiedProviderArgs`. Phần redirect còn lại của `placement-policy.mjs` bị xoá ở phase 3.

## Related Code Files

- Modify: `src/runner/dispatch/resolve.mjs`, `src/runner/dispatch/plan.mjs`, `src/runner/dispatch/cli.mjs`, `src/runner/dispatch/assignment-runner.mjs`, `src/runner/dispatch/assignment-policy.mjs`, `src/runner/dispatch/config.mjs` (validator: bỏ `validateRigorOverridesShape`, bỏ `rigorOverrides`/`providerModel` khỏi `CAPABILITY_OVERRIDE_FIELDS`, từ chối `models`), `src/runner/dispatch/provider-adapter.mjs`, `src/runner/dispatch/transport.mjs`, `src/runner/dispatch.mjs` (barrel), `src/runner/loop.mjs`
- Modify: `src/setup/executor-profile-warnings.mjs` (xoá các cảnh báo `rigorOverrides`, vì validator đã từ chối), `src/setup/registrations.mjs` (entry check Phase 06 liên quan `rigorOverrides`)
- Modify config: `.fgos/config.json`, `~/.fgos/config.json` (global; sửa tay, ghi diff vào báo cáo phase)
- Delete: phần shadow trong `src/runner/dispatch/placement-policy.mjs`; `test/runner/placement-policy-matrix-coverage.test.mjs` và các case shadow trong `test/runner/placement-policy.test.mjs`
- Tests cập nhật (tối thiểu): `test/runner/dispatch.test.mjs`, `test/runner/assignment-policy.test.mjs`, `test/runner/dispatch-policy-baseline-snapshot.test.mjs`, `test/runner/dispatch-executor-profile.test.mjs`, `test/runner/provider-adapter.test.mjs`, `test/runner/loop.test.mjs`, `test/setup/executor-profile-warnings.test.mjs`, cùng các fixture chứa `"models"`/`rigorOverrides` (`rg -l -e 'rigorOverrides|"models"' test`)

## Implementation Steps

1. Mở worktree phase (xem [plan.md](./plan.md) § Quy trình thực thi). Chạy `node .gitnexus/run.cjs analyze`, rồi `impact` upstream cho `modelForTier`, `resolvePolicyTierModel`, `policyTierForDispatchTier`, `resolveVerifiedPlacementModel`, `buildPlacementPolicyCandidate`. Ghi blast radius vào báo cáo phase.
2. **Bảng dời `rigorOverrides`** (ghi vào báo cáo trước khi sửa config):
   - Với mỗi executor có `rigorOverrides` (project: `glm` → `z-ai`, `gemini` → `gemini`; global: `pi`), tính model thật mà mỗi tổ hợp (tier đầu vào → override → `modelPolicies`) đang cho ra.
   - Ghi lại `modelPolicies.<provider>` sao cho cùng tier đầu vào cho ra cùng model, không cần override.
   - **Nếu hai executor dùng chung một provider nhưng có override khác nhau**, không thể diễn đạt bằng `modelPolicies`. Khi đó dừng lại, báo owner, không tự chọn.
3. Viết `resolveTierModel` cùng unit test: tier hợp lệ; tier lạ → lỗi; provider thiếu bảng → lỗi; chuỗi `light|standard|heavy` đi qua bridge tạm thời.
4. Chuyển từng caller sang `resolveTierModel`; xoá `modelForTier`, `resolvePolicyTierModel`, `policyTierForDispatchTier`, `policyTierForWorkTier`, và nhánh fallback `cfg.models`.
5. Xoá phần shadow trong `placement-policy.mjs`; dời `recordShadowBinderDivergence` sang `provider-adapter.mjs`; sửa import ở `cli.mjs` và `transport.mjs`.
6. Sửa validator để từ chối các khoá đã chết. Thông báo lỗi phải chỉ rõ cách thay, ví dụ: `"executors.gemini.rigorOverrides was removed; express per-tier models in runner.modelPolicies.gemini"`.
7. Sửa `.fgos/config.json` và `~/.fgos/config.json` theo bảng ở bước 2; xoá `runner.models` ở global config.
8. Tạo `test/runner/dead-vocabulary-guard.test.mjs`. Test quét `src/`, `bin/`, `core/`, `domains/`, `.fgos/config.json` và fail khi gặp `rigorOverrides`, `resolvePolicyTierModel`, `modelForTier`, `PLACEMENT_POLICY_SHADOW`, `buildPlacementPolicyCandidate`, `runner.models`. Phase 2 và 3 sẽ bổ sung thêm từ.
9. Chạy focused tests (danh sách ở Related Code Files, cộng `npm run test:related`) với `env -u CLAUDE_CODE_SESSION_ID`. Xanh thì commit ngay, merge `--no-ff` vào nhánh plan, rồi chạy lại focused tests trên nhánh plan.

## Success Criteria

- [ ] `rg -n "modelForTier|resolvePolicyTierModel|policyTierForDispatchTier|policyTierForWorkTier|rigorOverrides|resolveVerifiedPlacementModel|buildPlacementPolicyCandidate|evaluatePlacementPolicyShadow|PLACEMENT_POLICY_SHADOW" src bin core domains .fgos/config.json` → rỗng.
- [ ] `DEFAULT_TIER_TO_POLICY` chỉ còn được đọc ở một chỗ, trong `resolveTierModel`.
- [ ] Bảng đối chiếu model trước/sau (bước 2) cho thấy không có tổ hợp executor × tier nào đổi model, trừ những chỗ owner duyệt.
- [ ] Config có khoá đã chết → lỗi có hướng dẫn (có test).
- [ ] `dead-vocabulary-guard.test.mjs` xanh; focused tests xanh; đã merge vào nhánh plan.

## Risk Assessment

- **Hai executor chung provider nhưng override khác nhau.** Tín hiệu: bảng ở bước 2 có xung đột. Xử lý: dừng lại và hỏi owner; không thêm lại một lớp override.
- **Global config của project khác chứa khoá đã chết.** Tín hiệu: lỗi validate khi chạy fgOS ở project đó. Xử lý: thông báo lỗi có hướng dẫn; doctor liệt kê (phase 4). Không viết code tự migrate (câu hỏi mở 4 trong [plan.md](./plan.md)).
- **Test snapshot baseline (`dispatch-policy-baseline-snapshot`) mã hoá hành vi shadow.** Xử lý: cập nhật snapshot. Trước khi commit, diff `--stat` và đọc lại để chắc chỉ phần shadow/model đổi (memory `feedback_diff_before_committing_regenerated_baseline.md`).
- **Rollback:** revert merge commit của phase trên nhánh plan; `main` không bị ảnh hưởng cho tới phase 4.
