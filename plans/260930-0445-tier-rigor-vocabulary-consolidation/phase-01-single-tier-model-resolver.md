---
phase: 1
title: "Một resolver tier→model; xoá cầu nối, rigorOverrides, shadow"
status: done
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
  - `provider` suy ra qua **một** hàm `deriveProviderFamily(executor)` (`resolve.mjs:109-117`: `providerModel` → `provider` → suy từ command). Không dùng "chỉ từ `providerModel`" theo nghĩa đen, vì executor `claude` (project) và executor mặc định (global `runner.executor`) không khai `providerModel`, và mọi dispatch claude sẽ lỗi. Xoá các kênh provider khác: `capabilities.*.overrides.providerModel` (D6), `cliOverride.providerModel`, `opPolicy.providerModel`, và `overrides.providerModel` tổng hợp ở `plan.mjs:397`. <!-- Updated: Red Team 2026-09-30 -->
  - Đường Work/`execute --tier` vẫn nhận `light|standard|heavy` **tạm thời** qua `DEFAULT_TIER_TO_POLICY`. Bảng này được gọi đúng một lần, ở đầu `resolveTierModel`, và bị xoá ở [phase 3](./phase-03-work-size-and-rigor.md) khi Work có `size` + `rigor` (D7). Không nơi nào khác được đọc nó.
- Non-functional:
  - Mọi model thật đang chạy giữ nguyên, trừ các chỗ `rigorOverrides` đổi model. Những chỗ đó được dời vào `modelPolicies` sao cho kết quả không đổi (bảng đối chiếu ở bước 2). Ngoại lệ đã được owner duyệt: override của gemini bị xoá mà không dời (D15, bước 2).
  - Config chứa `runner.models`, `executors.*.rigorOverrides`, `capabilities.*.overrides.rigorOverrides` hoặc `capabilities.*.overrides.providerModel` → `RunnerConfigError`, nêu rõ khoá và cách thay.

## Architecture

```text
trước:  modelForTier ─┐  resolvePolicyTierModel ─┐  policyTierForDispatchTier ─┐  policyTierForWorkTier ─┐
        (models flat) │  (modelPolicies)         │  (rigorOverrides + bridge)  │  (bản sao)             │
        resolveVerifiedPlacementModel: tính lại lần 2 và so sánh (shadow)
sau:    resolveTierModel(cfg, tier, provider) → modelPolicies[provider][tier]
```

Các hàm bị xoá khỏi `placement-policy.mjs`: `PLACEMENT_POLICY_SHADOW_CONTRACT`, `buildPlacementPolicyCandidate`, `evaluatePlacementPolicyShadow`, `resolveVerifiedPlacementModel`, `policyTierForWorkTier`. Hàm `recordShadowBinderDivergence` vẫn còn một caller cho argv binder (`transport.mjs:51`, không thuộc phạm vi plan này), nên nó được **dời** sang `provider-adapter.mjs`, cạnh `resolveVerifiedProviderArgs`. Phần redirect còn lại của `placement-policy.mjs` (và `readOnlyRedirects`) được **giữ nguyên** trong plan này; plan follow-on [`260930-1235-readonly-invocation-redesign`](../260930-1235-readonly-invocation-redesign/plan.md) sẽ xoá (D17). Redirect vẫn tính model qua `policyForActualExecutor` (`assignment-runner.mjs:255-266`), nên chuyển nó sang `resolveTierModel`. <!-- Updated: Red Team 2026-09-30 -->

## Related Code Files

- Modify: `src/runner/dispatch/resolve.mjs`, `src/runner/dispatch/plan.mjs`, `src/runner/dispatch/cli.mjs`, `src/runner/dispatch/assignment-runner.mjs`, `src/runner/dispatch/assignment-policy.mjs`, `src/runner/dispatch/config.mjs` (validator: bỏ `validateRigorOverridesShape`, bỏ `rigorOverrides`/`providerModel` khỏi `CAPABILITY_OVERRIDE_FIELDS`, từ chối `models`), `src/runner/dispatch/provider-adapter.mjs`, `src/runner/dispatch/transport.mjs`, `src/runner/dispatch.mjs` (barrel), `src/runner/loop.mjs`
- Modify: `scripts/project-agents.mjs` (import `modelForTier` ở dòng 35; `readRunnerModels` dòng 84-92 map `model_tier` của `core/agents/*.yaml` → model) và `test/scripts/project-agents.test.mjs`. Phase 1 chuyển script sang `resolveTierModel`; [phase 3](./phase-03-work-size-and-rigor.md) đổi `model_tier: light|standard` trong 7 file `core/agents/*.yaml` thành `rigor`, và bỏ fallback `DEFAULT_MODELS` im lặng trong `catch {}`. <!-- Updated: Red Team 2026-09-30 -->
- Modify: `core/skills/_shared/executor-dispatch-fallback.md` (dòng 224, 309 còn `modelForTier`; phải sửa ngay phase này, nếu không guard của chính phase 1 sẽ đỏ)
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
   <!-- Updated: Validation Session 2 - chốt trước cách xử lý từng override đã biết -->
   - **Đã chốt trước (Validation Session 2, D15):** các override đã biết được xử lý như sau, không cần dừng:
     - `executors.gemini.rigorOverrides` (light→nano, standard→standard, heavy→advanced) và `capabilities.fgos-coding-implement.overrides` (`providerModel: gemini`, `rigorOverrides` mọi mức → standard): xung đột trên cùng provider gemini. **Xoá cả hai, không sửa `modelPolicies.gemini`.** Nếu ghi `gemini.frontier = flash-high` thì step coordination ở `frontier` sẽ tụt model. Trạng thái cuối sau phase 3: Work trên gemini = `rigorToTier[rigor ?? standard]` → flash-medium, trùng với cái capability đang ép. Cập nhật luôn `description` đã cũ của capability này (nó còn nhắc `gemini-3.6-flash-medium`, `modelPolicies.gemini.lightweight`).
     - `executors.glm.rigorOverrides` (mọi mức → nano): `modelPolicies.z-ai` vốn đã là `glm-5.2` ở mọi tier, nên chỉ cần xoá.
     - Global `executors.pi.rigorOverrides` (mọi mức → nano): chỉ `pi` dùng `openai-codex`, và bảng đó hiện chỉ có `nano`. Điền đủ 6 tier của `modelPolicies.openai-codex` bằng `gpt-5.5`, rồi xoá override.
   - Bảng đối chiếu vẫn phải ghi vào báo cáo phase, để chứng minh không còn tổ hợp nào khác đổi model.
3. Viết `resolveTierModel` cùng unit test: tier hợp lệ; tier lạ → lỗi; provider thiếu bảng → lỗi; chuỗi `light|standard|heavy` đi qua bridge tạm thời.
4. Chuyển từng caller sang `resolveTierModel`; xoá `modelForTier`, `resolvePolicyTierModel`, `policyTierForDispatchTier`, `policyTierForWorkTier`, và nhánh fallback `cfg.models`.
5. Xoá phần shadow trong `placement-policy.mjs`; dời `recordShadowBinderDivergence` sang `provider-adapter.mjs`; sửa import ở `cli.mjs` và `transport.mjs`.
6. Sửa validator để từ chối các khoá đã chết. Thông báo lỗi phải chỉ rõ cách thay, ví dụ: `"executors.gemini.rigorOverrides was removed; express per-tier models in runner.modelPolicies.gemini"`.
7. Sửa `.fgos/config.json` và `~/.fgos/config.json` theo bảng ở bước 2; xoá `runner.models` ở **cả hai** config (project cũng có khoá này). <!-- Updated: Validation Session 2 - runner.models có ở cả config project -->
8. Tạo `test/runner/dead-vocabulary-guard.test.mjs`. Test quét `src/`, `bin/`, `core/`, `domains/`, `scripts/`, `.fgos/config.json` và fail khi gặp `rigorOverrides`, `resolvePolicyTierModel`, `modelForTier`, `PLACEMENT_POLICY_SHADOW`, `buildPlacementPolicyCandidate`. Dùng mẫu khớp với code thật, không dùng chuỗi mô tả: `\bcfg\.models\b` / `\.models\b` trong `src/runner/dispatch/**`, và khoá `"models"` nằm dưới `runner` trong JSON (parse JSON, không grep chuỗi `runner.models`). Phase 2–4 sẽ bổ sung thêm từ. <!-- Updated: Red Team 2026-09-30 -->
9. Chạy focused tests (danh sách ở Related Code Files, cộng `npm run test:related`) với `env -u CLAUDE_CODE_SESSION_ID`. Xanh thì commit ngay, merge `--no-ff` vào nhánh plan, rồi chạy lại focused tests trên nhánh plan.

## Success Criteria

- [x] `rg -n "modelForTier|resolvePolicyTierModel|policyTierForDispatchTier|policyTierForWorkTier|rigorOverrides|resolveVerifiedPlacementModel|buildPlacementPolicyCandidate|evaluatePlacementPolicyShadow|PLACEMENT_POLICY_SHADOW" src bin core domains .fgos/config.json` → rỗng.
- [x] `DEFAULT_TIER_TO_POLICY` chỉ còn được đọc ở một chỗ, trong `resolveTierModel`.
- [x] Bảng đối chiếu model trước/sau (bước 2) cho thấy không có tổ hợp executor × tier nào đổi model, trừ những chỗ owner duyệt.
- [x] Config có khoá đã chết → lỗi có hướng dẫn (có test).
- [x] `dead-vocabulary-guard.test.mjs` xanh; focused tests xanh; đã merge vào nhánh plan.

## Risk Assessment

- **Hai executor chung provider nhưng override khác nhau.** Tín hiệu: bảng ở bước 2 có xung đột. Xử lý: dừng lại và hỏi owner; không thêm lại một lớp override. Xung đột gemini đã biết thì đã chốt (D15, bước 2); chỉ dừng khi gặp xung đột **mới**.
- **Provider có bảng `modelPolicies` thiếu tier** (ví dụ global `openai` chỉ có `nano`). Khi bỏ nhánh fallback `cfg.models`, dispatch ở tier thiếu sẽ fail-fast thay vì âm thầm dùng model của claude. Đây là hành vi đúng; doctor ở [phase 4](./phase-04-guard-docs-and-main-merge.md) sẽ báo trước.
- **Global config của project khác chứa khoá đã chết.** Tín hiệu: lỗi validate khi chạy fgOS ở project đó. Xử lý: thông báo lỗi có hướng dẫn; doctor liệt kê ([phase 4](./phase-04-guard-docs-and-main-merge.md)). Không viết code tự migrate (quyết định D11 trong [plan.md](./plan.md)).
- **Test snapshot baseline (`dispatch-policy-baseline-snapshot`) mã hoá hành vi shadow.** Xử lý: cập nhật snapshot. Trước khi commit, diff `--stat` và đọc lại để chắc chỉ phần shadow/model đổi (memory `feedback_diff_before_committing_regenerated_baseline.md`).
- **Test đọc `~/.fgos/config.json` thật** (`test/runner/dispatch-executor-profile.test.mjs:186,307,401`; `src/config/global-config.mjs:18-26`). Xử lý: config project phải tự đủ (khai `rigorToTier`, `modelPolicies` đủ tier cho mọi provider project dùng); chạy thêm một lượt focused test với `HOME` trỏ tới thư mục tạm (global rỗng). <!-- Updated: Red Team 2026-09-30 -->
- **Sửa global config là có hiệu lực ngay** với `main` và mọi project khác, không đợi merge. Code cũ chấp nhận khoá mới và các thay đổi giữ nguyên model, nên không hỏng chức năng. Nhưng câu "`main` không bị ảnh hưởng" là sai với global config. Ngoài ra `src/setup/bin-discovery.mjs:189` đọc-sửa-ghi toàn file global, nên một `fgos setup` cũ chạy song song có thể ghi đè bản sửa tay. Xử lý: báo cáo phase lưu bản chụp global **trước và sau** khi sửa. Rollback là **một** bước nguyên tử: revert commit **và** khôi phục global từ bản chụp.
- **Rollback:** revert merge commit của phase trên nhánh plan **và** khôi phục `~/.fgos/config.json` từ bản chụp của phase.
