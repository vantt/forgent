---
title: "P4 Dạng thảo luận trên mô hình gọn + thu hồi engine coordination"
description: "Đóng mối authority L4: không còn runtime coordination riêng. 12 dạng thảo luận chuyển thành preset Pattern cộng tác hoặc Workflow, qua nghiệm thu (architecture advisor, business discussion, các dạng còn lại), rồi xoá engine và đổi tên CollaborationPattern trong code."
status: pending
priority: P1
effort: "~8–10d"
tags: [coordination, discussion, collaboration-pattern, workflow, engine-retirement]
created: 2026-10-01
blockedBy: [261001-0327-request-to-run-p1-execution-core, 261001-0327-request-to-run-p3-workflow-separate-from-work]
blocks: [261001-0327-request-to-run-p5-terminology-sweep]
---

# P4 Dạng thảo luận + thu hồi engine

## Overview

Owner chốt (Q8, 2026-09-30 23:45): **các dạng thảo luận là năng lực phải giữ; engine chỉ là phương tiện.** Bỏ engine **khi và chỉ khi** mọi dạng thảo luận chạy trên mô hình gọn "tốt đẹp, nhẹ nhàng, đúng pattern, nhanh lẹ, ít tốn kém" (đạt G1–G6, không thua engine ở tiêu chí 1, 2, 4). Ứng viên thật đầu tiên: **software architect advisor**; tiếp theo: **thảo luận business**. Thuộc track [request-to-run](../261001-0327-request-to-run-track/plan.md).

## Phân loại 12 dạng thảo luận (synthesis §6 D3 bổ sung)

| File `core/coordination-protocols/` | Loại trên mô hình gọn | Phase |
|---|---|---|
| `declared-consult` | preset `consult` = `solo` vai advisor | 2 |
| `independent-research-fan-out-fan-in` | preset `research-fan-out` = `panel` n=3 + tổng hợp | 2 |
| `independent-research-fan-out-fan-in-gated` | `research-fan-out` + cổng lộ trước tổng hợp | 2 |
| `deliberation-rfc-chain`, `group-thinking-rfc-review-lite` | preset `rfc` = `reviewed` N red-team, 1 vòng | 2 |
| `architecture-advisory-panel-v1`, `architecture-advisory-panel-standard-v1` | **Workflow** `architecture-advisory` (framing → shaping `panel` 3 → critique → synthesis → explanation → hỏi lại) | 3 |
| (mới) business discussion | **Workflow** `business-discussion` | 4 |
| `deliberation-delphi-chain`, `group-thinking-delphi-feedback-lite` | **Workflow** delphi (vòng `panel` ẩn danh → tổng hợp → vòng 2 thấy tổng hợp) | 5 |
| `deliberation-nominal-group-chain`, `group-thinking-nominal-group-lite` | **Workflow** nominal group | 5 |
| `group-cognition-framework` | **Workflow** group cognition | 5 |
| `standalone-master-coordination-loop` | đã là `reviewed` (P1) | — |

"Ai thấy gì" (visibility windows) = **đầu vào khai báo** (`inputs`) của từng bước/Unit + context sạch (vai có ràng buộc visibility luôn out-of-process, qua pane herdr — G7, Q-A). **Mức bảo đảm = ngang engine hôm nay** (red-team mục 14): bwrap không hỗ trợ `hostRead: deny` (`src/runner/dispatch/confinement/drivers/bwrap.mjs:181-189`), mọi policy `hostRead: allow` (`policies.mjs:28,50`) — engine cũng chỉ ép ở mức prompt/context. Ép ở mức file chỉ làm nếu owner muốn mạnh hơn engine (câu hỏi mở 3).

## Mối authority phải đóng

| Mối | Chủ duy nhất sau P4 |
|---|---|
| chạy một dạng thảo luận | preset Pattern cộng tác (P1) hoặc Workflow (P3) — không còn engine |
| "ai thấy gì" | `inputs` khai báo + context sạch (ngang engine) |
| định tuyến yêu cầu thảo luận (`fgos-panel`) | chọn preset/Workflow theo tên; không chọn protocol id |
| tên trong code | `CollaborationPattern`; không còn `FlowDefinition`, `CoordinationProtocol`, Protocol Pack, "objector" |

## Phases và song song

| # | Phase | Phụ thuộc | Sóng | Sở hữu file |
|---|---|---|---|---|
| 1 | [Làm tươi + mức bảo đảm visibility](./phase-01-refresh.md) | P1, P3 merge | A | plan |
| 2 | [Preset cho dạng một-unit](./phase-02-single-unit-presets.md) | 1 | **B** | `src/runner/execution/patterns/presets.mjs` (một nơi, code); skill tham chiếu consult/research |
| 3 | [Architecture advisor = Workflow (ca 2)](./phase-03-architecture-advisor-workflow.md) | 1 | **B** | `core/workflows/architecture-advisory*.yaml`, `core/skills/fgos-architecture-panel/` |
| 4 | [Business discussion = Workflow (ca 3)](./phase-04-business-discussion-workflow.md) | 3 | C | `core/workflows/business-discussion.yaml`, skill tương ứng (tạo nếu cần) |
| 5 | [Các dạng còn lại = Workflow](./phase-05-remaining-discussion-workflows.md) | 1 | **B** | `core/workflows/{delphi,nominal-group,group-cognition}.yaml`, `core/skills/fgos-group-thinking/`, `core/skills/fgos-panel/`, `core/protocol-packs/` |
| 6 | [Thu hồi engine + đổi tên](./phase-06-engine-retirement-rename.md) | 2, 3, 4, 5 đều đạt | D | `src/runner/coordination/**`, `src/verbs/coordination/**`, phần còn lại `src/runner/definitions/**`, `src/runner/team-cognition/**`, `src/runner/deliberation/**`, `core/coordination-protocols/**`, `packages/coordination-state/rust` + Cargo workspace (`Cargo.toml:10`, `apps/fgos/Cargo.toml:12`, `apps/fgos/**/metrics_sources.rs`), `packages/observe/rust` (scorecard `source: "coordination"` → nguồn Unit run + Workflow run), verb `coordination`, `execute --assignment` |

Sóng B: 2 ∥ 3 ∥ 5 (khác file). Phase 4 sau 3 để dùng lại cách làm đã nghiệm thu.

## Success Criteria

- [ ] Ca 2 (architecture advisor) và ca 3 (business) đạt G1–G6, không thua engine ở tiêu chí 1, 2, 4 (đo trên cùng câu hỏi chạy cả hai đường trước khi xoá engine).
- [ ] Mọi dạng ở bảng phân loại chạy trên mô hình gọn (test conformance).
- [ ] Engine xoá; `rg "session-engine|CoordinationProtocol|FlowDefinition|protocolRef|objector" src core domains packages` rỗng (trừ đường đọc dữ liệu lịch sử nếu giữ).
- [ ] Spec + boundary (L4 bỏ khỏi bản đồ hoặc ghi "đã thu hồi") + CHANGELOG; full `npm test`; merge `main`.

## Risk Assessment

| Rủi ro | Tín hiệu | Phản ứng |
|---|---|---|
| Owner muốn visibility mạnh hơn engine (mức file) | câu hỏi mở 3 = có | thêm phase driver `hostRead: deny` + store kết quả ngoài cây đọc được; không mang lại engine |
| Một dạng không biểu diễn được gọn | conformance đỏ, chi phí lớn | **owner quyết** (Q8): giữ engine riêng cho dạng đó hoặc bỏ dạng đó — lead không tự bỏ |
| Dữ liệu session cũ (602 session) | Observe/replay cũ cần đọc | phase 6 quyết: lưu trữ đông lạnh (đọc qua một đường) hoặc xuất báo cáo rồi bỏ — owner duyệt |

## Câu hỏi mở

1. Gộp `architecture-advisory-panel-v1` và `-standard-v1` thành một Workflow có tham số (red-team packet tuỳ chọn) hay giữ hai? (đề xuất: một, tham số.)
2. Dữ liệu `.fgos/coordination/sessions` sau khi xoá engine: lưu trữ đông lạnh hay xuất rồi bỏ?
3. Visibility: giữ mức ngang engine (prompt/context — đề xuất) hay đầu tư ép ở mức file?

<!-- slug: request-to-run-p4-discussion-patterns-engine-retirement -->
