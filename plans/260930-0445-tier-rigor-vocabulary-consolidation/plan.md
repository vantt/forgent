---
title: "Gom thang tier/rigor: 2 thang + 1 bảng, xoá mọi lớp chồng"
description: "rigor (bên cầu) → rigorToTier → tier → modelPolicies[provider][tier]; xoá minTier, minRigor, mode, QUALITY_TIER_BRIDGE, DEFAULT_TIER_TO_POLICY, runner.models, rigorOverrides, PlacementPolicy shadow (readOnlyRedirects dời sang plan follow-on)"
status: done
priority: P1
effort: "5-6d"
tags: [dispatch, coordination, config, simplification]
created: 2026-09-30
blockedBy: []
blocks: [260930-1235-readonly-invocation-redesign]
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
Sàn theo loại việc:       capabilities.<cap>.rigor (khẩu vị owner, cùng thang, chỉ nâng — D19;
                          thay cả khối capabilities.<cap>.overrides)
Override một lần:         --tier / actors[].tier (chỉ nâng, có provenance)
Work:                     work.size (độ lớn, KHÔNG tới model) + work.rigor (tuỳ chọn, cùng thang, discovery phán)
Read-only:                NGOÀI PHẠM VI plan này (red team 2026-09-30) → plan follow-on
                          260930-1235-readonly-invocation-redesign; readOnlyRedirects giữ nguyên tới khi plan đó xong
```

Chuỗi provenance duy nhất: `rigor` (hoặc override tier) → `rigorToTier` → `modelPolicies[provider][tier]`.

## Quyết định đã chốt (owner, 2026-09-30)

| # | Quyết định |
|---|---|
| D1 | Thay `minTier` trong FlowDefinition/workflow YAML bằng `rigor` (toàn bộ khẩu vị tier nằm trong config) |
| D2 | Xoá `runner.models`, `DEFAULT_TIER_TO_POLICY`, `minRigor`, `mode`, `QUALITY_TIER_BRIDGE`, `QUALITY_MODE_VALUES` |
| D3 | Xoá `rigorOverrides`; dời giá trị hiệu chỉnh vào `modelPolicies.<provider>` (gemini: xoá, không dời — D15) |
| D4 | **[Dời sang plan follow-on, red team 2026-09-30]** Xoá `readOnlyRedirects`; bước chỉ-đọc dùng invocation read-only của executor đã chọn, không có thì báo lỗi (không đổi executor lặng lẽ) |
| D5 | Xoá PlacementPolicy shadow |
| D6 | Giữ `providerModel` trên executor; bỏ ở capability |
| D7 | Cắt liên kết `size` (`light/standard/heavy`) → model |
| D8 | Gộp 3 hàm map tier trùng thành một |
| D9 | Thêm test chặn từ đã chết; ghi quyết định vào `docs/specs/runner.md` |
| D10 | Không backward compat; xoá trong cùng phase |
| D11 | Project khác có khoá đã chết → fail-fast với hướng dẫn + doctor check; owner tự sửa config, không viết code migrate |
| D12 | `work.tier` tách thành `work.size` (độ lớn, không bao giờ tới model) + `work.rigor` (tuỳ chọn); discovery phán cả hai; event cũ đọc `tier → size` ở đường đọc duy nhất |
| D13 | Step `divergent-exploration` (`minTier: advanced`) → `rigor: standard` |
| D14 | **[Dời sang plan follow-on; tiền đề sai theo red team]** Invocation có field `readOnly: true`; `claude-cli-readonly`/`claude-herdr-readonly` được sửa thành read-only thật (cờ CLI, smoke chứng minh) để giữ pane herdr; validator cấm `readOnly: true` đi kèm cờ tự duyệt ghi |
| D15 | Xoá `rigorOverrides` của executor `gemini` và capability `fgos-coding-implement` mà không sửa `modelPolicies.gemini`; `glm` chỉ xoá; global `pi` điền đủ 6 tier `openai-codex` = `gpt-5.5` |
| D16 | **[Dời sang plan follow-on; fallback hiện không bao giờ chạy]** Phase 4 khai `fallbackExecutors: [openai]` cho các bước chỉ-đọc gắn claude; fallback chạy read-only, có provenance, tôn trọng `distinctProviderFrom` |
| D17 | Phase 4 cũ (read-only, D4/D14/D16) tách thành plan follow-on [`260930-1235-readonly-invocation-redesign`](../260930-1235-readonly-invocation-redesign/plan.md); plan này giữ `readOnlyRedirects` và phần redirect của `placement-policy.mjs` |
| D18 | `work.risk: heavy` của item chưa có `rigor` được đọc thành `rigor: high` ở đúng một chỗ; dispatch chỉ đọc `rigor`; discovery phán `rigor` có xét `risk` |
| D19 | **(owner 2026-10-01)** Thêm sàn theo loại việc `capabilities.<cap>.rigor` (cùng thang `low…critical`, merge chỉ-nâng như một scope của bên cầu, `rigorSource: capability`), áp cho cả đường coordination lẫn đường Work. Đồng thời **xoá cả khối `capabilities.<cap>.overrides`**: sau phase 1 nó chỉ còn `tier` và `model`, không config nào dùng (đã quét `.fgos/config.json` của forgentX, fgos-test-drive, herdr-gateway, mdview, worktree docs); `overrides.model` là model ghi cứng, trái luật "không literal model". Lý do: khẩu vị owner phát biểu theo loại việc ("review = opus", "research = standard"); không có sàn này thì rigor phải khai trong YAML pattern, tức khẩu vị lọt vào YAML. Nguồn: `plans/reports/synthesis-260930-1229-request-to-run-brainstorm.md` §7 Q1, §6c (trên `main`) → [phase 2](./phase-02-rigor-replaces-mintier.md) |
| D20 | **(owner 2026-10-01)** Bỏ mục phase 4 sửa `plans/reports/brainstorm-prompt-260930-1102-request-to-run-decomposition.md` §6.4: `main` đã làm việc này ở `cf94a59e8`; prompt là bản ghi lịch sử, sửa lại chỉ gây xung đột merge |

## Quy trình thực thi (bắt buộc)

- **Nhánh plan:** `plan/260930-tier-rigor-consolidation`, worktree `~/projects/forgentX-tier-rigor-consolidation` (tạo từ `main` @ `c43fc9c3f`). Plan này được commit trên nhánh đó.
- **Mỗi phase một worktree riêng:** nhánh `plan/260930-tier-rigor-consolidation--phase-0N` tạo từ **đầu nhánh plan hiện tại**, worktree `~/projects/forgentX-tier-rigor-p0N`. Ngay sau `git worktree add`: symlink `node_modules` và `target` từ checkout chính (memory `project_worktree_missing_node_modules_symlink_mass_test_failures.md`).
- **Xong phase:** focused tests xanh → commit ngay → `git merge --no-ff` vào nhánh plan (làm trong worktree của nhánh plan, **không** checkout nhánh trong checkout chính — memory `feedback_never_checkout_branch_in_shared_main_checkout.md`) → chạy lại focused tests trên nhánh plan.
- **Đồng bộ main:** trước khi mở mỗi phase, `git merge main` vào nhánh plan nếu `main` có thay đổi ở `src/runner/**`, `src/verbs/coordination/**`, `core/coordination-protocols/**`, `.fgos/config.json`.
- **Merge về main chỉ một lần**, sau khi phase 4 (guard/merge) xong: full `npm test` xanh trên nhánh plan + `detect_changes` sạch (xem [phase 4](./phase-04-guard-docs-and-main-merge.md)).
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

Mọi đường dispatch (assignment, coordination, Work runner, `execute` CLI) đều đi qua các hàm này. Vì vậy mỗi phase bắt buộc chạy nhóm test dispatch + coordination tương ứng, và phase 5 chạy full suite. Phase 3 còn chạm lớp Work (schema, store, Rust `work-state`, herdr gateway, skill discovery).

## Phases

| # | Phase | Effort | Phụ thuộc | Trạng thái |
|---|---|---|---|---|
| 1 | [Một resolver tier→model; xoá cầu nối, rigorOverrides, shadow](./phase-01-single-tier-model-resolver.md) | 1.5d | — | done |
| 2 | [rigor thay minTier; bảng rigorToTier; xoá quality bridge](./phase-02-rigor-replaces-mintier.md) | 1.5d | 1 | done |
| 3 | [Work: tách work.tier thành work.size + work.rigor; xoá DEFAULT_TIER_TO_POLICY](./phase-03-work-size-and-rigor.md) | 1.5d | 2 | done |
| 4 | [Guard từ đã chết, doctor, tài liệu, full suite, merge main](./phase-04-guard-docs-and-main-merge.md) | 0.5d | 1–3 | done |

Phase read-only cũ đã được dời sang plan follow-on [`260930-1235-readonly-invocation-redesign`](../260930-1235-readonly-invocation-redesign/plan.md) (D17).

Các phase chạy **tuần tự**, vì cùng sửa `assignment-policy.mjs`, `assignment-runner.mjs`, `resolve.mjs` và `.fgos/config.json`.

## Success Criteria

- [x] Toàn repo (`src/`, `bin/`, `core/`, `domains/`, `.fgos/config.json`, `~/.fgos/config.json`) không còn: `minTier`, `minRigor`, `QUALITY_TIER_BRIDGE`, `QUALITY_MODE_VALUES`, `DEFAULT_TIER_TO_POLICY`, `rigorOverrides`, `runner.models` (khoá `models` dưới `runner`, và `cfg.models` trong code), `PLACEMENT_POLICY_SHADOW`; một test tự động chặn chúng quay lại. `readOnlyRedirects` và phần redirect của `placement-policy.mjs` còn lại, chờ plan follow-on. <!-- Updated: Red Team 2026-09-30 -->
- [x] Config không còn `capabilities.*.overrides` (cả `tier`, `model`, `providerModel`, `rigorOverrides`); `capabilities.<cap>.rigor` là sàn duy nhất theo loại việc, có hiệu lực ở cả đường coordination lẫn Work, provenance ghi `rigorSource: capability` (D19).
- [x] Đúng **một** hàm map tier → model, và mọi đường dispatch gọi nó.
- [x] Mọi assignment ghi provenance `{rigor, rigorSource, tier, tierSource, provider, model, reasoningEffort}` dẫn được về đúng một chuỗi; `reasoningEffort` suy từ `rigor`.
- [x] `work.size` không bao giờ dẫn tới model; Work dispatch dùng `work.rigor` (item cũ: `risk: heavy` → `high`, còn lại `standard`); event cũ và snapshot `state.json` cũ đọc ra `size`.
- [x] Config chứa khoá đã chết → lỗi validate nêu rõ khoá và cách thay; `fgos doctor` liệt kê được ở cả config project lẫn global.
- [x] `fgos doctor` báo provider nào có `modelPolicies` thiếu tier mà `rigorToTier` sinh ra.
- [x] `docs/specs/runner.md` có mục quyết định mới; `CHANGELOG.md` `[Unreleased]` có dòng thay đổi config.
- [x] Full `npm test` xanh trên nhánh plan (kể cả với HOME trỏ tới global rỗng); merge `--no-ff` về `main`; post-merge suite xanh; gateway đã restart.

## Câu hỏi mở

Không còn. Các câu đã được chốt ở Validation Log bên dưới.

## Validation Log

### Session 1 — 2026-09-30

| # | Câu hỏi | Bằng chứng trình bày cho owner | Quyết định |
|---|---|---|---|
| 1 | `work.tier` xử lý thế nào | Trường gánh 2 nghĩa (độ lớn và độ mạnh model); gán bằng từ khoá (`classify.mjs:81`: "docs" → `light`); `assignment-policy.mjs:256` bỏ qua lặng lẽ `light`/`heavy`; phân bố 542 `standard` / 326 `light` / 174 `heavy` | **D12**: tách `size` + `rigor`, discovery phán `rigor` → [phase 3](./phase-03-work-size-and-rigor.md) |
| 2 | `minTier: advanced` map sang đâu | `advanced` = `standard` ở claude/openai, khác ở gemini (flash-high); `mini` không provider nào khai | **D13**: `rigor: standard` |
| 3 | `claude-cli-readonly`/`claude-herdr-readonly` | Cả hai vẫn chạy `--permission-mode acceptEdits`, nên vẫn ghi được file; chỉ `claude-cli-bwrap` bị OS chặn ghi | **D14**: sửa thành read-only thật + `readOnly: true`, giữ pane herdr → [phase 4](./phase-04-readonly-invocations.md) |
| 4 | Project khác có khoá đã chết | fgOS cài global và chạy ở nhiều project | **D11**: fail-fast + doctor; owner tự sửa |

### Session 2 — 2026-09-30

**Trigger:** `/ak:plan validate` trên nhánh `plan/260930-tier-rigor-consolidation`. **Câu hỏi:** 2.

#### Verification Results
- **Tier:** Full (5 phase). **Claims checked:** 78. **Verified:** 74 | **Failed:** 4 | **Unverified:** 0.
- Đã kiểm: mọi symbol cần xoá/thay (`resolve.mjs:38,78`, `plan.mjs:26`, `placement-policy.mjs:37-457`, `assignment-runner.mjs:184,255,1431-1455`, `assignment-policy.mjs:47,50,67,256,315,466`, `schema.mjs:29,145`, `config.mjs:525,1252,1289`); caller của `modelForTier` (`cli.mjs:303,824`, `loop.mjs:1648`, barrel `dispatch.mjs:36`); `recordShadowBinderDivergence` (`transport.mjs:51`); 60 giá trị `minTier` trong 13 YAML + `feature.yaml`, đúng một `advanced` (`group-cognition-framework.yaml:169`); dòng Work (`classify.mjs:81`, `loop.mjs:1644`, `cli.mjs:296`, `plan.mjs:400`, `claim-port.mjs:326`, `work-compat.mjs:259`, `intake/plan.mjs:952`, `work_source.rs:540`, `gateway.rs:713`); mọi file test được nêu tên đều tồn tại; `claude-cli-readonly`/`claude-herdr-readonly` không có confinement.

#### Failures
1. [Fact Checker] Phase 1 bước 7 chỉ xoá `runner.models` ở global. Thực tế `.fgos/config.json` cũng có `runner.models`. → Đã sửa.
2. [Fact Checker] Phase 2 nói "thêm `RIGOR_VALUES`". Thực tế đã có `capability-match.mjs:30` (bản sao của `MIN_RIGOR_VALUES`). → Sửa thành gộp về một hằng.
3. [Contract Verifier] Bảng dời `rigorOverrides` của phase 1 bỏ sót `capabilities.fgos-coding-implement.overrides` (`providerModel: gemini`, mọi mức → standard). Nó xung đột với `executors.gemini.rigorOverrides` (heavy→advanced) trên cùng provider. Override chỉ tác động ở đường Work, nên ghi đè `modelPolicies.gemini` sẽ làm tụt các step coordination ở `frontier`. → Owner chốt D15.
4. [Flow Tracer] Phase 4 dựa vào `fallbackExecutors` cho trường hợp hết quota claude, nhưng không config nào khai field này. Không có bước nào tạo nó. → Owner chốt D16.

#### Questions & Answers
1. **[Risk]** Xung đột override gemini xử lý thế nào?
   - Options: Xoá hết, giữ modelPolicies | Ghi đè modelPolicies.gemini | Tách executor gemini riêng
   - **Answer:** Xoá hết, giữ modelPolicies. **Lý do:** trạng thái cuối sau phase 3 trùng với cái capability đang ép (flash-medium), và coordination không đổi.
2. **[Risk]** Bỏ redirect khi chưa có fallback quota?
   - Options: Khai fallback trong phase 4 | Không fallback, fail-fast | Để plan riêng
   - **Answer:** Khai fallback trong phase 4. **Lý do:** ưu tiên #2 "Release con người": hết quota không được làm review nằm chờ người.

#### Quyết định tự chốt (rõ ràng, không cần hỏi)
- Thêm doctor check `model-policy-tier-coverage` vào phase 5. Lý do: global `openai` chỉ khai `nano`, nên khi bỏ fallback `cfg.models`, tier thiếu sẽ fail-fast. Doctor phải báo trước.

#### Impact on Phases
- Phase 1: bước 2 chốt trước cách xử lý từng override (D15); bước 7 xoá `runner.models` ở cả hai config; thêm rủi ro bảng policy thiếu tier.
- Phase 2: gộp `RIGOR_VALUES` sẵn có, không tạo hằng mới.
- Phase 4: khai `fallbackExecutors` + test (D16).
- Phase 5: thêm doctor check phủ tier.

### Whole-Plan Consistency Sweep
- Files reread: plan.md, phase-01…phase-05.
- Decision deltas checked: 4 (D15 gemini override, D16 quota fallback, `runner.models` ở cả hai config, gộp `RIGOR_VALUES`).
- Reconciled stale references: 5. Gồm: phase 1 non-functional "dời sao cho kết quả không đổi"; phase 1 rủi ro xung đột provider; D3 trong plan.md; CHANGELOG ở phase 5; Success Criteria trong plan.md. Phase 4 bỏ "Provider Capacity Rotator (cơ chế đã có)" vì không có config nào dùng.
- Phase 3 không bị ảnh hưởng: nó dùng `RIGOR_VALUES` của phase 2, khớp với việc gộp hằng.
- Unresolved contradictions: 0.

### Session 3 — 2026-10-01 (đối chiếu với track request-to-run)

**Trigger:** discussion lead của track request-to-run đối chiếu plan này với thiết kế của track đó (`plans/reports/synthesis-260930-1229-request-to-run-brainstorm.md` §6b, §6c trên `main`); owner duyệt 2026-10-01.

- **D19** (sàn `capabilities.<cap>.rigor`, xoá khối `capabilities.*.overrides`) → phase 2, phase 3 (bỏ mục validate `overrides.tier`), phase 4 (tài liệu, CHANGELOG).
- **D20** (bỏ mục sửa brainstorm prompt) → phase 4.
- Plan follow-on `260930-1235-readonly-invocation-redesign` **được gộp vào plan `bind()` của track request-to-run** (owner 2026-10-01); không lập phase riêng. Plan này vẫn giữ `readOnlyRedirects` như D17.
- Không đổi phạm vi khác. Plan này là **nền** của track request-to-run (bảng `rigorToTier`, một resolver, field `tier` override); track đó chờ plan này merge rồi mới sửa `assignment-runner.mjs`/`assignment-policy.mjs`/`resolve.mjs`.
- Đã kiểm: `CAPABILITY_OVERRIDE_FIELDS = ['rigorOverrides','providerModel','tier','model']` (`config.mjs:1289`); `overrides.tier`/`.model` chỉ được đọc ở đường Work (`plan.mjs:397-400`, `cli.mjs:810-820`); không config nào khai `overrides.tier`/`.model`.

## Red Team Review

### Session — 2026-09-30
**Reviewers:** Failure Mode Analyst (Flow Tracer), Assumption Destroyer (Scope Auditor), Security Adversary (Fact Checker).
**Findings:** 15 sau khi gộp trùng từ 27 (15 accepted, 0 rejected; mọi phát hiện đều có file:line).
**Severity breakdown:** 5 Critical, 7 High, 3 Medium.

| # | Finding | Severity | Disposition | Applied To |
|---|---|---|---|---|
| 1 | Read-only bằng cờ CLI chặn luôn việc ghi `agent-result.json`/`agent-report.md`/outbox của chính run | Critical | Accept → dời plan | follow-on (D17) |
| 2 | Nhánh "confinement" của predicate chỉ là metadata, resolve thành `unconfined` | Critical | Accept → dời plan | follow-on |
| 3 | Danh sách cờ cấm thiếu cờ đang có trong config; Bash allowlist ghi được | Critical | Accept → dời plan | follow-on |
| 4 | D16: fallback quota không bao giờ chạy (không có `runner.providers`); chọn invocation ở chỗ khác → `codex-cli-bypass-fgovn` | Critical | Accept → dời plan | follow-on |
| 5 | D16 gắn nhầm bước (`review-candidate` đã bind openai); xoá redirect làm hỏng project khác | Critical | Accept → dời plan | follow-on |
| 6 | `scripts/project-agents.mjs` + `core/agents/*.yaml` dùng `modelForTier`/`model_tier` | High | Accept | Phase 1, 3 |
| 7 | "provider chỉ từ `providerModel`" làm vỡ claude → `deriveProviderFamily` | High | Accept | Phase 1 |
| 8 | Guard: phase 1 tự đỏ; mẫu không khớp code thật; `docs/` không được quét; `flow-definition.md` bị sót | Medium | Accept | Phase 1, 2, 3, 4 |
| 9 | Bỏ `minTier` thì `actors[].tier` mất đường đi → field `tier` trong PolicyPatch | High | Accept | Phase 2 |
| 10 | `policy.minTier` đã lưu (37 assignment, 8 coordination) mất mức sàn lặng lẽ | High | Accept | Phase 2 |
| 11 | `reasoningEffort` mất nguồn; DemandFacts `rigor` không có consumer | Medium | Accept | Phase 2 |
| 12 | Snapshot `state.json` đi đường tắt, không bao giờ map `tier → size` | High | Accept | Phase 3 |
| 13 | Kiểm kê Work thiếu consumer; `work.risk: heavy` là kênh tier thứ hai (D18) | High | Accept | Phase 3 |
| 14 | Gateway đang chạy + web UI vỡ khi bỏ `--tier`; tiêu chí `'--tier'` mâu thuẫn override | High | Accept | Phase 3, 4 |
| 15 | Test đọc `~/.fgos` thật; rollback không nguyên tử; sửa global có hiệu lực ngay | Medium | Accept | Phase 1, 4 |

**Owner quyết (2026-09-30):** tách phase read-only ra plan follow-on (D17); `risk: heavy` → `rigor: high` khi đọc (D18); áp dụng toàn bộ #6–#15.

### Whole-Plan Consistency Sweep
- Files reread: plan.md, phase-01, phase-02, phase-03, phase-04 (guard; đổi số từ phase 5).
- Decision deltas checked: 6 (D17 tách phase, đổi số phase 5 → 4, D18 risk, field `tier` PolicyPatch, `deriveProviderFamily`, guard scan set).
- Reconciled stale references: 14. Gồm: hình dạng đích (dòng Read-only); D4/D14/D16 được đánh dấu dời; bảng phase; Success Criteria (bỏ `readOnlyRedirects`/`placement-policy.mjs`, bỏ 2 tiêu chí read-only/fallback, thêm provenance `reasoningEffort`, snapshot, HOME rỗng, gateway); phase 1 (câu "phần redirect bị xoá ở phase 4", provider, rollback "main không bị ảnh hưởng"); link/nhãn "phase 5" → "phase 4" (5 chỗ); doctor read-only + smoke read-only bị bỏ khỏi phase guard; CHANGELOG; tiêu chí `'--tier'` ở phase 3.
- Còn giữ có chủ ý: "phase 5" trong Validation Log Session 1–2 là log lịch sử, không sửa.
- Unresolved contradictions: 0.
