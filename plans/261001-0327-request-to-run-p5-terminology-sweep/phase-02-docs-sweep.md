---
phase: 2
title: "Quét docs theo area"
status: complete
priority: P2
effort: "1–2d (song song theo area)"
dependencies: [1]
---

# Phase 2: Quét docs theo area

## Overview

Mỗi gói area (do phase 1 chia) được một agent quét trong worktree riêng: thay tên cũ bằng tên mới theo bảng thuật ngữ, sửa mô tả lỗi thời (engine coordination, DemandFacts, stage trên Work), giữ nguyên tài liệu lịch sử.

## Requirements

- Functional:
  - Theo bảng thuật ngữ trong [plan.md](./plan.md); mỗi thay thế đúng ngữ cảnh (không thay máy móc).
  - Không sửa vùng lịch sử; không sửa `docs/platform/component-boundary.md`, `docs/specs/reading-map.md` (phase 3).
  - Link nội bộ vẫn đúng sau khi đổi tên file/thư mục (kiểm bằng script link check hiện có nếu có).
- Non-functional: mỗi gói một commit, merge vào nhánh plan.

## Bảng phân chia các gói Area (Phase 1 chốt)

| Gói | Area / Thư mục | Số file | Các file tiêu biểu |
|---|---|---|---|
| **Gói A** | `core/skills/` và `domains/` | 5 | `core/skills/_shared/capability-matching.md`, `core/skills/fgos-architecture-panel/SKILL.md`, `core/skills/fgos-group-thinking/SKILL.md`, `core/skills/fgos-panel/SKILL.md`, `domains/coding/skills/_shared/coding-cell-policy.md` |
| **Gói B** | `docs/specs/` (trừ `reading-map.md` ở Phase 3) | 3 | `docs/specs/runner.md`, `docs/specs/distribution.md`, `docs/specs/work-state.md` |
| **Gói C** | End-user & Knowledge (`how-to`, `explanation`, `knowledge`, `distillery`) | ~23 | `docs/how-to/run-a-coordination-session.md`, `docs/how-to/use-fgos-group-thinking.md`, `docs/how-to/use-fgos-architecture-panel.md`, `docs/how-to/measure-a-real-case.md`, `docs/enduser-docs-index.json`, `docs/knowledge/**` (13 bài có stage/coordination), `docs/explanation/**`, `docs/distillery/deep-dives/tool-registry.md` |
| **Gói D** | `docs/platform/` (trừ `component-boundary.md` ở Phase 3) | ~29 | `docs/platform/packaging-distribution/README.md`, `contracts/skill-package-distribution.md`, `proposals/documentation-system-unification.md`, `agent-coordination/` (README.md, spec.md, vision.md, contracts, architecture, vocabulary — loại trừ `verification/` và `history/`) |
| **Gói E** | `docs/architect/` | ~28 | `docs/architect/roadmap.md`, `system-vision-trong-mem-ngoai-cung.md`, `workspace-topology-audit.md`, `agent-coordination/` (README.md, architecture, contracts, vocabulary — loại trừ `verification/` và `history/`) |

### Danh sách loại trừ (vùng lịch sử)

1. `docs/history/**` (toàn bộ giữ nguyên văn).
2. Mọi mục "Lịch sử quyết định", "Decision history", hoặc các block quyết định quá khứ (00xx, ADR-xxx).
3. Các artifact / log trong `verification/**` (`.log`, `.txt`, test runner capture json) ghi nhận trạng thái kiểm chứng quá khứ.
4. `plans/**` (các plan, phase, báo cáo nghiệm thu quá khứ).

## Related Code Files

- Modify: các file theo 5 gói Area ở trên.
## Implementation Steps

1. Mỗi agent: worktree từ nhánh plan; quét gói; link check; commit; merge.
2. Lead gom, chạy lại `rg` toàn repo.

## Success Criteria

- [x] `rg` tên cũ ngoài vùng lịch sử = 0 cho các gói đã xong.

## Risk Assessment

- Hai gói đụng cùng file vì phase 1 chia sai → merge conflict nhỏ; sửa ở bước gom.
