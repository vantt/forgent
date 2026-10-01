---
title: "Track request-to-run: mô hình gọn từ yêu cầu tới lúc chạy (plan tổng)"
description: "Umbrella cho 5 plan con P1–P5 + plan nền T. Giữ mục tiêu, tiêu chí, lộ trình, phụ thuộc, trạng thái; không chứa bước triển khai."
status: pending
priority: P1
effort: "~4–6 tuần (ước, theo tổng các plan con)"
tags: [umbrella, dispatch, coordination, workflow, work, observe, simplification]
created: 2026-10-01
blockedBy: [project:plan/260930-tier-rigor-consolidation]
blocks: []
---

# Track request-to-run: mô hình gọn (plan tổng)

## Overview

Đưa vào **một yêu cầu** (câu tự do, plan bất kỳ, hay chạy một Workflow của domain) → đi tới kết quả đã kiểm chứng nhanh, ít phải canh, đúng người làm theo khẩu vị cấu hình một lần, mọi lần chạy kết thúc rõ ràng và đọc được. Làm bằng **mô hình gọn** (owner chốt Q0 2026-09-30): Unit → Pattern cộng tác (3 cái, code nhỏ) → một `bind()` → một cửa chạy → RunResult/Observe; Workflow run là tầng tuần tự bước duy nhất; engine coordination thu hồi khi mọi dạng thảo luận chạy tốt trên mô hình gọn.

Plan tổng này **không có bước triển khai**; nó giữ mục tiêu, tiêu chí, lộ trình, phụ thuộc và trạng thái của các plan con.

## Nguồn quyết định (đọc trước)

| Tài liệu | Nội dung |
|---|---|
| [synthesis-260930-1229-request-to-run-brainstorm.md](../reports/synthesis-260930-1229-request-to-run-brainstorm.md) | **Nguồn chính.** §0 kết quả mong muốn, G1–G6, 8 tiêu chí; §2 fact F1–F30; §6 D0–D7, bảng 5 mức, Workflow tách Work, plan vs Workflow, override, Q0; §6b plan X; §6c plan T; §7 Q1–Q9; §7b lộ trình + việc lẻ; §7c bài học; §7d layer/authority A1–A7 + 5 điều chỉnh |
| [layer-authority-map-261001-1020-request-to-run-track.md](../reports/layer-authority-map-261001-1020-request-to-run-track.md) | bản đồ L0–L7 dựng từ code |
| [rescoring-260930-2320-kongming-request-to-run-options.md](../reports/rescoring-260930-2320-kongming-request-to-run-options.md) | chấm độc lập, sửa bake-off |
| [advice-260930-1002-harness-flexibility-plan-agnostic-routing.md](../reports/advice-260930-1002-harness-flexibility-plan-agnostic-routing.md) §7 | bảng quyết định đã chốt |
| `plan/260930-tier-rigor-consolidation` (nhánh) `plans/260930-0445-tier-rigor-vocabulary-consolidation/plan.md` | plan nền T (D19 sàn `capabilities.<cap>.rigor`) |
| cùng nhánh `plans/260930-1235-readonly-invocation-redesign/plan.md` | plan X — đã gộp vào P1 phase 6 |

## Thuật ngữ (một khái niệm một tên — synthesis §6 D0, D3)

Unit · **Pattern cộng tác / `CollaborationPattern`** (đúng 3: `solo`, `reviewed`, `panel` + preset) · **Workflow** / **Workflow run** · coordination session (runtime cũ) · Work (bản ghi/board/lifecycle) · red-team (không "objector"). Không dùng `FlowDefinition`, `CoordinationProtocol` để chỉ Pattern cộng tác.

## Lộ trình và phụ thuộc

```text
[việc lẻ A, B] ─────────────────────────────┐ (điều kiện cần trước nghiệm thu P1)
T Tier/rigor (agent khác) ──► P1 Lõi thực thi ──┬──► P2 Plan chạy được ─────────────┐
                                               └──► P3 Workflow tách khỏi Work ──► P4 Dạng thảo luận + thu hồi engine ──► P5 Thuật ngữ
```

| Plan | Thư mục | Layer / mối authority phải đóng | Phụ thuộc | Song song với |
|---|---|---|---|---|
| T | nhánh `plan/260930-tier-rigor-consolidation` | L5+config: "model mạnh tới đâu" | — | việc lẻ A, B |
| P1 Lõi thực thi | [p1-execution-core](../261001-0327-request-to-run-p1-execution-core/plan.md) | L5: "ai làm" một `bind()`; một cửa chạy; read-only một posture; L5 không phụ thuộc L3 (lõi mới) | T merge; việc lẻ A+B trước phase nghiệm thu | — |
| P2 Plan chạy được | [p2-runnable-plans](../261001-0327-request-to-run-p2-runnable-plans/plan.md) | L2→dữ liệu: Unit là hợp đồng duy nhất cho mọi đường vào | P1 | **P3** (khác file; xem bảng sở hữu) |
| P3 Workflow tách khỏi Work | [p3-workflow-separate-from-work](../261001-0327-request-to-run-p3-workflow-separate-from-work/plan.md) | L3: "tuần tự bước + cổng người" một Workflow run; L5 hết import L3 | P1 | **P2** |
| P4 Dạng thảo luận + thu hồi engine | [p4-discussion-patterns-engine-retirement](../261001-0327-request-to-run-p4-discussion-patterns-engine-retirement/plan.md) | L4 không còn là runtime riêng | P1 + P3 (P2 khuyến nghị) | — |
| P5 Thuật ngữ | [p5-terminology-sweep](../261001-0327-request-to-run-p5-terminology-sweep/plan.md) | ngang: một tên mỗi khái niệm | P4 | — |

**Sở hữu file giữa P2 và P3 (để chạy song song):** P2 sở hữu `src/report/capability-plan-lint.mjs`, `src/runner/capability-match.mjs`, `core/skills/_shared/capability-*.md`, `core/skills/fgos-capability-dispatching/`, `core/skills/fgos-plan-loop/`, `domains/coding/skills/fgos-code-change/`, `domains/coding/skills/fgos-code-panel/`, verb `capability`/`plan-lint` trong `bin/fgos.mjs` + `src/cli/command-registry.mjs` (chỉ các mục đó). P3 sở hữu `src/state/**` (trừ đọc), `src/workflow/**` (mới), `src/runner/loop.mjs`, `src/runner/dispatch/operation-choice.mjs`, `domains/*/workflows/**`, `domains/*/registry.yaml`, `src/runner/definitions/workflow-adapter.mjs`, Rust `packages/work-state`, `herdr-plugin` (phần `stage`). Điểm chạm chung: **driver chung của P2 chạy nhiều phase bằng Workflow run của P3** → P2 chỉ làm "một phase"; "nhiều phase" thuộc P3 phase 4.

## Việc lẻ (ngoài track, làm ngay, song song)

| # | Prompt | Vì sao cần cho track |
|---|---|---|
| A | [prompt-261001-0955-fix-observe-harness-protocol-count.md](../reports/prompt-261001-0955-fix-observe-harness-protocol-count.md) | số liệu Observe đúng cho nghiệm thu |
| B | [prompt-261001-0955-fix-test-fixture-store-leak.md](../reports/prompt-261001-0955-fix-test-fixture-store-leak.md) | store sạch → số liệu nền tiêu chí 4 không nhiễu |

## Quy trình thực thi (bắt buộc cho mọi plan con)

- Mỗi plan con: nhánh `plan/261001-request-to-run-pN`, worktree riêng ngoài checkout chính; **mỗi phase một worktree** từ đầu nhánh plan; xong phase → test xanh → commit → `merge --no-ff` vào nhánh plan (trong worktree của nhánh plan, **không** checkout nhánh trong checkout chính) → chạy lại test trên nhánh plan. Merge `main` **một lần** khi plan con xong. Dọn worktree gom cuối plan.
- Ngay sau `git worktree add`: symlink `node_modules` và `target` từ checkout chính.
- **Phase 1 của mọi plan con là "làm tươi"** (merge `main`, chạy GitNexus analyze, scout lại `file:line`, cập nhật phase lệch theo kết quả nghiệm thu plan trước). Không mở lại quyết định đã chốt trong synthesis; chỉ đổi khi có bằng chứng mới, và ghi rõ.
- Trước khi sửa symbol: capability gate impact-analysis + GitNexus `impact` upstream; báo blast radius; HIGH/CRITICAL → dừng, báo owner.
- Test: `env -u CLAUDE_CODE_SESSION_ID npm test` (hoặc focused), đọc exit code thật, không qua pipe.
- Skill: sửa ở `core/skills/**` / `domains/**/skills/**`, rồi `npm run build:skills`; không sửa tay `.agents/`, `plugins/`.
- Mọi khoá config / env / file hạ tầng mới → đăng ký `fgos setup` + `fgos doctor` (install gate `AGENTS.md`); thay đổi người dùng thấy → `CHANGELOG.md` `[Unreleased]`.
- Single path, không backward compat: cái mới thay cái cũ thì xoá cái cũ trong cùng phase.
- Commit conventional, không ghi mã plan/phase/finding vào commit message hay code comment.

## Tiêu chí "xong" của mọi plan con (synthesis §7d điều chỉnh 2)

1. Mối authority của plan có **đúng một chủ** trong layer chính của nó.
2. `docs/platform/component-boundary.md` (hoặc nguồn chi tiết) cập nhật; hoặc ghi `No component-boundary change` có lý do.
3. Guard test chặn rò ngược (vd L5 → L3; từ vựng cũ).
4. Quyết định đã chốt được ghi vào `docs/specs/<area>.md` "Lịch sử quyết định" (L5 platform law: learning left behind).
5. Full `npm test` xanh trên nhánh plan trước khi merge `main`.

## Success Criteria (của cả track — synthesis §0)

- [ ] G1–G6 đạt (G1 Observe thấy mọi lần chạy; G2 không ghim hạ tầng trong plan/Workflow/pattern; G3 một đường mỗi năng lực; G4a headless; G4b Workflow non-code có cổng người; G5 không yếu độc lập/governance; G6 không đổi người lặng lẽ).
- [ ] Nghiệm thu ca 1 (P1: 2 area docs), ca 2 (P4: architecture advisor), ca 3 (P4: business discussion) không thua engine ở tiêu chí 1 (nhanh), 2 (ít canh), 4 (chất lượng + kết thúc); đúng người (tiêu chí 3) lệch không lý do = 0.
- [ ] Engine coordination (~21k dòng) đã xoá; mọi dạng thảo luận vẫn chạy.
- [ ] Một tên mỗi khái niệm trên code + docs (guard).

## Rủi ro track-level

| Rủi ro | Tín hiệu | Phản ứng định trước |
|---|---|---|
| Mô hình gọn thiếu bảo đảm engine đang có (resume, visibility ở mức file) | ca nghiệm thu P1/P4 thua tiêu chí 4, hoặc agent đọc được artifact ngoài đầu vào khai báo | xây đúng phần thiếu trong mô hình gọn; **không** mang lại engine; nếu không xây được với chi phí hợp lý → owner quyết giữ engine riêng cho dạng đó (Q8) |
| T trễ | T chưa merge khi P1 sẵn sàng | P1 không bắt đầu (cùng file); dùng thời gian làm việc lẻ A, B và refresh |
| Plan con lệch nhau khi chạy song song (P2 ∥ P3) | xung đột ở file chung / driver | bảng sở hữu ở trên; driver nhiều phase chỉ ở P3 |
| Số dòng `file:line` trong plan mục | phase refresh phát hiện | phase 1 mỗi plan cập nhật, không coi là lỗi plan |
| Plan đo RunResult `260930-0335-measure-runresult-classification-impact` phase 4 (producer coordination `maxRounds`) thành việc phí vì engine bị thu hồi | P4 tiến tới phase 6 | đề xuất owner bỏ/hoãn phase 4 của plan đó (ghi ở Câu hỏi mở) |

## Phases

| # | Phase | Status |
|---|---|---|
| 1 | [Cổng điều kiện tiên quyết](./phase-01-prerequisites-gate.md) | Pending |

## Câu hỏi mở

1. **Q5:** owner authorize phase 4 (P4 constitution) của plan tài liệu khi nào? Chỉ chặn nghiệm thu "chạy thật một phase" ở P2, không chặn build.
2. Plan `260930-0335-measure-runresult-classification-impact` phase 4 (producer coordination `maxRounds`): bỏ hay hoãn vì engine sẽ bị thu hồi ở P4?

<!-- slug: request-to-run-track -->
