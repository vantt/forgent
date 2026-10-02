---
title: "P5 Quét thuật ngữ: một tên mỗi khái niệm trên toàn tài liệu"
description: "Sau P4, code đã đổi tên; P5 quét docs/spec/doctrine còn dùng tên cũ (~800 lượt) và thêm guard chặn tái phát, cập nhật bản đồ component cuối."
status: pending
priority: P2
effort: "~2–3d"
tags: [docs, terminology, guard]
created: 2026-10-01
blockedBy: [261001-0327-request-to-run-p4-discussion-patterns-engine-retirement]
blocks: []
---

# P5 Quét thuật ngữ

## Overview

Owner chốt (2026-09-30): **một khái niệm một tên trên toàn hệ thống** (code, YAML, docs, skill, thảo luận). Code đã đổi ở P1–P4. P5 quét phần còn lại (docs/spec/architect/platform/skill/reference) và thêm guard để tên cũ không quay lại. Thuộc track [request-to-run](../261001-0327-request-to-run-track/plan.md).

## Bảng thuật ngữ (synthesis §6 D0, D3; §7d)

| Khái niệm | Tên dùng | Tên cũ phải bỏ |
|---|---|---|
| một phần việc | Unit | cell, step (của plan), dòng Product Gate |
| một lần chạy một Unit bằng Pattern cộng tác | Unit run | coordination session |
| cách làm xong một unit | Pattern cộng tác / `CollaborationPattern` (`solo`, `reviewed`, `panel` + preset) | FlowDefinition, CoordinationProtocol, protocol, Protocol Pack |
| chuỗi nhiều bước / dạng thảo luận nhiều pha | Workflow / Workflow run | Flow, "quy trình nghiệp vụ", profile Workflow, stage (như field Work) |
| checker phản biện | red-team | objector |
| bản ghi yêu cầu/board | Work | — |
| chọn người làm | `bind()` + bảng 5 mức | DemandFacts, matcher, `form`, prefer cũ, redirect |

Ngoại lệ: tài liệu **lịch sử** (`docs/history/**`, "Lịch sử quyết định", báo cáo trong `plans/reports/**`, archive) giữ nguyên văn — chỉ thêm ghi chú trỏ tên mới nếu cần.

## Phases và song song

| # | Phase | Phụ thuộc | Sóng | Sở hữu |
|---|---|---|---|---|
| 1 | [Làm tươi](./phase-01-refresh.md) | P4 merge | A | plan |
| 2 | [Quét docs theo area](./phase-02-docs-sweep.md) | 1 | **B** (song song theo area — mỗi agent một area, một worktree) | `docs/specs/<area>.md`, `docs/platform/<area>/**`, `docs/architect/<area>/**`, `core/skills/**/references/**` theo phân chia area |
| 3 | [Guard từ vựng + boundary cuối](./phase-03-vocabulary-guard-boundary.md) | 2 | C | `test/runner/dead-vocabulary-guard.test.mjs`, `docs/platform/component-boundary.md`, `docs/specs/reading-map.md` |

## Success Criteria

- [ ] Guard chặn tên cũ ở code + docs (ngoài vùng lịch sử).
- [ ] `docs/platform/component-boundary.md` phản ánh bản đồ cuối (L0–L7 sau track).
- [ ] Merge `main`; cập nhật track `plan.md` (trạng thái P5 = done). **Không đóng track**: G7 (herdr làm transport mặc định) + posture read-only còn mở ở plan riêng (owner 2026-10-02); track đóng sau plan đó.

## Risk Assessment

- Sửa nhầm tài liệu lịch sử → loại trừ đường dẫn lịch sử trong guard và trong quét.
- Song song theo area đụng file chung (`reading-map.md`, `component-boundary.md`) → chỉ phase 3 sửa các file đó.

<!-- slug: request-to-run-p5-terminology-sweep -->
