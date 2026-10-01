---
title: "P2 Plan chạy được: Unit cho mọi đường vào, driver mỏng trên Workflow runner, bỏ DemandFacts"
description: "Đóng mối authority 'phân rã thành gì': Unit là hợp đồng dữ liệu duy nhất cho prompt tự do, plan AgentKit, plan dạng khác; một driver mỏng giao việc cho Workflow runner (P3a); bỏ DemandFacts/matcher/form và các facade chỉ-code."
status: pending
priority: P1
effort: "~4–5d"
tags: [planning, unit, driver, doctrine, skills]
created: 2026-10-01
blockedBy: [261001-0327-request-to-run-p3-workflow-separate-from-work]
blocks: []
---

# P2 Plan chạy được

## Overview

Sau P1 (`fgos run --unit`) và **P3a** (Workflow runner + store + helper tích hợp + dịch plan → Workflow — P3 phase 2), P2 làm cho **mọi đường vào sinh ra cùng một dạng Unit** và có **một driver mỏng**: anh nói "chạy phase N" (hay "phase A..B"), hoặc gõ một câu tự do → Unit[] → **Workflow runner** (một bước chứa Unit[] với `dependsOn`, hoặc nhiều bước từ plan) → `fgos run` từng Unit qua pane herdr → tích hợp kết quả. Chuyển "phân rã, chọn capability, chọn pattern" từ **prose L2** sang **dữ liệu**. Xoá DemandFacts/matcher/`form`, `fgos-code-panel`, `fgos-plan-loop`, `fgos-code-change`. Thuộc track [request-to-run](../261001-0327-request-to-run-track/plan.md).

**Không có sequencer trong P2** (Q-C): lập lịch Unit theo `dependsOn`, cổng người, tích hợp/merge đều là việc của Workflow runner (P3a). `dispatch decide` + hook đã chuyển sang `bind()` ở P1 phase 7.

## Mối authority phải đóng

| Mối | Chủ duy nhất sau P2 |
|---|---|
| "một phần việc có dạng gì" | Unit (`src/runner/execution/unit.mjs`, P1) — plan-lint, driver, prompt tự do đều ra cùng dạng |
| "chạy một yêu cầu/phase" | driver mỏng (skill core `fgos-run`) → Workflow runner (P3a) — không facade theo domain |
| "chọn capability/pattern" | dữ liệu: Unit khai `capability`, `pattern` (hoặc rule config) — không còn DemandFacts → matcher → `form` |
| "phase này được phép chạy chưa" | cổng người của Workflow run (owner trả lời) — không parse authorize từ prose plan (red-team mục 13) |

## Quyết định nguồn

synthesis D0, D1, D2, Q2/Q5 handoff, quyết định (b) `plan.md` chỉ đọc, §7d, **§7e Q-C** (P3a trước P2; một sequencer), G7 (herdr mặc định); red-team mục 7, 13, 15.

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
Không được có `executor|provider|model|tier|invocation|actors|prefer|overrides` (plan-lint lỗi — G2); path theo luật containment của P1 phase 2.

## Phases và song song

| # | Phase | Phụ thuộc | Sóng | Sở hữu file |
|---|---|---|---|---|
| 1 | [Làm tươi](./phase-01-refresh.md) | P3a merge | A | plan |
| 2 | [Unit trong phase file (plan-lint)](./phase-02-unit-in-phase-files.md) | 1 | **B** | `src/report/capability-plan-lint.mjs`, mục `plan-lint` trong `bin/fgos.mjs` + `src/cli/command-registry.mjs`, test |
| 3 | [Driver mỏng](./phase-03-generic-driver.md) | 2 | C | `core/skills/fgos-run/` (mới), xoá `domains/coding/skills/fgos-code-change/` |
| 4 | [Bỏ DemandFacts + facade cũ](./phase-04-retire-demandfacts-legacy-facades.md) | 1 | **B** | `src/runner/capability-match.mjs` (xoá), mục `capability` trong `bin/fgos.mjs` + `command-registry.mjs`, `core/skills/_shared/capability-*.md`, `executor-dispatch-fallback.md`, `core/skills/fgos-capability-dispatching/`, `core/skills/fgos-plan-loop/` (xoá), `domains/coding/skills/fgos-code-panel/` (xoá), **2 dòng** gọi `capability match` ở `core/skills/fgos-panel/SKILL.md:71` và `core/skills/fgos-architecture-panel/SKILL.md:81` |
| 5 | [Nghiệm thu + docs + boundary](./phase-05-acceptance-docs-boundary.md) | 3, 4 | D | `docs/specs/*`, `docs/platform/component-boundary.md`, `CHANGELOG.md`, guard (append) |

Sóng B: 2 ∥ 4. **Song song với P3b**: theo bảng sở hữu trong track `plan.md`; file chung (`bin/fgos.mjs`, `command-registry.mjs`) mỗi bên chỉ sửa mục của mình; cây skill sinh ra không commit trong nhánh phase.

## Success Criteria

- [ ] "Chạy phase N" và "phase A..B" của plan có `- unit:` chạy trọn qua driver → Workflow runner → `fgos run` (pane herdr); câu tự do K1 chạy trọn (Lead viết Unit); phase chưa được owner duyệt dừng ở cổng người.
- [ ] `rg -n "DemandFacts|matchCapability|deriveForm|fgos-code-panel|fgos-plan-loop|fgos-code-change|capability match" src bin core domains AGENTS.md` rỗng (trừ lịch sử/CHANGELOG).
- [ ] Spec + boundary + CHANGELOG; guard (append); full `npm test`; merge `main`.

## Risk Assessment

| Rủi ro | Tín hiệu | Phản ứng |
|---|---|---|
| Bỏ DemandFacts → agent chọn sai `capability` | tỉ lệ override capability cao (Observe) | ví dụ trong doctrine; plan-lint cảnh báo capability không có key config; không khôi phục DemandFacts |
| Plan AgentKit không có `- unit:` | driver không đọc được | Lead viết Unit từ prose phase (như prompt tự do), hiện Unit cho owner duyệt ở cổng người khi rigor ≥ high |
| P3a chậm | P2 chưa bắt đầu được | làm phase 2, 4 (không cần runner) trước; phase 3 chờ |

## Câu hỏi mở

1. Tên skill driver: `fgos-run` (đề xuất — tên không mang domain; `fgos-code-change` bị xoá).
2. Q5 (owner): authorize phase 4 plan tài liệu để nghiệm thu "chạy thật"?

<!-- slug: request-to-run-p2-runnable-plans -->
