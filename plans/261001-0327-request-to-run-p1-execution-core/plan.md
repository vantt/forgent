---
title: "P1 Lõi thực thi: Unit, một bind(), một cửa chạy (herdr mặc định), 3 Pattern cộng tác"
description: "Đóng mối authority L5: 'ai làm' một chỗ (bind), 'chạy qua cửa nào' một cửa (pane herdr mặc định, cli fallback), read-only một posture confinement OS; lõi mới không phụ thuộc L3. Gộp plan read-only X."
status: pending
priority: P1
effort: "~10–12d"
tags: [dispatch, execution-core, bind, collaboration-pattern, read-only, herdr, observe]
created: 2026-10-01
blockedBy: [project:plan/260930-tier-rigor-consolidation]
blocks: [261001-0327-request-to-run-p3-workflow-separate-from-work]
---

# P1 Lõi thực thi

## Overview

Xây **mô hình gọn** ở L5: hợp đồng **Unit**; **`bind()`** (bảng 5 mức, bộ lọc, provenance, chọn cơ chế — **tái dùng** `mechanism.mjs`, giữ D-ADR0033); **3 Pattern cộng tác** bằng code nhỏ (`solo`, `reviewed`, `panel`); **một cửa chạy** `fgos run` bọc `executeAssignment`, **mặc định spawn qua pane herdr** (G7), cli fallback; read-only/ghi file là **posture confinement OS** áp cả trong pane herdr lẫn cli; fallback quota qua `bind()`; cổng ghi file mới **kiểm chứng được**. Thuộc track [request-to-run](../261001-0327-request-to-run-track/plan.md).

## Mối authority phải đóng (tiêu chí xong)

| Mối | Chủ duy nhất sau P1 |
|---|---|
| "ai làm / model / persona / cơ chế" cho mọi lần chạy (lõi mới + đường coordination còn sống + `dispatch decide` + hook) | `src/runner/execution/bind.mjs` (tái dùng `src/runner/dispatch/mechanism.mjs`) |
| "chạy qua cửa nào" cho việc mới | `fgos run` → `executeAssignment` (herdr mặc định, cli fallback) |
| "read-only / ghi file được tới đâu" | một posture confinement OS, resolve lúc spawn (primary + fallback + resume), cho cả herdr và cli |
| lõi mới không phụ thuộc Work (A4) | guard: `src/runner/execution/**` không import `src/state/**`, `src/runner/coordination/**`, `src/runner/worktree.mjs`, `src/runner/merge.mjs` |

Ngoại lệ có tên (single path tạm): đường engine còn dùng **protocol stamp** tới P4 phase 6; writer `dispatch-runs` của `spawnWorker`/fan-out còn tới P3b (P3 phase 5).

## Quyết định nguồn (không mở lại)

synthesis §0 (G1–**G7**), §6 (D0–D7, bảng 5 mức, override mức 4), Q0, Q4 + `checkersByRigor`, Q6, Q9, X (§6b), §7d (A4/A5/A6), **§7e (Q-A giữ D-ADR0033, Q-B Unit run không store mới, Q-C, G7, X-1/3/4)**; [red-team-adjudication.md](../261001-0327-request-to-run-track/reports/red-team-adjudication.md) mục 1–6, 8, 9, 12, 13, 15.

## Hợp đồng dữ liệu

```yaml
# Unit (phase 2)
unit:
  id: area-runner
  objective: "…"
  capability: docs:write          # domain:verb, fallback verb
  rigor: high                     # T
  writes: [docs/platform/runner/**]   # rỗng = read-only; repo-relative, không '..', không absolute
  dependsOn: []
  pattern: reviewed               # tuỳ chọn; vắng thì rule config
  inputs: []                      # repo-relative trong worktree Unit, hoặc unit-run:<id>/<role>
  expectedOutputs: ["…"]

# Unit run = .fgos/assignments/<unitRunId>/unit.json + các assignment <unitRunId>/<role>/<round>
unit.json: { unit, overrides[], configSnapshot{hash, runner.capabilities, runner.patterns, …}, worktree: <realpath>, createdBy }
# không có store mới: trạng thái vòng lặp suy từ assignment + RunResult (role, round, outcome)

# Khẩu vị (config mức 1–2) — đọc từ checkout chính/global lúc bắt đầu Unit run (snapshot), không từ worktree
runner.capabilities.<domain:verb>: { prefer: [{executor, invocation?}], persona?, minCheckers?, verify?, rigor? (T) }
runner.patterns: { defaultRule: { mutatingMinRigor: standard }, reviewed: { maxRounds: 2, checkersByRigor: {…} } }
# preset: module code src/runner/execution/patterns/presets.mjs (một nơi), không ở config

# bind() (phase 3)
in:  { unit, role, readOnly, independentOf, lockedPersona?, overrides[{scope, origin: human-cli|agent, executor?, invocation?, tier?, persona?, acceptDependence?}], session: {provider, tier, hasNativeAgent, herdrPresent, headless} }
out: { executor, invocation, transport: herdr|cli, tier, model, persona, mechanism: inline|in-process|out-of-process, posture: read-only|workspace-write, provenance } | { refused: { reason, detail } }

# RunResult contract v4: + unitRunId, role, round, outcome ∈ pass|findings|execution-failure|policy-refusal|provider-limit|blocked
```

## Phases và song song

| # | Phase | Phụ thuộc | Sóng | Sở hữu file (độc quyền trong sóng) |
|---|---|---|---|---|
| 1 | [Làm tươi](./phase-01-refresh.md) | T merge | A | plan |
| 2 | [Unit + khẩu vị config](./phase-02-unit-and-taste-config.md) | 1 | **B** | `src/runner/execution/unit.mjs` (mới), `src/runner/dispatch/config.mjs`, `src/setup/registrations.mjs`, `src/setup/checks.mjs` |
| 3 | [bind() lõi](./phase-03-bind-core.md) | 1 | **B** | `src/runner/execution/bind.mjs` (mới) + test |
| 4 | [Vòng lặp Pattern cộng tác](./phase-04-pattern-loops.md) | 1 | **B** | `src/runner/execution/patterns/**` (mới) + test |
| 5 | [Cửa chạy `fgos run` + cổng ghi file](./phase-05-run-door.md) | 2, 3, 4 | C | `src/runner/execution/run.mjs` (mới), `src/runner/dispatch/assignment-runner.mjs` (cổng mutating, ghi `unit.json`), `execution-contract.mjs`, `assignment.mjs` (persona body), `run-result.mjs`, `bin/fgos.mjs` + `src/cli/command-registry.mjs` (verb `run`), `packages/run-result/rust`, `packages/observe/rust`, `.gitignore` |
| — | **Điểm đo sớm** (cuối phase 5) | 5 | — | chạy 1 area docs bằng `fgos run` (cli) so với mốc; thua rõ → dừng, báo owner trước khi đầu tư phase 6–7 |
| 6 | [Posture trong herdr + cli, quota, xoá redirect (gộp X)](./phase-06-readonly-posture-quota-herdr.md) | 5 | **D** | `src/runner/dispatch/transport.mjs` + `herdr-round.mjs` (posture trong pane), `src/runner/dispatch/confinement/**`, `assignment-runner.mjs` (chỉ khối redirect + chọn invocation fallback), `placement-policy.mjs` (xoá), `provider-capacity.mjs`, `provider-adapter.mjs`, `liveness.mjs` (outcome `provider-limit`), `.fgos/config.json` (xoá `*-readonly`) |
| 7 | [Engine + decide + hook dùng bind()](./phase-07-coordination-path-on-bind.md) | 5 | **D** | `src/verbs/coordination/binding.mjs`, `composers.mjs`, `run.mjs` (actorPolicyFields), `src/runner/dispatch/assignment-policy.mjs`, `resolve.mjs`, `src/runner/definitions/schema.mjs` (PolicyPatch), `src/verbs/dispatch/**` (decide), `scripts/dispatch-decide-hook.mjs`, `AGENTS.md` § Dispatch, `domains/coding/workflows/feature.yaml:65` |
| 8 | [Nghiệm thu ca 1 (qua herdr) + docs + boundary](./phase-08-acceptance-docs-boundary.md) | 6, 7; việc lẻ A ✓, B | E | config khẩu vị, `docs/specs/runner.md`, `docs/platform/component-boundary.md`, `CHANGELOG.md`, `test/runner/dead-vocabulary-guard.test.mjs` (append), test kiến trúc |

Sóng B: 2 ∥ 3 ∥ 4 (file mới/khác nhau; dùng hợp đồng ở trên). Sóng D: 6 ∥ 7 (`assignment-runner.mjs` chỉ thuộc 6; `assignment-policy.mjs`/`resolve.mjs` chỉ thuộc 7).

## Success Criteria

- [ ] 4 mối authority có đúng một chủ; guard kiến trúc xanh.
- [ ] Out-of-process mặc định qua pane herdr khi herdr có mặt, cli khi không; cùng posture; provenance ghi `transport` (G7).
- [ ] Cổng ghi file: posture worktree khớp `unit.json.worktree` **và** `bind()` tính lại từ snapshot khớp; test âm (binding tự chế, worktree khác, config sửa trong worktree).
- [ ] `rg "readOnlyRedirects|placement-policy|selectReadOnlyRedirectExecutor|executors\.[a-z-]+\.for|preferPersona|'code-reviewer'" src .fgos/config.json` rỗng; invocation `*-readonly` đã xoá.
- [ ] Nghiệm thu ca 1 (qua herdr) đạt G1–G7, không thua engine ở tiêu chí 1, 2, 4; lệch người không lý do = 0.
- [ ] Spec (gồm supersede ADR-006 §6, D-ADR0033 giữ nguyên) + boundary + CHANGELOG; full `npm test`; merge `main`.

## Risk Assessment

| Rủi ro | Tín hiệu | Phản ứng |
|---|---|---|
| Confinement không chạy được trong pane herdr | spike phase 6 thất bại | dừng, báo owner (G7); không bỏ herdr lặng lẽ |
| Cổng ghi file mới có lỗ | test âm fail; run ghi file ngoài worktree Unit | rollback merge phase 5 |
| Vòng lặp pattern thiếu luật engine | đo sớm/ca 1 thua tiêu chí 4 | bổ sung vào `reviewed`; không mang lại engine |
| Resume bị `admitRunAttempt` chặn `run-in-flight` | ca kill-resume fail | chứng minh holder chết (recipe hiện có) → attempt mới; ghi rõ ở phase 5 |
| Snapshot config làm khẩu vị đổi giữa chừng không có hiệu lực | owner đổi config khi Unit run đang chạy | có chủ đích (tái lập được); Unit run mới đọc config mới |

<!-- slug: request-to-run-p1-execution-core -->
