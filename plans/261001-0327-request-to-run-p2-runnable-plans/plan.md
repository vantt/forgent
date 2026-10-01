---
title: "P2 Plan chạy được: Unit cho mọi đường vào, driver chung, bỏ DemandFacts"
description: "Đóng mối authority 'phân rã thành gì': Unit là hợp đồng dữ liệu duy nhất cho prompt tự do, plan AgentKit, plan dạng khác; một driver chung chạy một phase; bỏ DemandFacts/matcher/form và các facade chỉ-code."
status: pending
priority: P1
effort: "~5–6d"
tags: [planning, unit, driver, doctrine, skills]
created: 2026-10-01
blockedBy: [261001-0327-request-to-run-p1-execution-core]
blocks: []
---

# P2 Plan chạy được

## Overview

Sau P1 đã có `fgos run --unit`. P2 làm cho **mọi đường vào sinh ra cùng một dạng Unit** và có **một driver chung**: anh nói "chạy phase N" (plan AgentKit hay plan có block `- unit:`), hoặc gõ một câu tự do → Lead/driver ra Unit[] → `fgos run`. Chuyển authority "phân rã, chọn capability, chọn pattern" từ **prose L2** sang **dữ liệu** (Unit + rule config). Xoá DemandFacts/matcher/`form`, `fgos-code-panel`, `fgos-plan-loop`, gate chỉ-code của `fgos-code-change`. Thuộc track [request-to-run](../261001-0327-request-to-run-track/plan.md).

**Phạm vi chạy:** P2 chỉ chạy **một phase** (hoặc một tập Unit). Chạy **nhiều phase liên tiếp** = Workflow run → thuộc P3 phase 4.

## Mối authority phải đóng

| Mối | Chủ duy nhất sau P2 |
|---|---|
| "một phần việc có dạng gì" | Unit (`src/runner/execution/unit.mjs`, từ P1) — plan-lint, driver, prompt tự do đều ra cùng dạng |
| "chạy một phase/tập Unit" | một driver chung (skill core + `fgos run`) — không còn facade theo domain |
| "chọn capability/pattern" | dữ liệu: Unit khai `capability`, `pattern` (hoặc rule config) — không còn DemandFacts → matcher → `form` |
| `dispatch decide` (hook, doctrine) | gọi `bind()` — không còn logic chọn cơ chế thứ hai |

## Quyết định nguồn

synthesis D0 (hội tụ ở Unit), D1 (capability `domain:verb`, xoá DemandFacts), D2 (pattern: unit ghi rõ, không thì rule config), Q2 handoff (driver chung = tổng quát `fgos-code-change`), Q5 handoff (`- unit:` trong phase file), (b) `plan.md` do người/`ak` quản — fgOS chỉ đọc, §7d (L2 → dữ liệu).

## Hợp đồng `- unit:` trong phase file

```markdown
## Units
- unit: area-runner
  capability: docs:write
  rigor: high
  writes: [docs/platform/runner/**]
  dependsOn: []
  pattern: reviewed          # tuỳ chọn
  objective: "…"
```
Không được có `executor|provider|model|tier|invocation|actors|prefer|overrides` (plan-lint lỗi — G2).

## Phases và song song

| # | Phase | Phụ thuộc | Sóng | Sở hữu file |
|---|---|---|---|---|
| 1 | [Làm tươi](./phase-01-refresh.md) | P1 merge | A | plan |
| 2 | [Unit trong phase file (plan-lint)](./phase-02-unit-in-phase-files.md) | 1 | **B** | `src/report/capability-plan-lint.mjs`, verb `plan-lint` (`bin/fgos.mjs`, `src/cli/command-registry.mjs` mục `plan-lint`), test |
| 3 | [Driver chung](./phase-03-generic-driver.md) | 2 | C | `core/skills/fgos-run/` (mới, tổng quát `domains/coding/skills/fgos-code-change/`), `src/runner/execution/plan-reader.mjs` (mới) |
| 4 | [Bỏ DemandFacts + facade cũ; decide qua bind()](./phase-04-retire-demandfacts-legacy-facades.md) | 1 | **B** | `src/runner/capability-match.mjs` (xoá), verb `capability`, `core/skills/_shared/capability-*.md`, `core/skills/_shared/executor-dispatch-fallback.md`, `core/skills/fgos-capability-dispatching/`, `core/skills/fgos-plan-loop/` (xoá), `domains/coding/skills/fgos-code-panel/` (xoá), `src/verbs/dispatch/**` (decide), `AGENTS.md` § Dispatch |
| 5 | [Nghiệm thu + docs + boundary](./phase-05-acceptance-docs-boundary.md) | 3, 4 | D | `docs/specs/*`, `docs/platform/component-boundary.md`, `CHANGELOG.md` |

Sóng B: 2 ∥ 4 (khác file hoàn toàn). Phase 3 cần 2 (đọc Unit) và tham chiếu doctrine mới của 4 (chỉ link, không sửa file của 4).

**Song song với P3:** xem bảng sở hữu trong track `plan.md`. P2 không đụng `src/state/**`, `loop.mjs`, `domains/*/workflows/**`.

## Success Criteria

- [ ] "Chạy phase N" của một plan có `- unit:` chạy trọn qua driver chung; prompt tự do K1 chạy trọn qua driver (Lead viết Unit).
- [ ] `rg -n "DemandFacts|matchCapability|deriveForm|fgos-code-panel|fgos-plan-loop|capability match" src bin core domains` rỗng (trừ CHANGELOG/lịch sử).
- [ ] `dispatch decide` gọi `bind()`; hook PreToolUse vẫn chặn đúng.
- [ ] Spec + boundary + CHANGELOG; guard từ vựng; full `npm test`; merge `main`.

## Risk Assessment

| Rủi ro | Tín hiệu | Phản ứng |
|---|---|---|
| Bỏ DemandFacts → agent chọn sai `capability` (keyword-spotting quay lại — fable E2) | tỉ lệ override capability cao trong Observe | thêm ví dụ vào doctrine; plan-lint báo capability không có trong config; không khôi phục DemandFacts |
| Driver chung phình thành engine thứ hai | driver tự tuần tự nhiều phase | nhiều phase thuộc P3; driver chỉ một phase |
| Plan AgentKit không có `- unit:` | driver không đọc được | Lead viết Unit từ prose phase (như prompt tự do); plan-lint gợi ý thêm block |

## Câu hỏi mở

1. Tên skill driver chung: `fgos-run` (đề xuất) hay giữ `fgos-code-change` đổi nội dung? (Theo luật một tên: `fgos-code-change` bị xoá, tên mới không mang domain.)
2. Q5 (owner): authorize phase 4 plan tài liệu để nghiệm thu "chạy thật"?

<!-- slug: request-to-run-p2-runnable-plans -->
