---
title: "Gom thang tier/rigor: 2 thang + 1 bảng, xoá mọi lớp chồng"
description: "rigor (bên cầu) → rigorToTier → tier → modelPolicies[provider][tier]; xoá minTier, minRigor, mode, QUALITY_TIER_BRIDGE, DEFAULT_TIER_TO_POLICY, runner.models, rigorOverrides, readOnlyRedirects, PlacementPolicy shadow"
status: pending
priority: P1
effort: "4-5d"
tags: [dispatch, coordination, config, simplification]
created: 2026-09-30
blockedBy: []
blocks: []
---

# Gom thang tier/rigor: 2 thang + 1 bảng

## Overview

Câu hỏi "bước này dùng model mạnh tới đâu" hiện được trả lời bởi khoảng 10 khái niệm chồng nhau (`size`/work tier, `runner.models`, `tier`/`minTier`, `modelPolicies`, `rigor`, `minRigor`, `mode`, `QUALITY_TIER_BRIDGE`, `DEFAULT_TIER_TO_POLICY`, `rigorOverrides`, `readOnlyRedirects`, PlacementPolicy shadow). Ba track trước đã cố gom nhưng đều làm theo kiểu **additive + shadow, không xoá**, nên các lớp tích tụ lại:

- [`260915-executor-policy-dispatch-seams`](../../archive/plans/260915-executor-policy-dispatch-seams/plan.md): mục tiêu tự ghi *"not to delete legacy … add auditable seams"*; thêm quality bridge và PlacementPolicy shadow; bước đưa PlacementPolicy vào production rồi xoá legacy chưa bao giờ làm.
- [`260917-1733-model-tier-vocabulary-and-coordination-fallback`](../../archive/plans/260917-1733-model-tier-vocabulary-and-coordination-fallback/plan.md): đổi sang `nano…frontier` nhưng giữ `light/standard/heavy` và bảng cầu `DEFAULT_TIER_TO_POLICY`.
- [`260917-executor-profile-schema-migration`](../../archive/plans/260917-executor-profile-schema-migration/plan.md): dời `readOnlyRedirects` sang config PlacementPolicy; redirect vẫn đè `prefer`.

Plan này **xoá**, không thêm lớp. Mỗi khái niệm bị bỏ được xoá **trong đúng phase** thay thế nó; không alias, không shadow, không backward compat (fgOS có một người dùng — memory `project_no_backward_compat_single_user.md`).

## Hình dạng đích

```text
Bên cầu (việc cần gì):    rigor = low | standard | high | critical
                          khai ở step FlowDefinition (thay minTier), unit plan, DemandFacts
                          merge chỉ-nâng qua các scope (definition → operation → role → actor → assignment → cli)
Bên cung (khẩu vị owner): runner.rigorToTier[rigor] → tier (nano|mini|standard|advanced|flagship|frontier)
                          runner.modelPolicies[provider][tier] → model
                          provider = executors.<id>.providerModel (một nơi duy nhất)
Override một lần:         --tier / actors[].tier (chỉ nâng, có provenance)
Read-only:                bước chỉ-đọc chạy bằng invocation confined của CHÍNH executor đã chọn; không có thì lỗi
```

Chuỗi provenance duy nhất: `rigor` (hoặc override tier) → `rigorToTier` → `modelPolicies[provider][tier]`.

## Quyết định đã chốt (owner, 2026-09-30)

| # | Quyết định |
|---|---|
| D1 | Thay `minTier` trong FlowDefinition/workflow YAML bằng `rigor` (toàn bộ khẩu vị tier nằm trong config) |
| D2 | Xoá `runner.models`, `DEFAULT_TIER_TO_POLICY`, `minRigor`, `mode`, `QUALITY_TIER_BRIDGE`, `QUALITY_MODE_VALUES` |
| D3 | Xoá `rigorOverrides`; dời giá trị hiệu chỉnh vào `modelPolicies.<provider>` |
| D4 | Xoá `readOnlyRedirects`; bước chỉ-đọc dùng invocation read-only của executor đã chọn, không có thì báo lỗi (không đổi executor lặng lẽ) |
| D5 | Xoá PlacementPolicy shadow |
| D6 | Giữ `providerModel` trên executor; bỏ ở capability |
| D7 | Cắt liên kết `size` (`light/standard/heavy`) → model |
| D8 | Gộp 3 hàm map tier trùng thành một |
| D9 | Thêm test chặn từ đã chết; ghi quyết định vào `docs/specs/runner.md` |
| D10 | Không backward compat; xoá trong cùng phase |

## Quy trình thực thi (bắt buộc)

- **Nhánh plan:** `plan/260930-tier-rigor-consolidation`, worktree `~/projects/forgentX-tier-rigor-consolidation` (tạo từ `main` @ `c43fc9c3f`). Plan này được commit trên nhánh đó.
- **Mỗi phase một worktree riêng:** nhánh `plan/260930-tier-rigor-consolidation--phase-0N` tạo từ **đầu nhánh plan hiện tại**, worktree `~/projects/forgentX-tier-rigor-p0N`. Ngay sau `git worktree add`: symlink `node_modules` và `target` từ checkout chính (memory `project_worktree_missing_node_modules_symlink_mass_test_failures.md`).
- **Xong phase:** focused tests xanh → commit ngay → `git merge --no-ff` vào nhánh plan (làm trong worktree của nhánh plan, **không** checkout nhánh trong checkout chính — memory `feedback_never_checkout_branch_in_shared_main_checkout.md`) → chạy lại focused tests trên nhánh plan.
- **Đồng bộ main:** trước khi mở mỗi phase, `git merge main` vào nhánh plan nếu `main` có thay đổi ở `src/runner/**`, `src/verbs/coordination/**`, `core/coordination-protocols/**`, `.fgos/config.json`.
- **Merge về main chỉ một lần**, sau khi phase 4 xong: full `npm test` xanh trên nhánh plan + `detect_changes` sạch (xem [phase 4](./phase-04-guard-docs-and-main-merge.md)).
- **Dọn worktree gom một lần cuối plan** (memory `feedback_worktree_cleanup_batched_at_track_end.md`).
- **Trước khi sửa bất kỳ symbol nào:** chạy GitNexus `impact` (upstream) với `repo: "/home/vantt/projects/forgentX"` và báo blast radius. Index hiện đứng ở `6bad420` (cũ hơn HEAD) → chạy `node .gitnexus/run.cjs analyze` trước phase 1; zero-result đáng ngờ phải cross-check bằng `rg`.
- **Chạy test ngoài agent session:** `env -u CLAUDE_CODE_SESSION_ID npm test` (memory `project_npm_test_not_hermetic_inside_agent_session.md`); đọc exit code thật, không qua pipe.
- **Skill:** sửa ở `core/skills/**` hoặc `domains/**/skills/**`, rồi `npm run build:skills`; không sửa tay `.agents/` hay `plugins/` (memory `project_agents_skills_is_render_target_edit_core_skills.md`).

## Cảnh báo blast radius (GitNexus, index cũ — sẽ đo lại)

| Symbol | Risk | Luồng bị ảnh hưởng |
|---|---|---|
| `modelForTier` (`resolve.mjs`) | **CRITICAL** | `executeAssignment`, `dispatchClaimedItem`, `runOnce`, `executeExecutorCli`, `runDispatchCli` |
| `resolvePolicyTierModel` (`resolve.mjs`) | **HIGH** | `executeAssignment`, `dispatchResearchFanOutLocked`, `executeExecutorCli` |
| `selectReadOnlyRedirectExecutor` (`assignment-runner.mjs`) | **CRITICAL** | `executeAssignment`, `dispatchClaimedItem`, `runDispatchCli` |

Mọi đường dispatch (assignment, coordination, Work runner, `execute` CLI) đều đi qua các hàm này. Vì vậy mỗi phase bắt buộc chạy nhóm test dispatch + coordination tương ứng, và phase 4 chạy full suite.

## Phases

| # | Phase | Effort | Phụ thuộc | Trạng thái |
|---|---|---|---|---|
| 1 | [Một resolver tier→model; xoá cầu nối, rigorOverrides, shadow](./phase-01-single-tier-model-resolver.md) | 1.5d | — | pending |
| 2 | [rigor thay minTier; bảng rigorToTier; xoá quality bridge](./phase-02-rigor-replaces-mintier.md) | 1.5d | 1 | pending |
| 3 | [Bước chỉ-đọc dùng invocation confined; xoá readOnlyRedirects và placement-policy.mjs](./phase-03-readonly-confined-invocation.md) | 1d | 1, 2 | pending |
| 4 | [Guard từ đã chết, doctor, tài liệu, full suite, merge main](./phase-04-guard-docs-and-main-merge.md) | 0.5d | 1, 2, 3 | pending |

Phase 2 và 3 độc lập về file chính, nhưng chạy **tuần tự** (2 rồi 3) vì cùng sửa `assignment-policy.mjs`, `assignment-runner.mjs` và `.fgos/config.json`.

## Success Criteria

- [ ] Toàn repo (`src/`, `bin/`, `core/`, `domains/`, `.fgos/config.json`, `~/.fgos/config.json`) không còn: `minTier`, `minRigor`, `QUALITY_TIER_BRIDGE`, `QUALITY_MODE_VALUES`, `DEFAULT_TIER_TO_POLICY`, `rigorOverrides`, `readOnlyRedirects`, `runner.models`, `PLACEMENT_POLICY_SHADOW`, `placement-policy.mjs`; một test tự động chặn chúng quay lại.
- [ ] Đúng **một** hàm map tier → model, và mọi đường dispatch gọi nó.
- [ ] Mọi assignment ghi provenance `{rigor, rigorSource, tier, tierSource, provider, model}` dẫn được về đúng một chuỗi.
- [ ] Bước chỉ-đọc claude chạy bằng `claude-cli-bwrap` (opus), không bị đổi sang openai.
- [ ] Config chứa khoá đã chết → lỗi validate nêu rõ khoá và cách thay; `fgos doctor` liệt kê được ở cả config project lẫn global.
- [ ] `docs/specs/runner.md` có mục quyết định mới; `CHANGELOG.md` `[Unreleased]` có dòng thay đổi config.
- [ ] Full `npm test` xanh trên nhánh plan; merge `--no-ff` về `main`; post-merge suite xanh.

## Câu hỏi mở (cần owner chốt trước khi cook)

1. **Đường Work runner** (`src/runner/loop.mjs:1644-1648` `modelForTier(config, item.tier)`; `execute --tier light|standard|heavy`): khi cắt `size → model` (D7), Work dispatch lấy rigor từ đâu? Đề xuất: `rigor: standard` mặc định; Work item/stage nào cần mạnh hơn thì khai `rigor` (đổi schema Work ở mức tối thiểu). Hệ quả: item `heavy` hiện chạy `frontier` sẽ về `standard` nếu không khai `rigor`.
2. **Step `minTier: advanced`** duy nhất (`core/coordination-protocols/group-cognition-framework.yaml:169`): thang rigor 4 mức không có "advanced". Đề xuất map lên `high` (→ `flagship`), vì chỉ-nâng an toàn hơn thiếu năng lực.
3. **Invocation "readonly" không confined của claude** (`claude-cli-readonly`, `claude-herdr-readonly`: `--permission-mode acceptEdits` + allowlist tool, **không** có confinement): có được coi là read-only không? Đề xuất: **không** — chỉ `confinement` mới là bằng chứng read-only; xoá hai invocation này nếu không còn ai ghim. Hệ quả: mất pane herdr hiển thị cho reviewer claude.
4. **Project khác đang dùng fgOS global** có thể chứa khoá đã chết → sẽ lỗi validate sau khi cài bản mới. Đề xuất: fail-fast với thông báo cách thay + doctor check; owner tự sửa config các project đó (không viết code migrate).
