---
phase: 1
title: "Làm tươi"
status: pending
priority: P2
effort: "0.5d"
dependencies: []
---

# Phase 1: Làm tươi

## Overview

Đếm lại tên cũ còn sót sau P4 theo area; chia việc cho phase 2 song song; liệt kê vùng lịch sử loại trừ.

## Requirements

- Functional: bảng area → số lượt tên cũ → file; danh sách loại trừ.
- Non-functional: chỉ sửa plan.

## Related Code Files

- Modify: `phase-02-docs-sweep.md` (bảng chia area).

## Implementation Steps

1. Cổng: P4 merge `main`.
2. `rg -c "FlowDefinition|CoordinationProtocol|coordination protocol|Protocol Pack|objector|DemandFacts|readOnlyRedirects|\bstage\b" docs core domains AGENTS.md README.md` theo area; loại `docs/history/**`, mục "Lịch sử quyết định", `plans/**`, archive.
3. Chia area thành gói song song không chung file; ghi vào phase 2.
4. Commit plan.

## Success Criteria

- [ ] Bảng chia area đầy đủ; không gói nào chung file.

## Risk Assessment

- `\bstage\b` có nghĩa khác (stage của release, deploy) → lọc thủ công theo ngữ cảnh.
